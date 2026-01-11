import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAppStore } from '../stores/useAppStore';
import { analyzeCode } from '../services/geminiService';
import { getRecommendedQuiz } from '../services/quizService';
import { addHistoryRecord } from '../services/historyService';
import { pyodideService } from '../services/pyodideService';

// Mock all services
vi.mock('../services/geminiService');
vi.mock('../services/quizService');
vi.mock('../services/historyService');
vi.mock('../services/pyodideService');

// Mock ts-fsrs
vi.mock('ts-fsrs', () => {
  return {
    FSRS: class {
      create_empty_card() { return { due: new Date() }; }
      repeat() { 
        return {
          [1]: { card: { due: new Date() } }, // Again
          [3]: { card: { due: new Date() } }  // Good
        }; 
      }
    },
    Rating: { Again: 1, Good: 3 },
    generatorParameters: vi.fn()
  };
});

describe('useAppStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useAppStore.setState({
      code: '',
      diagnosisState: { status: 'idle', result: null, error: null },
      traceData: [],
      currentStep: -1,
      isPlaying: false,
      flashcards: [],
      consoleOutput: { stdout: '', stderr: '' },
      isRunning: false,
      activeQuiz: null,
      isReviewMode: false,
      selectedHistoryRecord: null,
      isHistoryOpen: false
    });
    vi.clearAllMocks();
  });

  it('should set code', () => {
    const { setCode } = useAppStore.getState();
    setCode('print("hello")');
    expect(useAppStore.getState().code).toBe('print("hello")');
  });

  describe('diagnoseCode', () => {
    it('should handle diagnosis flow', async () => {
      const mockResult = {
        rawError: 'Error',
        trace: [],
        generatedFlashcards: [],
        hasError: true
      };
      
      vi.mocked(analyzeCode).mockResolvedValue(mockResult as any);
      vi.mocked(getRecommendedQuiz).mockReturnValue({ id: 'quiz-1' } as any);

      const store = useAppStore.getState();
      store.setCode('invalid code');
      
      await store.diagnoseCode();

      const state = useAppStore.getState();
      expect(state.diagnosisState.status).toBe('complete');
      expect(state.diagnosisState.result).toEqual(mockResult);
      expect(state.activeQuiz).toEqual({ id: 'quiz-1' });
      expect(addHistoryRecord).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      vi.mocked(analyzeCode).mockRejectedValue(new Error('API Failed'));

      const store = useAppStore.getState();
      store.setCode('code');
      
      await store.diagnoseCode();

      const state = useAppStore.getState();
      expect(state.diagnosisState.status).toBe('error');
      expect(state.diagnosisState.error).toContain('API Failed');
    });
  });

  describe('runCode', () => {
    it('should run code and update state', async () => {
      vi.mocked(pyodideService.runPython).mockResolvedValue({
        success: true,
        stdout: 'hello',
        stderr: '',
        trace: [{ line: 1 }]
      });

      const store = useAppStore.getState();
      store.setCode('print("hello")');
      
      await store.runCode();

      const state = useAppStore.getState();
      expect(state.consoleOutput.stdout).toBe('hello');
      expect(state.traceData).toHaveLength(1);
      expect(state.currentStep).toBe(0);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('Trace Control', () => {
    it('should increment current step', () => {
      useAppStore.setState({ 
        traceData: [1, 2, 3], 
        currentStep: 0, 
        isPlaying: true 
      });

      useAppStore.getState().incrementCurrentStep();
      expect(useAppStore.getState().currentStep).toBe(1);
    });

    it('should stop playing at the end', () => {
      useAppStore.setState({ 
        traceData: [1, 2], 
        currentStep: 1, 
        isPlaying: true 
      });

      useAppStore.getState().incrementCurrentStep();
      expect(useAppStore.getState().isPlaying).toBe(false);
    });
  });

  describe('Flashcards', () => {
    it('should update flashcard stats', () => {
      const card = { 
        id: '1', 
        stats: { correctStreak: 0, incorrectCount: 0, status: 'new' } 
      } as any;
      
      useAppStore.setState({ flashcards: [card] });

      useAppStore.getState().updateFlashcard('1', true);

      const updatedCard = useAppStore.getState().flashcards[0];
      expect(updatedCard.stats.correctStreak).toBe(1);
      // fsrs should be initialized
      expect(updatedCard.fsrs).toBeDefined();
    });

    it('should clear mastered cards', () => {
      const cards = [
        { id: '1', stats: { status: 'mastered' } },
        { id: '2', stats: { status: 'learning' } }
      ] as any;

      useAppStore.setState({ flashcards: cards });
      useAppStore.getState().clearMasteredCards();

      expect(useAppStore.getState().flashcards).toHaveLength(1);
      expect(useAppStore.getState().flashcards[0].id).toBe('2');
    });
  });
});
