// ============================================================
// ULTRA HUKUK AI — Otomatik Sistem Kurtarma (Circuit Breaker) Servisi
// Görevi: Yapay zeka servislerinde (Gemini vs.) 503, timeout veya kota
// kesintisi yaşandığında uygulamanın çökmesini önlemek, devreyi açarak
// otomatik olarak yedek modele (Claude/Anthropic veya deterministik kurallara)
// geçmek ve iyileşme olduğunda devreyi kendi kendine onarmak (Self-Healing).
// ============================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Kaç ardışık hatada devre açılsın (Örn: 3)
  cooldownPeriodMs: number; // Devre açıkken kaç ms sonra deneme yapılsın (Örn: 20.000 ms)
  timeoutMs: number; // İşlem zaman aşımı eşiği (Örn: 25.000 ms)
}

export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalFallbackActivations: number;
  lastFailureTime: string | null;
  lastSuccessTime: string | null;
  lastErrorReason: string | null;
}

export class CircuitBreaker {
  private static instances: Map<string, CircuitBreaker> = new Map();

  private name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalFallbackActivations: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastErrorReason: string | null = null;
  private config: CircuitBreakerConfig;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      cooldownPeriodMs: config?.cooldownPeriodMs ?? 20000,
      timeoutMs: config?.timeoutMs ?? 25000
    };
  }

  public static getInstance(name: string = 'gemini-ai-core', config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.instances.has(name)) {
      this.instances.set(name, new CircuitBreaker(name, config));
    } else if (config) {
      const existing = this.instances.get(name)!;
      existing.config = { ...existing.config, ...config };
    }
    return this.instances.get(name)!;
  }

  public static getAllStatuses(): CircuitBreakerMetrics[] {
    return Array.from(this.instances.values()).map(b => b.getMetrics());
  }

  public getMetrics(): CircuitBreakerMetrics {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalFallbackActivations: this.totalFallbackActivations,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      lastErrorReason: this.lastErrorReason
    };
  }

  /**
   * Birincil ve yedek modeli devre kesici kontrolü altında yürütür
   */
  public async execute<T>(
    primaryFn: () => Promise<T>,
    fallbackFn?: (err: any) => Promise<T>
  ): Promise<T> {
    const now = Date.now();

    // 1. Devre OPEN durumunda ise: Soğuma süresi geçti mi kontrol et
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && now - this.lastFailureTime >= this.config.cooldownPeriodMs) {
        console.log(`[Circuit Breaker: ${this.name}] Soğuma süresi tamamlandı, HALF_OPEN moduna geçiliyor (Deneme isteği)...`);
        this.state = 'HALF_OPEN';
      } else {
        // Devre hala AÇIK: Doğrudan yedek modele geç
        this.totalFallbackActivations++;
        console.warn(`[Circuit Breaker: ${this.name}] Devre AÇIK (OPEN). Ana model çağrısı atlanarak derhal YEDEK modele geçiliyor.`);
        if (fallbackFn) {
          return await fallbackFn(new Error(`Circuit Breaker is OPEN (${this.lastErrorReason || 'Primary degraded'})`));
        }
        throw new Error(`Circuit Breaker is OPEN (${this.lastErrorReason || 'Primary degraded'})`);
      }
    }

    // 2. Birincil modeli zaman aşımı koruması ile çalıştır
    try {
      const result = await this.executeWithTimeout(primaryFn, this.config.timeoutMs);
      this.onSuccess();
      return result;
    } catch (err: any) {
      this.onFailure(err);
      this.totalFallbackActivations++;
      console.warn(`[Circuit Breaker: ${this.name}] Ana model başarısız oldu (${err?.message || err}). Self-healing yedek modele geçiliyor...`);
      if (fallbackFn) {
        return await fallbackFn(err);
      }
      throw err;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`İşlem zaman aşımına uğradı (${timeoutMs} ms)`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.lastSuccessTime = Date.now();
    if (this.state === 'HALF_OPEN') {
      console.log(`[Circuit Breaker: ${this.name}] Deneme isteği başarılı oldu! Devre kapandı (CLOSED / Tam Normale Döndü).`);
      this.state = 'CLOSED';
    }
  }

  private onFailure(err: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.lastErrorReason = err?.message || String(err);

    if (this.failureCount >= this.config.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      console.error(
        `🚨 [Circuit Breaker: ${this.name}] Hata eşiği aşıldı (${this.failureCount}/${this.config.failureThreshold}). DEVRE AÇILDI (OPEN). Ana model devre dışı bırakıldı, tüm trafik yedek modele yönlendirildi!`
      );
    }
  }
}
