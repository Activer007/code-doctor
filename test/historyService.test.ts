import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadHistory,
  addHistoryRecord,
  deleteHistoryRecord,
  clearAllHistory,
  searchHistory,
  filterByTag,
  groupHistoryByDate,
  getHistoryStats,
  exportHistory,
  importHistory,
  type HistoryRecord
} from '../services/historyService';
import type { DiagnosisResponse } from '../types';

// Mock localStorage
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  },
  removeItem: (key: string) => {
    delete mockLocalStorage.store[key];
  },
  clear: () => {
    mockLocalStorage.store = {};
  }
};

global.localStorage = mockLocalStorage as Storage;

describe('historyService', () => {
  beforeEach(() => {
    // 每个测试前清空 localStorage
    mockLocalStorage.clear();
  });

  describe('loadHistory', () => {
    it('应该返回空数组当没有历史记录时', () => {
      const result = loadHistory();
      expect(result).toEqual([]);
    });

    it('应该从 localStorage 加载历史记录', () => {
      const mockRecord: HistoryRecord = {
        id: 'test-1',
        timestamp: Date.now(),
        code: 'print("hello")',
        title: '测试代码',
        summary: '测试摘要',
        result: {} as DiagnosisResponse,
        flashcardsCount: 0,
        tags: ['python']
      };

      mockLocalStorage.setItem('code_doctor_history', JSON.stringify([mockRecord]));

      const result = loadHistory();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-1');
    });

    it('应该按时间倒序排列记录', () => {
      const now = Date.now();
      const record1: HistoryRecord = {
        id: 'test-1',
        timestamp: now - 1000,
        code: 'code1',
        title: '标题1',
        summary: '摘要1',
        result: {} as DiagnosisResponse,
        flashcardsCount: 0
      };

      const record2: HistoryRecord = {
        id: 'test-2',
        timestamp: now,
        code: 'code2',
        title: '标题2',
        summary: '摘要2',
        result: {} as DiagnosisResponse,
        flashcardsCount: 0
      };

      mockLocalStorage.setItem('code_doctor_history', JSON.stringify([record1, record2]));

      const result = loadHistory();
      expect(result[0].id).toBe('test-2');
      expect(result[1].id).toBe('test-1');
    });

    it('应该处理损坏的 localStorage 数据', () => {
      mockLocalStorage.setItem('code_doctor_history', 'invalid json');

      const result = loadHistory();
      expect(result).toEqual([]);
    });
  });

  describe('addHistoryRecord', () => {
    it('应该添加新的历史记录', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '测试错误',
        trace: [],
        generatedFlashcards: []
      };

      const record = addHistoryRecord('print("test")', mockResult);

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.code).toBe('print("test")');
      expect(record.title).toBeDefined();
    });

    it('应该生成默认标题从函数定义', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      const record = addHistoryRecord('def my_function():\n    pass', mockResult);

      expect(record.title).toContain('函数:');
      expect(record.title).toContain('my_function');
    });

    it('应该生成默认标题从变量赋值', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      const record = addHistoryRecord('df = pd.DataFrame()', mockResult);

      expect(record.title).toContain('变量:');
      expect(record.title).toContain('df');
    });

    it('应该自动检测标签', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      const record = addHistoryRecord('import pandas as pd\ndf = pd.DataFrame()', mockResult);

      expect(record.tags).toBeDefined();
      expect(record.tags).toContain('pandas');
    });

    it('应该限制历史记录数量为 100 条', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      // 添加 101 条记录
      for (let i = 0; i < 101; i++) {
        addHistoryRecord(`code ${i}`, mockResult);
      }

      const records = loadHistory();
      expect(records.length).toBeLessThanOrEqual(100);
    });

    it('应该统计闪卡数量', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: [
          { concept: '概念1', frontCode: '错误', backCode: '正确', explanation: '解释' },
          { concept: '概念2', frontCode: '错误', backCode: '正确', explanation: '解释' }
        ]
      };

      const record = addHistoryRecord('test code', mockResult);

      expect(record.flashcardsCount).toBe(2);
    });
  });

  describe('deleteHistoryRecord', () => {
    it('应该删除指定的历史记录', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      const record1 = addHistoryRecord('code1', mockResult);
      const record2 = addHistoryRecord('code2', mockResult);

      expect(loadHistory()).toHaveLength(2);

      deleteHistoryRecord(record1.id);

      const remaining = loadHistory();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(record2.id);
    });

    it('删除不存在的记录时不应该报错', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      addHistoryRecord('code', mockResult);

      expect(() => deleteHistoryRecord('non-existent-id')).not.toThrow();
    });
  });

  describe('clearAllHistory', () => {
    it('应该清空所有历史记录', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      addHistoryRecord('code1', mockResult);
      addHistoryRecord('code2', mockResult);
      addHistoryRecord('code3', mockResult);

      expect(loadHistory()).toHaveLength(3);

      clearAllHistory();

      expect(loadHistory()).toHaveLength(0);
    });
  });

  describe('searchHistory', () => {
    beforeEach(() => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      addHistoryRecord('print("hello")', mockResult);
      addHistoryRecord('df = pd.DataFrame()', mockResult);
      addHistoryRecord('for i in range(10):', mockResult);
    });

    it('应该搜索标题', () => {
      const results = searchHistory('变量');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('变量');
    });

    it('应该搜索代码内容', () => {
      const results = searchHistory('DataFrame');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该搜索摘要', () => {
      const results = searchHistory('错误');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该搜索标签', () => {
      const results = searchHistory('pandas');
      expect(results.length).toBeGreaterThan(0);
    });

    it('不区分大小写', () => {
      const results1 = searchHistory('dataframe');
      const results2 = searchHistory('DATAFRAME');
      expect(results1.length).toBe(results2.length);
    });

    it('空查询应该返回所有结果', () => {
      const results = searchHistory('');
      expect(results.length).toBe(3);
    });
  });

  describe('filterByTag', () => {
    beforeEach(() => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      addHistoryRecord('import pandas as pd\ndf = pd.DataFrame()', mockResult);
      addHistoryRecord('for i in range(10):', mockResult);
      addHistoryRecord('x = [1, 2, 3]', mockResult);
    });

    it('应该按标签筛选', () => {
      const results = filterByTag('pandas');
      expect(results.length).toBeGreaterThan(0);
      results.forEach(record => {
        expect(record.tags).toContain('pandas');
      });
    });

    it('应该返回空数组当没有匹配的标签', () => {
      const results = filterByTag('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('groupHistoryByDate', () => {
    it('应该按日期分组记录', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      const now = Date.now();
      const yesterday = now - 24 * 60 * 60 * 1000;

      const record1: HistoryRecord = {
        id: '1',
        timestamp: now,
        code: 'code1',
        title: '标题1',
        summary: '摘要1',
        result: {} as DiagnosisResponse,
        flashcardsCount: 0
      };

      const record2: HistoryRecord = {
        id: '2',
        timestamp: yesterday,
        code: 'code2',
        title: '标题2',
        summary: '摘要2',
        result: {} as DiagnosisResponse,
        flashcardsCount: 0
      };

      mockLocalStorage.setItem('code_doctor_history', JSON.stringify([record1, record2]));

      const groups = groupHistoryByDate([record1, record2]);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups[0].date).toBeDefined();
      expect(groups[0].records).toBeInstanceOf(Array);
    });
  });

  describe('getHistoryStats', () => {
    it('应该返回正确的统计信息', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: [
          { concept: '概念1', frontCode: '错误', backCode: '正确', explanation: '解释' },
          { concept: '概念2', frontCode: '错误', backCode: '正确', explanation: '解释' }
        ]
      };

      addHistoryRecord('code1', mockResult);
      addHistoryRecord('code2', mockResult);

      const stats = getHistoryStats();

      expect(stats.totalRecords).toBe(2);
      expect(stats.totalFlashcards).toBe(4); // 2 records * 2 flashcards each
      expect(stats.topTags).toBeInstanceOf(Array);
    });

    it('应该统计标签频率', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      // 添加多条 pandas 相关的记录
      addHistoryRecord('import pandas as pd', mockResult);
      addHistoryRecord('df = pd.DataFrame()', mockResult);
      addHistoryRecord('pd.read_csv()', mockResult);

      const stats = getHistoryStats();

      const pandasTag = stats.topTags.find(t => t.tag === 'pandas');
      expect(pandasTag).toBeDefined();
      expect(pandasTag?.count).toBeGreaterThanOrEqual(1);
    });

    it('空历史应该返回零统计', () => {
      const stats = getHistoryStats();

      expect(stats.totalRecords).toBe(0);
      expect(stats.totalFlashcards).toBe(0);
      expect(stats.topTags).toHaveLength(0);
    });
  });

  describe('exportHistory & importHistory', () => {
    it('应该导出历史记录为 JSON', () => {
      const mockResult: DiagnosisResponse = {
        rawError: '错误',
        trace: [],
        generatedFlashcards: []
      };

      addHistoryRecord('test code', mockResult);

      const exported = exportHistory();
      const parsed = JSON.parse(exported);

      expect(parsed).toBeInstanceOf(Array);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].code).toBe('test code');
    });

    it('应该导入历史记录', () => {
      const mockData = [
        {
          id: 'imported-1',
          timestamp: Date.now(),
          code: 'imported code',
          title: '导入的记录',
          summary: '摘要',
          result: { rawError: '错误', trace: [] },
          flashcardsCount: 0
        }
      ];

      const success = importHistory(JSON.stringify(mockData));

      expect(success).toBe(true);

      const loaded = loadHistory();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('imported-1');
    });

    it('应该拒绝无效的导入数据', () => {
      const success = importHistory('invalid json');

      expect(success).toBe(false);
    });
  });
});
