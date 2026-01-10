import type { HistoryRecord, HistoryGroup, DiagnosisResponse } from '../types';

const HISTORY_STORAGE_KEY = 'code_doctor_history';
const MAX_HISTORY_SIZE = 100; // 最多保存 100 条记录

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 从 localStorage 加载历史记录
 */
export function loadHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!data) return [];

    const records: HistoryRecord[] = JSON.parse(data);
    // 按时间倒序排列
    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

/**
 * 保存历史记录到 localStorage
 */
function saveHistory(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

/**
 * 添加新的历史记录
 */
export function addHistoryRecord(
  code: string,
  result: DiagnosisResponse,
  title?: string
): HistoryRecord {
  const records = loadHistory();

  const newRecord: HistoryRecord = {
    id: generateId(),
    timestamp: Date.now(),
    code,
    title: title || generateDefaultTitle(code),
    summary: result.rawError || '诊断完成',
    result,
    flashcardsCount: result.generatedFlashcards?.length || 0,
    tags: extractTags(code, result),
  };

  // 添加到开头
  records.unshift(newRecord);

  // 限制数量
  if (records.length > MAX_HISTORY_SIZE) {
    records.splice(MAX_HISTORY_SIZE);
  }

  saveHistory(records);
  return newRecord;
}

/**
 * 生成默认标题（从代码中提取）
 */
function generateDefaultTitle(code: string): string {
  const lines = code.trim().split('\n');
  const firstLine = lines[0].trim();

  // 检查是否是函数定义
  if (firstLine.startsWith('def ')) {
    const match = firstLine.match(/def\s+(\w+)/);
    if (match) return `函数: ${match[1]}`;
  }

  // 检查是否是导入
  if (firstLine.startsWith('import ') || firstLine.startsWith('from ')) {
    const match = firstLine.match(/(?:import|from)\s+(\w+)/);
    if (match) return `导入: ${match[1]}`;
  }

  // 检查是否是变量赋值
  if (firstLine.includes('=')) {
    const match = firstLine.match(/(\w+)\s*=/);
    if (match) return `变量: ${match[1]}`;
  }

  // 返回代码片段的前 30 个字符
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
}

/**
 * 从代码和结果中提取标签
 */
function extractTags(code: string, result: DiagnosisResponse): string[] {
  const tags: string[] = [];

  // 从代码中检测常见的库和概念
  const patterns = {
    'pandas': /pd\.|DataFrame|Series|read_csv/,
    'numpy': /np\.|array|ndarray/,
    'matplotlib': /plt\.|pyplot|figure/,
    'requests': /requests\.|get\(|post\(/,
    'json': /json\.|loads\(|dumps\(/,
    '文件操作': /open\(|read\(|write\(/,
    '函数': /def\s+\w+/,
    '类': /class\s+\w+/,
    '循环': /for\s+\w+|while\s+/,
    '条件': /if\s+.*:/,
  };

  for (const [tag, pattern] of Object.entries(patterns)) {
    if (pattern.test(code)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // 最多 5 个标签
}

/**
 * 删除历史记录
 */
export function deleteHistoryRecord(id: string): void {
  const records = loadHistory();
  const filtered = records.filter(r => r.id !== id);
  saveHistory(filtered);
}

/**
 * 清空所有历史记录
 */
export function clearAllHistory(): void {
  localStorage.removeItem(HISTORY_STORAGE_KEY);
}

/**
 * 搜索历史记录
 */
export function searchHistory(query: string): HistoryRecord[] {
  const records = loadHistory();
  const lowerQuery = query.toLowerCase();

  return records.filter(record =>
    record.title.toLowerCase().includes(lowerQuery) ||
    record.code.toLowerCase().includes(lowerQuery) ||
    record.summary.toLowerCase().includes(lowerQuery) ||
    record.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 按标签筛选
 */
export function filterByTag(tag: string): HistoryRecord[] {
  const records = loadHistory();
  return records.filter(record =>
    record.tags?.includes(tag)
  );
}

/**
 * 按日期分组历史记录
 */
export function groupHistoryByDate(records: HistoryRecord[]): HistoryGroup[] {
  const groups: Map<string, HistoryRecord[]> = new Map();

  records.forEach(record => {
    const date = new Date(record.timestamp);
    const dateKey = formatDate(date);

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }

    groups.get(dateKey)!.push(record);
  });

  // 转换为数组并按日期排序
  return Array.from(groups.entries())
    .map(([date, records]) => ({ date, records }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - recordDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;

  // 返回具体日期
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 获取历史记录统计
 */
export function getHistoryStats() {
  const records = loadHistory();

  const totalRecords = records.length;
  const totalFlashcards = records.reduce((sum, r) => sum + r.flashcardsCount, 0);

  // 统计标签频率
  const tagFrequency: Record<string, number> = {};
  records.forEach(record => {
    record.tags?.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  // 最常用的标签
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    totalRecords,
    totalFlashcards,
    topTags,
  };
}

/**
 * 导出历史记录为 JSON
 */
export function exportHistory(): string {
  const records = loadHistory();
  return JSON.stringify(records, null, 2);
}

/**
 * 导入历史记录
 */
export function importHistory(jsonData: string): boolean {
  try {
    const records: HistoryRecord[] = JSON.parse(jsonData);
    saveHistory(records);
    return true;
  } catch (error) {
    console.error('Failed to import history:', error);
    return false;
  }
}
