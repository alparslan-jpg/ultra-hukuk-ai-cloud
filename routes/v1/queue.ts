import { Router, Response } from 'express';
import { requireRole, AuthenticatedRequest } from '../middleware/rbac';

export const queueRouter = Router();

export interface AsyncJob {
  id: string;
  jobType: 'ai_deep_analysis' | 'multi_agent_simulation' | 'uyap_batch_import' | 'smm_batch_generate';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 1 | 2 | 3;
  progressPercent: number;
  payload: any;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const jobQueueStore: Map<string, AsyncJob> = new Map();

// Helper to simulate background task execution
function processJobInBackground(jobId: string) {
  const job = jobQueueStore.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.progressPercent = 25;
  job.updatedAt = new Date().toISOString();

  setTimeout(() => {
    const current = jobQueueStore.get(jobId);
    if (!current) return;
    current.progressPercent = 65;
    current.updatedAt = new Date().toISOString();

    setTimeout(() => {
      const finalJob = jobQueueStore.get(jobId);
      if (!finalJob) return;

      finalJob.status = 'completed';
      finalJob.progressPercent = 100;
      finalJob.completedAt = new Date().toISOString();
      finalJob.updatedAt = new Date().toISOString();

      if (finalJob.jobType === 'ai_deep_analysis') {
        finalJob.result = {
          analysisCompleted: true,
          processedEvrakCount: 8,
          findings: ['Zamanaşımı defi riski tespit edildi', 'HMK 200 senet sınırı geçerli'],
          recommendedAction: 'Cevap süresi içinde delil listesi ikame edilmelidir.'
        };
      } else if (finalJob.jobType === 'multi_agent_simulation') {
        finalJob.result = {
          simulationCompleted: true,
          winningProbability: 82,
          criticalPointsCount: 4
        };
      } else {
        finalJob.result = { success: true, processedItems: 12 };
      }
    }, 1500);
  }, 1000);
}

// POST /api/v1/queue/enqueue — Kuyruğa Ağır İş Ekle
queueRouter.post('/enqueue', requireRole(['yonetici', 'avukat']), (req: AuthenticatedRequest, res: Response) => {
  const { jobType, payload, priority = 1 } = req.body;

  if (!jobType) {
    return res.status(400).json({ success: false, message: 'İş türü (jobType) belirtilmelidir.' });
  }

  const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newJob: AsyncJob = {
    id: jobId,
    jobType,
    status: 'queued',
    priority: priority || 1,
    progressPercent: 0,
    payload: payload || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jobQueueStore.set(jobId, newJob);

  // Trigger non-blocking async execution
  setImmediate(() => processJobInBackground(jobId));

  return res.status(202).json({
    success: true,
    message: 'Görev asenkron işlem kuyruğuna alındı.',
    jobId,
    status: 'queued',
    pollUrl: `/api/v1/queue/jobs/${jobId}`
  });
});

// GET /api/v1/queue/jobs/:id — Görev Durumunu Sorgula
queueRouter.get('/jobs/:id', requireRole(['yonetici', 'avukat', 'stajyer']), (req: AuthenticatedRequest, res: Response) => {
  const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = jobQueueStore.get(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Belirtilen görev kuyrukta bulunamadı.' });
  }
  return res.json({ success: true, job });
});

// GET /api/v1/queue/stats — Kuyruk İstatistikleri
queueRouter.get('/stats', requireRole(['yonetici', 'avukat', 'stajyer']), (_req: AuthenticatedRequest, res: Response) => {
  const all = Array.from(jobQueueStore.values());
  return res.json({
    success: true,
    stats: {
      totalJobs: all.length,
      queued: all.filter((j) => j.status === 'queued').length,
      processing: all.filter((j) => j.status === 'processing').length,
      completed: all.filter((j) => j.status === 'completed').length,
      failed: all.filter((j) => j.status === 'failed').length
    }
  });
});
