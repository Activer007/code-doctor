import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analyzeCode } from '../services/geminiService';
import type { DiagnosisResponse } from '../types';

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

// Mock GoogleGenAI 模块
vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    constructor(config: any) {
      // Mock constructor
    }

    models = {
      generateContent: mockGenerateContent
    };
  }

  return {
    GoogleGenAI: MockGoogleGenAI as any,
    Type: {
      OBJECT: 'object',
      ARRAY: 'array',
      STRING: 'string',
      BOOLEAN: 'boolean',
      ENUM: 'enum'
    }
  };
});

describe('geminiService', () => {
  beforeEach(() => {
    // 设置环境变量
    process.env.API_KEY = 'test-api-key';
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('analyzeCode', () => {
    it('应该在缺少 API Key 时抛出错误', async () => {
      delete process.env.API_KEY;

      await expect(analyzeCode('print("test")')).rejects.toThrow(
        'API Key is missing in environment variables'
      );
    });

    it('应该清理代码中的不可见字符', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          rawError: '测试错误',
          trace: [
            {
              status: 'error',
              title: '测试步骤',
              desc: '测试描述',
              isError: true
            }
          ]
        })
      });

      const codeWithNonBreakingSpace = 'print("test\u00A0")';
      await analyzeCode(codeWithNonBreakingSpace);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).not.toContain('\u00A0');
    });

    it('应该在成功时返回诊断结果', async () => {
      const mockResponse: DiagnosisResponse = {
        rawError: '代码存在语法错误',
        trace: [
          {
            status: 'success',
            title: '导入模块',
            desc: '成功导入 pandas',
            isError: false
          },
          {
            status: 'error',
            title: '索引错误',
            desc: '使用元组访问多列',
            isError: true,
            badCode: "df['A', 'B']",
            goodCode: "df[['A', 'B']]",
            reason: 'Pandas 需要列表来选择多列',
            tip: '使用双列表号创建列表'
          }
        ],
        generatedFlashcards: [
          {
            concept: 'DataFrame 多列索引',
            frontCode: "df['A', 'B']",
            backCode: "df[['A', 'B']]",
            explanation: '在 Pandas 中，多列选择需要使用列表而不是元组'
          }
        ]
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse)
      });

      const result = await analyzeCode("df['A', 'B']");

      expect(result).toEqual(mockResponse);
      expect(result.trace).toHaveLength(2);
      expect(result.generatedFlashcards).toHaveLength(1);
    });

    it('应该在 API 失败时重试', async () => {
      mockGenerateContent
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          text: JSON.stringify({
            rawError: '错误',
            trace: [{ status: 'success', title: '测试', desc: '测试', isError: false }]
          })
        });

      const promise = analyzeCode('test');
      
      // Fast-forward time for retries
      await vi.advanceTimersByTimeAsync(1000); // 1st retry
      await vi.advanceTimersByTimeAsync(2000); // 2nd retry

      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('应该在最大重试次数后抛出错误', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent error'));

      const promise = analyzeCode('test');

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.advanceTimersByTimeAsync(8000);
      
      await expect(promise).rejects.toThrow(
        'Failed to analyze code after multiple attempts'
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(5);
    });

    it('应该使用指数退避策略', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Error'));

      const promise = analyzeCode('test').catch(() => {});

      // Initial call
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      // 1st retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);

      // 2nd retry after 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      
      // 3rd retry after 4000ms
      await vi.advanceTimersByTimeAsync(4000);
      expect(mockGenerateContent).toHaveBeenCalledTimes(4);

      // 4th retry after 8000ms
      await vi.advanceTimersByTimeAsync(8000);
      expect(mockGenerateContent).toHaveBeenCalledTimes(5);
      
      await promise;
    });

    it('应该解析空的响应', async () => {
      mockGenerateContent.mockResolvedValue({
        text: null
      });

      const promise = analyzeCode('test');
      await vi.advanceTimersByTimeAsync(20000); // Advance enough to cover retries
      await expect(promise).rejects.toThrow();
    });

    it('应该传递正确的参数到 API', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          rawError: '错误',
          trace: []
        })
      });

      await analyzeCode('print("test")');

      const callArgs = mockGenerateContent.mock.calls[0][0];

      expect(callArgs.model).toBe('gemini-3-flash-preview');
      expect(callArgs.config.responseMimeType).toBe('application/json');
      expect(callArgs.config.temperature).toBe(0.4);
      expect(callArgs.config.systemInstruction).toContain('Code Doctor');
    });

    it('应该处理 JSON 解析错误', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json{{{'
      });

      const promise = analyzeCode('test');
      await vi.advanceTimersByTimeAsync(20000);
      await expect(promise).rejects.toThrow();
    });

    it('应该包含代码分析提示', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          rawError: '错误',
          trace: []
        })
      });

      const testCode = 'print("hello world")';
      await analyzeCode(testCode);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain(testCode);
      expect(callArgs.contents).toContain('请为初学者分析这段 Python 代码片段');
    });
  });
});