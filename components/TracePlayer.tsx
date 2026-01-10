import React from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind } from 'lucide-react';

interface TracePlayerProps {
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const TracePlayer: React.FC<TracePlayerProps> = ({ 
  totalSteps, 
  currentStep, 
  onStepChange, 
  isPlaying, 
  onPlayPause 
}) => {
  if (totalSteps === 0) return null;

  return (
    <div className="flex items-center justify-between p-2 mt-2 bg-slate-900 border border-slate-800 rounded-lg">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onStepChange(0)}
          disabled={currentStep === 0}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <SkipBack size={16} />
        </button>
        <button 
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <Rewind size={16} />
        </button>
        
        <button 
          onClick={onPlayPause}
          className="p-2 bg-neon-blue/10 text-neon-blue rounded-full hover:bg-neon-blue/20 transition-colors"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>

        <button 
          onClick={() => onStepChange(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep >= totalSteps - 1}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <FastForward size={16} />
        </button>
        <button 
          onClick={() => onStepChange(totalSteps - 1)}
          disabled={currentStep >= totalSteps - 1}
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
        >
          <SkipForward size={16} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-1 mx-4">
        <input 
          type="range" 
          min="0" 
          max={totalSteps - 1} 
          value={currentStep} 
          onChange={(e) => onStepChange(parseInt(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
        />
        <div className="text-xs font-mono text-slate-400 min-w-[60px] text-right">
          {currentStep + 1} / {totalSteps}
        </div>
      </div>
    </div>
  );
};
