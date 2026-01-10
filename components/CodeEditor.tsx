import React, { useRef, useState } from 'react';
import { Terminal, Eraser } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  isAnalyzing: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, isAnalyzing }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    setLineCount(val.split('\n').length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    '; // 4 spaces for Python

      const newValue = value.substring(0, start) + spaces + value.substring(end);
      onChange(newValue);

      // Move caret
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  const handleClear = () => {
    onChange('');
    setLineCount(1);
    if (textareaRef.current) textareaRef.current.focus();
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
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1"
          disabled={isAnalyzing}
        >
          <Eraser size={14} />
          清空
        </button>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 bg-slate-950 font-mono text-sm overflow-hidden group">
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-900/50 border-r border-slate-800 text-right pr-3 pt-4 text-slate-600 select-none font-mono leading-6">
          {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          disabled={isAnalyzing}
          placeholder="# 在此粘贴 Python 代码...&#10;def hello():&#10;    print('你好，世界')"
          className="absolute inset-0 pl-14 pr-4 pt-4 w-full h-full bg-transparent resize-none text-slate-300 focus:outline-none focus:ring-0 leading-6 selection:bg-neon-blue/20"
        />
      </div>
    </div>
  );
};