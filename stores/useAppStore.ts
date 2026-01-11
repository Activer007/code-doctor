import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DiagnosisState, Flashcard, HistoryRecord } from '../types';
import { QuizQuestion, getRecommendedQuiz } from '../services/quizService';
import { analyzeCode } from '../services/geminiService';
import { addHistoryRecord } from '../services/historyService';
import { pyodideService } from '../services/pyodideService';
import { FSRS, Rating, generatorParameters } from 'ts-fsrs';

// Initialize FSRS
const fsrs = new FSRS(generatorParameters({ enable_fuzzing: true }));

interface AppState {
  // Editor State
  code: string;
  setCode: (code: string) => void;

  // Diagnosis State
  diagnosisState: DiagnosisState;
  setDiagnosisState: (state: DiagnosisState) => void;
  resetDiagnosis: () => void;
  diagnoseCode: () => Promise<void>;

  // Console/Runtime State
  consoleOutput: { stdout: string; stderr: string; time?: number };
  isRunning: boolean;
  runCode: () => Promise<void>;

  // Trace State
  traceData: any[];
  currentStep: number;
  isPlaying: boolean;
  setTraceData: (data: any[]) => void;
  setCurrentStep: (step: number) => void;
  incrementCurrentStep: () => void;
  setIsPlaying: (isPlaying: boolean) => void;

  // Quiz State
  activeQuiz: QuizQuestion | null;
  setActiveQuiz: (quiz: QuizQuestion | null) => void;

  // Flashcard State
  flashcards: Flashcard[];
  isReviewMode: boolean;
  setIsReviewMode: (isMode: boolean) => void;
  updateFlashcard: (id: string, isCorrect: boolean, rating?: Rating) => void;
  clearMasteredCards: () => void;
  addFlashcards: (newCards: Flashcard[]) => void;

  // History State
  isHistoryOpen: boolean;
  selectedHistoryRecord: HistoryRecord | null;
  setIsHistoryOpen: (isOpen: boolean) => void;
  setSelectedHistoryRecord: (record: HistoryRecord | null) => void;
  loadHistoryRecord: (record: HistoryRecord) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Editor State
      code: '',
      setCode: (code) => set({ code }),

      // Diagnosis State
      diagnosisState: {
        status: 'idle',
        result: null,
        error: null,
      },
      setDiagnosisState: (diagnosisState) => set({ diagnosisState }),
      resetDiagnosis: () => set({ diagnosisState: { status: 'idle', result: null, error: null } }),
      diagnoseCode: async () => {
        const { code, addFlashcards } = get();
        if (!code.trim()) {
          console.warn("[CodeDoctor] Diagnosis blocked: Empty code input.");
          return;
        }

        console.log("[CodeDoctor] Diagnosis triggered.");
        set({ diagnosisState: { status: 'analyzing', result: null, error: null } });

        try {
          const result = await analyzeCode(code);
          console.log("[CodeDoctor] Diagnosis complete:", result);
          set({ diagnosisState: { status: 'complete', result, error: null } });

          // Recommend Quiz based on error
          if (result.hasError) {
            const quiz = getRecommendedQuiz(result.rawError, code);
            set({ activeQuiz: quiz });
          } else {
            set({ activeQuiz: null });
          }

          // 自动保存到历史记录
          addHistoryRecord(code, result);
          console.log("[CodeDoctor] Record saved to history.");

          // Process new flashcards from the analysis
          if (result.generatedFlashcards && result.generatedFlashcards.length > 0) {
            console.log(`[CodeDoctor] Processing ${result.generatedFlashcards.length} new flashcards.`);
            const newCards: Flashcard[] = result.generatedFlashcards.map((data, index) => ({
              ...data,
              id: `${Date.now()}-${index}`,
              stats: {
                correctStreak: 0,
                incorrectCount: 0,
                status: 'new'
              }
            }));
            addFlashcards(newCards);
          } else {
            console.log("[CodeDoctor] No new flashcards in response.");
          }

        } catch (err: any) {
          console.error("[CodeDoctor] Diagnosis error:", err);
          set({
            diagnosisState: {
              status: 'error',
              result: null,
              error: err.message || '系统发生未知错误。',
            }
          });
        }
      },

      // Console/Runtime State
      consoleOutput: { stdout: '', stderr: '' },
      isRunning: false,
      runCode: async () => {
        const { code } = get();
        if (!code.trim()) return;

        set({ isRunning: true, consoleOutput: { stdout: '', stderr: '' }, traceData: [], currentStep: -1 });

        try {
          const result = await pyodideService.runPython(code);
          set({
            consoleOutput: {
              stdout: result.stdout || (result.result ? `[Result] ${result.result}` : ''),
              stderr: result.stderr || (result.error ? `[Error] ${result.error}` : ''),
              time: result.executionTime
            }
          });

          if (result.trace && Array.isArray(result.trace)) {
            console.log("Trace data received:", result.trace.length, "steps");
            set({ traceData: result.trace, currentStep: 0 });
          }
        } catch (err: any) {
          set((state) => ({
            consoleOutput: {
              ...state.consoleOutput,
              stderr: `System Error: ${err.message}`
            }
          }));
        } finally {
          set({ isRunning: false });
        }
      },

      // Trace State
      traceData: [],
      currentStep: -1,
      isPlaying: false,
      setTraceData: (traceData) => set({ traceData }),
      setCurrentStep: (currentStep) => set({ currentStep }),
      incrementCurrentStep: () => set((state) => {
        if (state.currentStep >= state.traceData.length - 1) {
          return { isPlaying: false };
        }
        return { currentStep: state.currentStep + 1 };
      }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),

      // Quiz State
      activeQuiz: null,
      setActiveQuiz: (activeQuiz) => set({ activeQuiz }),

      // Flashcard State
      flashcards: [],
      isReviewMode: false,
      setIsReviewMode: (isReviewMode) => set({ isReviewMode }),
      setFlashcards: (flashcardsOrFn) => set((state) => ({
        flashcards: typeof flashcardsOrFn === 'function' ? flashcardsOrFn(state.flashcards) : flashcardsOrFn
      })),
      addFlashcards: (newCards) => set((state) => ({ flashcards: [...state.flashcards, ...newCards] })),
      updateFlashcard: (id, isCorrect, providedRating) => set((state) => {
        console.log(`[CodeDoctor] Updating card ${id} - Correct: ${isCorrect}, Rating: ${providedRating}`);
        const updatedFlashcards = state.flashcards.map(card => {
          if (card.id !== id) return card;

          let newStats = { ...card.stats };
          // @ts-ignore - FSRS property might not be in type definition yet
          let newFsrs = card.fsrs || fsrs.create_empty_card();

          // Use provided rating or default based on correctness
          const rating = providedRating !== undefined 
            ? providedRating 
            : (isCorrect ? Rating.Good : Rating.Again);
            
          const scheduling_cards = fsrs.repeat(newFsrs, new Date());
          newFsrs = scheduling_cards[rating].card;

          console.log(`[FSRS] Card scheduled for: ${newFsrs.due}`);

          if (isCorrect) {
            newStats.correctStreak += 1;
            if (newStats.correctStreak >= 3) newStats.status = 'mastered';
            else newStats.status = 'learning';
          } else {
            newStats.correctStreak = 0;
            newStats.incorrectCount += 1;
            if (newStats.incorrectCount >= 3) newStats.status = 'critical';
          }

          return { ...card, stats: newStats, fsrs: newFsrs };
        });
        return { flashcards: updatedFlashcards };
      }),
      clearMasteredCards: () => set((state) => {
        const countBefore = state.flashcards.length;
        const newFlashcards = state.flashcards.filter(c => c.stats.status !== 'mastered');
        console.log(`[CodeDoctor] Cleared mastered cards. Count reduced from ${countBefore} to ${newFlashcards.length}.`);
        return { flashcards: newFlashcards };
      }),

      // History State
      isHistoryOpen: false,
      selectedHistoryRecord: null,
      setIsHistoryOpen: (isHistoryOpen) => set({ isHistoryOpen }),
      setSelectedHistoryRecord: (selectedHistoryRecord) => set({ selectedHistoryRecord }),
      loadHistoryRecord: (record) => {
        set({
          selectedHistoryRecord: record,
          code: record.code,
          diagnosisState: {
            status: 'complete',
            result: record.result,
            error: null
          }
        });
      }
    }),
    {
      name: 'code-doctor-storage',
      partialize: (state) => ({ flashcards: state.flashcards }), // Only persist flashcards
    }
  )
);
