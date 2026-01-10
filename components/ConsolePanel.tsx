import React, { useEffect, useRef } from 'react';
import { Terminal, Play, XCircle, Clock } from 'lucide-react';

interface ConsolePanelProps {
  output: string;
  error?: string;
  isRunning: boolean;
  onRun: () => void;
  executionTime?: number;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ 
  output, 
  error, 
  isRunning, 
  onRun,
  executionTime 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, error]);

  return (
    <div className="flex flex-col h-48 mt-4 glass-panel rounded-xl overflow-hidden shadow-xl border-slate-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal size={14} />
          <span className="font-mono text-xs font-bold tracking-wider">TERMINAL OUTPUT</span>
        </div>
        <div className="flex items-center gap-3">
          {executionTime !== undefined && (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Clock size={10} />
              {executionTime.toFixed(2)}ms
            </div>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`
              flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all
              ${isRunning 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border border-neon-green/30'}
            `}
          >
            {isRunning ? (
              <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play size={10} fill="currentColor" />
            )}
            RUN CODE
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-slate-950 p-3 font-mono text-xs overflow-y-auto leading-relaxed"
      >
        {output || error ? (
          <>
            {output && <div className="text-slate-300 whitespace-pre-wrap">{output}</div>}
            {error && (
              <div className="text-rose-400 whitespace-pre-wrap mt-2 flex items-start gap-2 border-t border-rose-900/30 pt-2">
                <XCircle size={12} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 select-none">
            <Terminal size={24} className="mb-2 opacity-50" />
            <p>Ready to execute...</p>
          </div>
        )}
      </div>
    </div>
  );
};
