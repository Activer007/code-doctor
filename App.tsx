import React, { useEffect } from 'react';
import { Activity, Play, RotateCcw, Cpu, AlertTriangle, CheckCircle, BrainCircuit, Trash2, History } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { TraceMap } from './components/TraceMap';
import { FlashcardReview } from './components/FlashcardReview';
import HistorySidebar from './components/HistorySidebar';
import HistoryDetail from './components/HistoryDetail';
import { TutorChat } from './components/TutorChat';
import { useAppStore } from './stores/useAppStore';

import { ConsolePanel } from './components/ConsolePanel';
import { TracePlayer } from './components/TracePlayer';
import { QuizCard } from './components/QuizCard';

const App: React.FC = () => {
  // Use Zustand store
  const {
    // Editor State
    code, setCode,
    
    // Diagnosis State
    diagnosisState,
    diagnoseCode,
    resetDiagnosis,
    
    // Console/Runtime State
    consoleOutput,
    isRunning,
    runCode,
    
    // Trace State
    traceData,
    currentStep,
    isPlaying,
    setCurrentStep,
    incrementCurrentStep,
    setIsPlaying,
    
    // Quiz State
    activeQuiz,
    
    // Flashcard State
    flashcards,
    isReviewMode,
    setIsReviewMode,
    updateFlashcard,
    clearMasteredCards,
    
    // History State
    isHistoryOpen,
    selectedHistoryRecord,
    setIsHistoryOpen,
    setSelectedHistoryRecord,
    loadHistoryRecord
  } = useAppStore();

  // Trace Playback Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying && traceData.length > 0 && currentStep < traceData.length - 1) {
      interval = setInterval(() => {
        incrementCurrentStep();
      }, 500); // 500ms per step
    } else if (currentStep >= traceData.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, traceData, currentStep, incrementCurrentStep, setIsPlaying]);

  const activeCardsCount = flashcards.filter(c => c.stats.status !== 'mastered').length;

  const [activeTab, setActiveTab] = React.useState<'input' | 'report'>('input');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6 lg:p-8 font-sans bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20">

      {/* 历史记录侧边栏 */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRecord={loadHistoryRecord}
      />

      {/* 历史记录详情视图（覆盖模式） */}
      {selectedHistoryRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950">
          <HistoryDetail
            record={selectedHistoryRecord}
            onBack={() => setSelectedHistoryRecord(null)}
          />
        </div>
      )}

      {isReviewMode && (
        <FlashcardReview
          cards={flashcards}
          onClose={() => {
            console.log("[CodeDoctor] Closing review mode.");
            setIsReviewMode(false);
          }}
          onUpdateCard={updateFlashcard}
        />
      )}

      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Activity className="text-neon-green" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                CODE <span className="text-neon-green">DOCTOR</span>
              </h1>
              <p className="text-slate-500 text-sm font-mono">AI 逻辑溯源系统 // v1.1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* History Button */}
             <button
               onClick={() => setIsHistoryOpen(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 hover:bg-slate-800 transition-all text-sm font-bold"
             >
               <History size={16} />
               <span>历史记录</span>
             </button>

             {/* Flashcard Button */}
             <div className="relative">
                <button 
                  onClick={() => {
                    if (activeCardsCount > 0) {
                      console.log("[CodeDoctor] Opening review mode.");
                      setIsReviewMode(true);
                    }
                  }}
                  disabled={activeCardsCount === 0}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-bold
                    ${activeCardsCount > 0 
                      ? 'bg-slate-900 border-neon-blue text-neon-blue hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'}
                  `}
                >
                  <BrainCircuit size={16} />
                  <span>错题闪卡</span>
                  {activeCardsCount > 0 && (
                    <span className="bg-neon-blue text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {activeCardsCount}
                    </span>
                  )}
                </button>
             </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="hidden md:block px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
                系统状态: 在线
              </div>
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Mobile Tabs */}
        <div className="flex lg:hidden bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'input' ? 'bg-slate-800 text-neon-blue shadow-lg' : 'text-slate-500'}`}
          >
            代码输入
          </button>
          <button 
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'report' ? 'bg-slate-800 text-neon-green shadow-lg' : 'text-slate-500'}`}
          >
            诊断结果 {diagnosisState.status === 'complete' && <span className="inline-block w-2 h-2 rounded-full bg-neon-green ml-1"></span>}
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[600px]">
          
          {/* Left Column: Input */}
          <section className={`flex flex-col gap-4 ${activeTab === 'input' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <Cpu size={16} /> 输入终端 (INPUT TERMINAL)
              </h2>
            </div>
            
            <div className="flex-1 min-h-[400px] lg:min-h-0">
              <CodeEditor 
                value={code} 
                onChange={setCode} 
                isAnalyzing={diagnosisState.status === 'analyzing'}
                activeLine={traceData[currentStep]?.line}
              />
            </div>

            {traceData.length > 0 && (
              <TracePlayer 
                totalSteps={traceData.length}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
              />
            )}

            <ConsolePanel 
              output={consoleOutput.stdout} 
              error={consoleOutput.stderr}
              isRunning={isRunning} 
              onRun={runCode}
              executionTime={consoleOutput.time}
            />

            <button
              onClick={async () => {
                await diagnoseCode();
                if (window.innerWidth < 1024) setActiveTab('report');
              }}
              disabled={diagnosisState.status === 'analyzing' || !code.trim()}
              className={`
                relative w-full py-4 rounded-xl font-bold tracking-widest transition-all duration-300 overflow-hidden group
                ${diagnosisState.status === 'analyzing' 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-neon-green hover:bg-emerald-400 text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400'}
              `}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {diagnosisState.status === 'analyzing' ? (
                  <>
                    <RotateCcw className="animate-spin" size={20} />
                    正在诊断逻辑...
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" size={20} />
                    启动扫描
                  </>
                )}
              </span>
            </button>
          </section>

          {/* Right Column: Analysis */}
          <section className={`flex flex-col gap-4 ${activeTab === 'report' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-400 tracking-wider flex items-center gap-2">
                <Activity size={16} /> 诊断报告 (DIAGNOSTIC REPORT)
              </h2>
              {diagnosisState.status === 'complete' && (
                 <button onClick={resetDiagnosis} className="text-xs text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4">
                   重置视图
                 </button>
              )}
            </div>

            <div className={`
              flex-1 rounded-xl border p-6 overflow-y-auto max-h-[800px] transition-all duration-500 scroll-smooth
              ${diagnosisState.status === 'idle' ? 'bg-slate-900/30 border-slate-800 border-dashed flex items-center justify-center min-h-[400px]' : 'glass-panel border-slate-700/50'}
            `}>
              
              {diagnosisState.status === 'idle' && (
                <div className="text-center text-slate-600">
                  <Cpu size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="font-mono text-sm">等待输入流...</p>
                  {flashcards.length > 0 && (
                    <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800 max-w-sm">
                      <h4 className="text-slate-400 text-xs font-bold uppercase mb-2">错题集数据</h4>
                      <div className="flex justify-between text-sm">
                         <span>待复习: <span className="text-neon-blue">{activeCardsCount}</span></span>
                         <span>已掌握: <span className="text-emerald-500">{flashcards.length - activeCardsCount}</span></span>
                      </div>
                      {flashcards.length - activeCardsCount > 0 && (
                        <button onClick={clearMasteredCards} className="mt-2 text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1">
                          <Trash2 size={10} /> 清理已掌握卡片
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {diagnosisState.status === 'analyzing' && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-neon-green rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-neon-green font-mono text-sm animate-pulse">正在追踪逻辑流</p>
                    <p className="text-slate-500 text-xs">解析 AST... 提取病灶... 生成闪卡...</p>
                  </div>
                </div>
              )}

              {diagnosisState.status === 'error' && (
                 <div className="flex flex-col items-center justify-center h-full text-center p-8">
                   <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                     <AlertTriangle className="text-rose-500" size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">系统故障</h3>
                   <p className="text-rose-300/80 mb-6">{diagnosisState.error}</p>
                   <button onClick={diagnoseCode} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-mono border border-slate-700 transition-colors">
                     重试连接
                   </button>
                 </div>
              )}

              {diagnosisState.status === 'complete' && diagnosisState.result && (
                <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
                  {/* Summary Card */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border-l-4 border-l-neon-green border-y border-r border-slate-700 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">诊断摘要</h3>
                        <p className="text-lg text-slate-100 font-medium leading-relaxed">
                          {diagnosisState.result.rawError}
                        </p>
                      </div>
                      {diagnosisState.result.generatedFlashcards && diagnosisState.result.generatedFlashcards.length > 0 && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded px-3 py-2 flex flex-col items-center">
                           <BrainCircuit className="text-neon-blue mb-1" size={18} />
                           <span className="text-[10px] text-blue-300 font-bold">+{diagnosisState.result.generatedFlashcards.length} 闪卡</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* The Metro Map */}
                  <div className="relative">
                    <TraceMap trace={diagnosisState.result.trace} />
                  </div>

                  {/* Quiz Recommendation */}
                  {activeQuiz && (
                    <div className="animate-[slideUp_0.6s_ease-out]">
                      <QuizCard 
                        quiz={activeQuiz} 
                        onComplete={(isCorrect) => {
                          console.log("Quiz completed. Correct:", isCorrect);
                          // TODO: Add XP or save to stats
                        }} 
                      />
                    </div>
                  )}
                  
                  {/* Final Status */}
                  <div className="flex items-center justify-center pt-8 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
                       <CheckCircle size={14} />
                       <span>分析完成_时间戳_{Date.now()}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        </main>
      </div>
      <TutorChat />
    </div>
  );
};

export default App;
