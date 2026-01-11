import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, BrainCircuit, Trophy, RotateCcw, Frown, Smile, Sparkles } from 'lucide-react';
import { Flashcard } from '../types';
import { Rating } from 'ts-fsrs';

interface FlashcardReviewProps {
  cards: Flashcard[];
  onClose: () => void;
  onUpdateCard: (id: string, isCorrect: boolean, rating?: Rating) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ cards, onClose, onUpdateCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState<'correct' | 'incorrect' | null>(null);
  
  // Filter out mastered cards for the review session
  const activeCards = cards.filter(c => c.stats.status !== 'mastered');
  
  const currentCard = activeCards[currentIndex];

  useEffect(() => {
    setUserInput('');
    setShowResult(null);
  }, [currentIndex, activeCards.length]);

  if (activeCards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
        <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-emerald-400 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">挑战完成！</h2>
          <p className="text-slate-400 mb-8">所有的错题都已被你攻克。</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors border border-slate-700"
          >
            返回主控台
          </button>
        </div>
      </div>
    );
  }

  if (!currentCard) return null;

  const handleCheck = () => {
    const normalize = (str: string) => str.replace(/\s+/g, '').trim();
    const isCorrect = normalize(userInput) === normalize(currentCard.backCode);
    
    setShowResult(isCorrect ? 'correct' : 'incorrect');
    
    // If incorrect, we immediately update with "Again"
    if (!isCorrect) {
      onUpdateCard(currentCard.id, false, Rating.Again);
    }
  };

  const handleRate = (rating: Rating) => {
    onUpdateCard(currentCard.id, true, rating);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
    setShowResult(null);
    setUserInput('');
  };

  const isCritical = currentCard.stats.status === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="absolute top-6 right-6">
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className={`
        relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden border transition-colors duration-500 shadow-2xl
        ${isCritical ? 'border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]' : 'border-slate-700 shadow-black/50'}
      `}>
        
        <div className="h-1 bg-slate-800 w-full">
          <div 
            className="h-full bg-neon-blue transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / activeCards.length) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${isCritical ? 'bg-rose-950/30 text-rose-400 border-rose-500/30' : 'bg-blue-950/30 text-blue-400 border-blue-500/30'}`}>
                  {isCritical ? 'CRITICAL_MODE' : 'CONCEPT_CARD'}
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  {currentIndex + 1} / {activeCards.length}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <BrainCircuit size={24} className={isCritical ? 'text-rose-500' : 'text-neon-blue'} />
                {currentCard.concept}
              </h2>
            </div>
            
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full border border-slate-700 ${i < currentCard.stats.correctStreak ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-950/50 rounded-lg p-4 border border-rose-900/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2 py-1 bg-rose-950/50 text-rose-500 text-[10px] font-mono border-bl rounded-bl">PATHOLOGY</div>
              <pre className="font-mono text-sm text-rose-200/80 line-through decoration-rose-500/50 whitespace-pre-wrap">
                {currentCard.frontCode}
              </pre>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                修复代码 (输入正确逻辑)
              </label>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={showResult !== null}
                onKeyDown={(e) => e.key === 'Enter' && !showResult && handleCheck()}
                className={`
                  w-full bg-slate-800/50 border rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none transition-all
                  ${showResult === 'correct' ? 'border-emerald-500 bg-emerald-500/10' : 
                    showResult === 'incorrect' ? 'border-rose-500 bg-rose-500/10' : 
                    'border-slate-700 focus:border-neon-blue focus:bg-slate-800'}
                `}
                placeholder="在此输入修复后的代码..."
                autoFocus
              />
              
              {showResult === 'incorrect' && (
                <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 animate-[slideDown_0.2s_ease-out]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-full text-rose-500">
                      <X size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 text-rose-400">修复失败</h4>
                      <p className="text-sm text-slate-400 leading-relaxed mb-2">
                        {currentCard.explanation}
                      </p>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                         <span className="text-xs text-slate-500 block mb-1">参考答案:</span>
                         <code className="text-emerald-400 font-mono text-sm">{currentCard.backCode}</code>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleNext}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    下一张 <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {showResult === 'correct' && (
                <div className="mt-4 p-6 rounded-xl bg-slate-950 border border-emerald-500/30 animate-[slideDown_0.2s_ease-out] shadow-xl shadow-emerald-500/5">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="text-emerald-400" size={24} />
                    </div>
                    <h4 className="text-xl font-bold text-emerald-400">逻辑修复成功！</h4>
                    <p className="text-sm text-slate-400 mt-1">请根据刚才的掌握程度为自己评分：</p>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <button 
                      onClick={() => handleRate(Rating.Again)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group"
                    >
                      <RotateCcw size={20} className="text-slate-500 group-hover:text-rose-400" />
                      <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-rose-400">遗忘</span>
                    </button>
                    <button 
                      onClick={() => handleRate(Rating.Hard)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
                    >
                      <Frown size={20} className="text-slate-500 group-hover:text-amber-400" />
                      <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-amber-400">吃力</span>
                    </button>
                    <button 
                      onClick={() => handleRate(Rating.Good)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                    >
                      <Smile size={20} className="text-slate-500 group-hover:text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-emerald-400">掌握</span>
                    </button>
                    <button 
                      onClick={() => handleRate(Rating.Easy)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-neon-blue/50 hover:bg-blue-500/5 transition-all group"
                    >
                      <Sparkles size={20} className="text-slate-500 group-hover:text-neon-blue" />
                      <span className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-neon-blue">太简单</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!showResult && (
              <button
                onClick={handleCheck}
                disabled={!userInput.trim()}
                className="w-full py-3 bg-neon-blue hover:bg-blue-400 text-slate-950 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                验证修复方案
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};