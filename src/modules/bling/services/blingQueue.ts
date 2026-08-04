import { logger } from '@/shared/utils/logger';

interface QueueItem<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

interface QueueOptions {
  concurrency: number;
  delayBetweenRequests: number;
  maxRetries: number;
  retryDelay: number;
}

interface QueueStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
}

export class BlingQueue {
  private queue: QueueItem<any>[] = [];
  private running = 0;
  private stats: QueueStats = { total: 0, completed: 0, failed: 0, pending: 0, running: 0 };
  private processing = false;
  private readonly options: QueueOptions;

  constructor(options?: Partial<QueueOptions>) {
    this.options = {
      concurrency: options?.concurrency ?? 2,
      delayBetweenRequests: options?.delayBetweenRequests ?? 500,
      maxRetries: options?.maxRetries ?? 3,
      retryDelay: options?.retryDelay ?? 2000,
    };
  }

  async add<T>(id: string, execute: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, execute, resolve, reject });
      this.stats.total++;
      this.stats.pending++;
      this.processNext();
    });
  }

  async addBatch<T>(items: { id: string; execute: () => Promise<T> }[]): Promise<T[]> {
    const promises = items.map(item => this.add(item.id, item.execute));
    return Promise.all(promises);
  }

  private async processNext(): Promise<void> {
    if (this.running >= this.options.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.running++;
    this.stats.running = this.running;
    this.stats.pending = this.queue.length;

    try {
      const result = await this.executeWithRetry(item);
      item.resolve(result);
      this.stats.completed++;
    } catch (error) {
      item.reject(error);
      this.stats.failed++;
    } finally {
      this.running--;
      this.stats.running = this.running;

      if (this.queue.length > 0) {
        await this.delay(this.options.delayBetweenRequests);
        this.processNext();
      }
    }
  }

  private async executeWithRetry<T>(item: QueueItem<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await item.execute();
      } catch (error: any) {
        lastError = error;

        if (error.response?.status === 429 && attempt < this.options.maxRetries) {
          const retryAfter = error.response?.headers?.['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.options.retryDelay * attempt;

          logger.warn(`[QUEUE] Rate limit atingido para ${item.id}. Tentativa ${attempt}/${this.options.maxRetries}. Aguardando ${waitTime}ms...`);
          await this.delay(waitTime);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): QueueStats {
    return { ...this.stats };
  }

  getProgress(): number {
    if (this.stats.total === 0) return 0;
    return Math.round(((this.stats.completed + this.stats.failed) / this.stats.total) * 100);
  }

  isIdle(): boolean {
    return this.running === 0 && this.queue.length === 0;
  }

  async waitUntilIdle(): Promise<void> {
    while (!this.isIdle()) {
      await this.delay(100);
    }
  }

  clear(): void {
    this.queue.forEach(item => item.reject(new Error('Queue cleared')));
    this.queue = [];
    this.stats.pending = 0;
  }
}
