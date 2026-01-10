import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, GraduationCap } from 'lucide-react';
import { QuizQuestion } from '../services/quizService';

interface QuizCardProps {
  quiz: QuizQuestion;
  onComplete: (isCorrect: boolean) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsSubmitted(true);
    onComplete(index === quiz.correctIndex);
  };

  const isCorrect = selectedOption === quiz.correctIndex;

  return (
    <div className="mt-6 p-5 glass-panel rounded-xl border border-slate-700/50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <GraduationCap size={100} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 text-neon-blue">
          <GraduationCap size={20} />
          <h3 className="font-bold tracking-wider text-sm">PCEP 真题挑战</h3>
        </div>

        <p className="text-slate-200 font-medium mb-3">{quiz.question}</p>
        
        {quiz.code && (
          <pre className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 mb-4 overflow-x-auto">
            {quiz.code}
          </pre>
        )}

        <div className="space-y-2">
          {quiz.options.map((option, idx) => {
            let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";
            
            if (isSubmitted) {
              if (idx === quiz.correctIndex) {
                btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-200";
              } else if (idx === selectedOption) {
                btnClass += "bg-rose-500/20 border-rose-500 text-rose-200";
              } else {
                btnClass += "bg-slate-900/50 border-slate-800 text-slate-500 opacity-50";
              }
            } else {
              btnClass += "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-500 text-slate-300";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSubmit(idx)}
                disabled={isSubmitted}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isSubmitted && idx === quiz.correctIndex && <CheckCircle2 size={16} className="text-emerald-500" />}
                  {isSubmitted && idx === selectedOption && idx !== quiz.correctIndex && <XCircle size={16} className="text-rose-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className={`mt-4 p-3 rounded-lg text-xs leading-relaxed border ${isCorrect ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200' : 'bg-rose-950/20 border-rose-900/50 text-rose-200'}`}>
            <div className="font-bold flex items-center gap-2 mb-1">
              <HelpCircle size={14} /> 解析
            </div>
            {quiz.explanation}
          </div>
        )}
      </div>
    </div>
  );
};
