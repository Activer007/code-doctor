import quizBank from '../data/quiz-bank.json';

export interface QuizQuestion {
  id: string;
  tags: string[];
  question: string;
  code: string | null;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const getRecommendedQuiz = (errorType: string, code: string): QuizQuestion | null => {
  // 1. 简单的 Tag 匹配逻辑
  // 尝试在 errorType 中查找关键词 (e.g., "IndexError", "SyntaxError")
  
  const normalizedError = errorType.toLowerCase();
  
  const matchedQuiz = quizBank.find(q => {
    return q.tags.some(tag => normalizedError.includes(tag.toLowerCase()));
  });

  if (matchedQuiz) return matchedQuiz;

  // 2. 如果没有精准匹配，随机返回一个 (MVP 策略，防止空窗)
  // 实际生产环境应该请求 AI 生成
  return quizBank[Math.floor(Math.random() * quizBank.length)];
};
