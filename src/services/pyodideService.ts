// src/services/pyodideService.ts

type ExecutionResult = {
  success: boolean;
  result?: string;
  error?: string;
  stdout: string;
  stderr: string;
  executionTime?: number;
  trace?: any[]; // 新增 trace 字段
};

class PyodideService {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private pendingExecutions: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return; // SSR check

    // 使用 Vite 的 worker 导入方式
    this.worker = new Worker(new URL('../workers/pyodide.worker.ts', import.meta.url), {
      type: 'module' // 重要：允许在 worker 中使用 ES modules (如果未来需要)
    });

    this.worker.onmessage = (event) => {
      const { type, id, ...data } = event.data;

      if (type === 'READY') {
        this.isReady = true;
        console.log('PyodideService: Worker is ready');
      } else if (type === 'RESULT') {
        const promise = this.pendingExecutions.get(id);
        if (promise) {
          promise.resolve(data as ExecutionResult);
          this.pendingExecutions.delete(id);
        }
      }
    };

    // 触发初始化
    this.worker.postMessage({ type: 'INIT' });
  }

  public async runPython(code: string): Promise<ExecutionResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = Math.random().toString(36).substring(7);
    
    return new Promise((resolve, reject) => {
      this.pendingExecutions.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'RUN',
        code,
        id
      });

      // 超时处理 (例如 10秒)
      setTimeout(() => {
        if (this.pendingExecutions.has(id)) {
          this.pendingExecutions.delete(id);
          reject(new Error('Execution timed out'));
        }
      }, 10000);
    });
  }

  public getStatus(): boolean {
    return this.isReady;
  }
}

export const pyodideService = new PyodideService();
