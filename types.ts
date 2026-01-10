export type TraceStatus = 'success' | 'warning' | 'error';

export interface TraceStep {
  status: TraceStatus;
  title: string;
  desc: string;
  isError: boolean;
  badCode?: string;
  goodCode?: string;
  reason?: string;
  tip?: string;
}

export interface FlashcardData {
  concept: string; // 抽象出的概念，如 "DataFrame 索引"
  frontCode: string; // 病灶代码
  backCode: string; // 正确代码
  explanation: string; // 解释
}

export interface Flashcard extends FlashcardData {
  id: string;
  stats: {
    correctStreak: number; // 连续正确次数
    incorrectCount: number; // 累积错误次数
    status: 'new' | 'learning' | 'critical' | 'mastered';
  };
}

export interface DiagnosisResponse {
  rawError: string;
  trace: TraceStep[];
  generatedFlashcards?: FlashcardData[]; // AI 生成的原始闪卡数据
}

export interface DiagnosisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  result: DiagnosisResponse | null;
  error: string | null;
}

// 历史记录相关类型
export interface HistoryRecord {
  id: string; // 唯一标识
  timestamp: number; // 创建时间戳
  code: string; // 用户输入的代码
  title: string; // AI 生成的标题或默认标题
  summary: string; // 诊断摘要
  result: DiagnosisResponse; // 完整的诊断结果
  flashcardsCount: number; // 生成的闪卡数量
  tags?: string[]; // 可选的标签
}

export interface HistoryGroup {
  date: string; // 格式: "2025-01-10"
  records: HistoryRecord[];
}