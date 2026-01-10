import React, { useEffect, useState } from 'react';
import Editor, { useMonaco, OnMount } from '@monaco-editor/react';
import { Terminal, Eraser } from 'lucide-react';
import { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  isAnalyzing: boolean;
  activeLine?: number; // 新增：控制当前高亮行
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, isAnalyzing, activeLine }) => {
  const monaco = useMonaco();
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [decorations, setDecorations] = useState<string[]>([]);

  // 定义自定义主题
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('code-doctor-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
          { token: 'string', foreground: 'f1fa8c' },
          { token: 'number', foreground: 'bd93f9' },
          { token: 'comment', foreground: '6272a4' },
        ],
        colors: {
          'editor.background': '#02061700', // 透明背景以透出噪声纹理
          'editor.lineHighlightBackground': '#1e293b50',
          'editorLineNumber.foreground': '#475569',
        }
      });
      monaco.editor.setTheme('code-doctor-dark');
    }
  }, [monaco]);

  // 处理行高亮
  useEffect(() => {
    if (!editorInstance || !monaco) return;

    if (activeLine && activeLine > 0) {
      // 创建高亮装饰器
      const newDecorations = editorInstance.deltaDecorations(decorations, [
        {
          range: new monaco.Range(activeLine, 1, activeLine, 1),
          options: {
            isWholeLine: true,
            className: 'bg-neon-green/20 border-l-2 border-neon-green', // Tailwind class won't work directly inside canvas, need CSS
            glyphMarginClassName: 'bg-neon-green w-2 h-2 rounded-full ml-1', // 断点图标位置
          }
        }
      ]);
      setDecorations(newDecorations);
      
      // 自动滚动到该行
      editorInstance.revealLineInCenter(activeLine);
    } else {
      // 清除高亮
      editorInstance.deltaDecorations(decorations, []);
      setDecorations([]);
    }
  }, [activeLine, editorInstance, monaco]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    setEditorInstance(editor);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-xl overflow-hidden shadow-2xl shadow-black/50 border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-neon-blue">
          <Terminal size={18} />
          <span className="font-mono text-sm font-bold tracking-wider">SOURCE_INPUT.py</span>
        </div>
        <button 
          onClick={() => onChange('')}
          className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1"
          disabled={isAnalyzing}
        >
          <Eraser size={14} />
          清空
        </button>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 bg-slate-950/50 pt-2">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="code-doctor-dark"
          value={value}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 10 },
            readOnly: isAnalyzing,
            domReadOnly: isAnalyzing,
            renderLineHighlight: 'all',
          }}
        />
      </div>
      
      {/* 注入自定义 CSS 样式以支持 decorations className */}
      <style>{`
        .bg-neon-green\/20 { background-color: rgba(16, 185, 129, 0.2) !important; }
        .border-neon-green { border-color: #10b981 !important; }
      `}</style>
    </div>
  );
};
