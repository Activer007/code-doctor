// src/workers/pyodide.worker.ts

// 定义 Worker 接收的消息类型
type WorkerMessage =
  | { type: 'INIT' }
  | { type: 'RUN'; code: string; id: string };

import { PYTHON_TRACER_mV1 } from '../python/tracer';

// 定义 Pyodide 的类型 (简化版)
interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<any>;
  runPython: (code: string) => any;
  loadPackage: (packages: string[]) => Promise<void>;
  setStdout: (options: { batched: (msg: string) => void }) => void;
  setStderr: (options: { batched: (msg: string) => void }) => void;
}

declare function importScripts(...urls: string[]): void;
declare function loadPyodide(config: { indexURL: string }): Promise<PyodideInterface>;

let pyodide: PyodideInterface | null = null;
let pyodideReadyPromise: Promise<void> | null = null;

const PYODIDE_VERSION = '0.24.1';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`;

// 初始化 Pyodide
async function initPyodide() {
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    try {
      console.log('Worker: Loading Pyodide from CDN...');
      importScripts(PYODIDE_URL);

      pyodide = await loadPyodide({
        indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
      });

      // 预加载常用库 (可选，根据需求开启，目前先保持轻量)
      // await pyodide.loadPackage(['numpy', 'pandas']);

      // 加载 Tracer 工具代码
      console.log('Worker: Installing Python Tracer...');
      pyodide.runPython(PYTHON_TRACER_mV1);

      console.log('Worker: Pyodide loaded successfully.');
    } catch (error) {
      console.error('Worker: Failed to load Pyodide', error);
      throw error;
    }
  })();

  return pyodideReadyPromise;
}

// 运行 Python 代码
async function runPythonCode(code: string, id: string) {
  if (!pyodide) await initPyodide();
  if (!pyodide) throw new Error('Pyodide failed to initialize');

  // 重置输出缓冲区
  let stdoutBuffer: string[] = [];
  let stderrBuffer: string[] = [];

  // 设置输出捕获
  pyodide.setStdout({
    batched: (msg) => stdoutBuffer.push(msg)
  });
  pyodide.setStderr({
    batched: (msg) => stderrBuffer.push(msg)
  });

  try {
    const startTime = performance.now();
    
    // 使用 Tracer 运行代码
    // 注意：我们需要转义代码中的引号，或者使用 Pyodide 的 globals 传递变量，这里简单起见使用 globals
    // 但 runPythonAsync 可以直接访问 JS 作用域，更安全的方式是将代码存入 Python 变量
    
    // 方法：将用户代码赋值给一个 Python 变量，然后传给 tracer
    // 简单的转义处理
    const escapedCode = code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const pythonCmd = `_global_tracer.run("${escapedCode}")`;
    
    // 执行
    const traceJson = await pyodide.runPythonAsync(pythonCmd);
    const traceData = JSON.parse(traceJson);

    const endTime = performance.now();

    self.postMessage({
      type: 'RESULT',
      id,
      success: true,
      result: 'Execution Complete', // Tracer 模式下主要看 Trace，返回值次要
      trace: traceData,
      stdout: stdoutBuffer.join('\n'),
      stderr: stderrBuffer.join('\n'),
      executionTime: endTime - startTime
    });
  } catch (error: any) {
    self.postMessage({
      type: 'RESULT',
      id,
      success: false,
      error: error.message,
      stdout: stdoutBuffer.join('\n'),
      stderr: stderrBuffer.join('\n')
    });
  }
}

// 消息监听
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data;

  switch (type) {
    case 'INIT':
      await initPyodide();
      self.postMessage({ type: 'READY' });
      break;
    case 'RUN':
      if ('code' in event.data && 'id' in event.data) {
        await runPythonCode(event.data.code, event.data.id);
      }
      break;
  }
};
