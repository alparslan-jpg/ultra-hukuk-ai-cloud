// ============================================================
// ULTRA HUKUK AI — API Maliyet, Rate Limit ve Asenkron Kuyruk Motoru
// Görevi: Token tüketimini ve maliyetini avukat/sicil bazında denetlemek,
// limit aşımı veya ani yüklenmelerde sistemi kilitlemek yerine
// istekleri akıllı öncelikli kuyruğa alarak sırayla tüketmek.
// ============================================================

import { db } from './persistentDatabaseService';
import { Request, Response, NextFunction } from 'express';

export interface LawyerQuotaStatus {
  lawyerSicilNo: string;
  usageDate: string;
  tokensUsed: number;
  requestsCount: number;
  dailyTokenLimit: number;
  remainingTokens: number;
  costEstimateUsd: number;
  isThrottled: boolean;
  queuedRequestsCount: number;
}

interface QueuedAiTask<T = any> {
  id: string;
  lawyerSicilNo: string;
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  enqueuedAt: number;
  priority: number;
}

// In-memory Fast Quota Cache & Queue
const quotaMemoryCache: Map<string, { tokens: number; requests: number; date: string; cost: number }> = new Map();
const aiTaskQueue: QueuedAiTask[] = [];
let isQueueProcessing = false;
const MAX_CONCURRENT_LLM_REQUESTS = 3;
let activeLlmRequestCount = 0;

export class AiRateLimiterAndQueue {
  private static readonly DEFAULT_DAILY_LIMIT = 1_000_000; // 1.000.000 Token Günlük Limit
  private static readonly INPUT_TOKEN_COST_PER_MILLION = 0.15; // $0.15 / 1M
  private static readonly OUTPUT_TOKEN_COST_PER_MILLION = 0.60; // $0.60 / 1M

  /**
   * Günlük kota durumunu getirir (Neon SQL + Hafıza önbelleği)
   */
  public static async getQuotaStatus(lawyerSicil: string): Promise<LawyerQuotaStatus> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${lawyerSicil}_${today}`;
    let cached = quotaMemoryCache.get(cacheKey);

    const sql = db.getSql();
    if (!cached && sql) {
      try {
        const rows = await sql`
          SELECT tokens_used, requests_count, daily_token_limit, cost_estimate_usd, is_throttled
          FROM ai_quota
          WHERE lawyer_sicil_no = ${lawyerSicil} AND usage_date = ${today}::date
        `;
        if (rows.length > 0) {
          const r = rows[0];
          cached = {
            tokens: Number(r.tokens_used || 0),
            requests: Number(r.requests_count || 0),
            date: today,
            cost: Number(r.cost_estimate_usd || 0)
          };
          quotaMemoryCache.set(cacheKey, cached);
        }
      } catch (err: any) {
        console.warn('[AiQuota DB Fetch Warning]:', err?.message);
      }
    }

    const tokensUsed = cached?.tokens || 0;
    const requestsCount = cached?.requests || 0;
    const costEstimate = cached?.cost || 0;
    const dailyLimit = this.DEFAULT_DAILY_LIMIT;
    const remaining = Math.max(0, dailyLimit - tokensUsed);
    const isThrottled = remaining <= 0 || tokensUsed >= dailyLimit * 0.95;

    const queuedCount = aiTaskQueue.filter(q => q.lawyerSicilNo === lawyerSicil).length;

    return {
      lawyerSicilNo: lawyerSicil,
      usageDate: today,
      tokensUsed,
      requestsCount,
      dailyTokenLimit: dailyLimit,
      remainingTokens: remaining,
      costEstimateUsd: costEstimate,
      isThrottled,
      queuedRequestsCount: queuedCount
    };
  }

  /**
   * Harcanan token miktarını kaydeder ve maliyeti günceller
   */
  public static async recordUsage(
    lawyerSicil: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${lawyerSicil}_${today}`;
    const totalTokens = inputTokens + outputTokens;
    const costIncrement =
      (inputTokens / 1_000_000) * this.INPUT_TOKEN_COST_PER_MILLION +
      (outputTokens / 1_000_000) * this.OUTPUT_TOKEN_COST_PER_MILLION;

    let current = quotaMemoryCache.get(cacheKey) || {
      tokens: 0,
      requests: 0,
      date: today,
      cost: 0
    };

    current.tokens += totalTokens;
    current.requests += 1;
    current.cost += costIncrement;
    quotaMemoryCache.set(cacheKey, current);

    // Neon SQL kaydı (Upsert)
    const sql = db.getSql();
    if (sql) {
      try {
        const quotaId = `quota-${lawyerSicil}-${today}`;
        const isThrottled = current.tokens >= this.DEFAULT_DAILY_LIMIT;
        await sql`
          INSERT INTO ai_quota (
            id, lawyer_sicil_no, usage_date, tokens_used, requests_count, 
            daily_token_limit, cost_estimate_usd, is_throttled, created_at, updated_at
          ) VALUES (
            ${quotaId}, ${lawyerSicil}, ${today}::date, ${current.tokens}, ${current.requests}, 
            ${this.DEFAULT_DAILY_LIMIT}, ${current.cost}, ${isThrottled}, NOW(), NOW()
          )
          ON CONFLICT (lawyer_sicil_no, usage_date) DO UPDATE
          SET tokens_used = ai_quota.tokens_used + ${totalTokens},
              requests_count = ai_quota.requests_count + 1,
              cost_estimate_usd = ai_quota.cost_estimate_usd + ${costIncrement},
              is_throttled = ${isThrottled},
              updated_at = NOW()
        `;
      } catch (err: any) {
        console.warn('[AiQuota DB Save Warning]:', err?.message);
      }
    }
  }

  /**
   * İstekleri eşzamanlı kilitlenme olmadan asenkron kuyruğa alıp işleyen motor
   */
  public static enqueueAiTask<T>(
    lawyerSicil: string,
    taskFn: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskItem: QueuedAiTask<T> = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        lawyerSicilNo: lawyerSicil,
        task: taskFn,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        priority
      };

      aiTaskQueue.push(taskItem);
      // Önceliğe göre sırala (Yüksek öncelik önce gelir)
      aiTaskQueue.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);

      this.processNextInQueue();
    });
  }

  private static async processNextInQueue(): Promise<void> {
    if (activeLlmRequestCount >= MAX_CONCURRENT_LLM_REQUESTS || aiTaskQueue.length === 0) {
      return;
    }

    const nextItem = aiTaskQueue.shift();
    if (!nextItem) return;

    activeLlmRequestCount++;

    try {
      const result = await nextItem.task();
      nextItem.resolve(result);
    } catch (err) {
      nextItem.reject(err);
    } finally {
      activeLlmRequestCount--;
      // Kuyruktaki bir sonraki işleme devam et
      setImmediate(() => this.processNextInQueue());
    }
  }

  /**
   * Express Middleware: Kota kontrolü ve Hız Kısıtlaması (Rate Limit)
   */
  public static middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const sicil = (req as any).user?.sicilNo || (req.headers['x-lawyer-sicil'] as string) || '8109';
      try {
        const quota = await AiRateLimiterAndQueue.getQuotaStatus(sicil);
        res.setHeader('X-AI-Daily-Quota-Remaining', quota.remainingTokens.toString());
        res.setHeader('X-AI-Queue-Depth', quota.queuedRequestsCount.toString());

        // Kota tükendiyse kullanıcıyı engellemek yerine kuyruğa aktarma bilgisi ver
        if (quota.isThrottled) {
          req.headers['x-ai-priority'] = 'low'; // Düşük öncelikle kuyruğa aktarılır
        }
        next();
      } catch {
        next();
      }
    };
  }
}
