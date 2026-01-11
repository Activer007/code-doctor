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


let pyodide: PyodideInterface | null = null;
let pyodideReadyPromise: Promise<void> | null = null;

const PYODIDE_VERSION = '0.24.1';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;

// 初始化 Pyodide
async function initPyodide() {
  if (pyodideReadyPromise) return pyodideReadyPromise;

  pyodideReadyPromise = (async () => {
    try {
      console.log('Worker: Loading Pyodide from CDN...');
      
      // Use dynamic import for module worker support
      const { loadPyodide } = await import(PYODIDE_URL) as {
        loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>
      };

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
    batched: (msg) => {
      console.log('Python stdout:', msg);
      stdoutBuffer.push(msg);
    }
  });
  pyodide.setStderr({
    batched: (msg) => {
      console.error('Python stderr:', msg);
      stderrBuffer.push(msg);
    }
  });

  try {
    const startTime = performance.now();
    
    // 将代码存入 Python 全局变量，避免转义问题
    // @ts-ignore - pyodide globals access
    pyodide.globals.set("_user_code_to_run", code);
    
    // 执行 tracer.run
    const pythonCmd = \`_global_tracer.run(_user_code_to_run)\`;
    const traceJson = await pyodide.runPythonAsync(pythonCmd);
    
    let traceData;
    try {
      traceData = JSON.parse(traceJson);
    } catch (parseError: any) {
      throw new Error(\`Failed to parse execution trace: \${parseError.message}\`);
    }
    
    const endTime = performance.now();

    // 检查 traceData 是否包含顶层错误（如语法错误）
    const hasTopLevelError = Array.isArray(traceData) && traceData.length > 0 && traceData[0].status === 'error' && traceData[0].title === '语法错误';

    self.postMessage({
      type: 'RESULT',
      id,
      success: !hasTopLevelError,
      result: 'Execution Complete',
      trace: traceData,
      stdout: stdoutBuffer.join('\n'),
      stderr: stderrBuffer.join('\n'),
      executionTime: endTime - startTime
    });
  } catch (error: any) {
    console.error('Worker execution error:', error);
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
