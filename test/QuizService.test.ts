import { describe, it, expect } from 'vitest';
import { getRecommendedQuiz } from '../services/quizService';
import quizBank from '../data/quiz-bank.json';

describe('QuizService', () => {
  it('recommends IndexError quiz for IndexError message', () => {
    const errorMsg = "IndexError: list index out of range";
    const quiz = getRecommendedQuiz(errorMsg, "some code");
    expect(quiz).toBeDefined();
    expect(quiz?.tags.some(t => t.toLowerCase() === 'indexerror')).toBe(true);
  });

  it('recommends fallback quiz for unknown error', () => {
    const errorMsg = "Unknown Error 123";
    const quiz = getRecommendedQuiz(errorMsg, "some code");
    expect(quiz).toBeDefined();
    // Should be one of the existing quizzes
    expect(quizBank.some(q => q.id === quiz?.id)).toBe(true);
  });
});