import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeCode } from '../services/geminiService';
import type { DiagnosisResponse } from '../types';

// 创建一个更完整的 mock
const mockGenerateContent = vi.fn();

class MockGoogleGenAI {
  constructor(config: any) {
    // Mock constructor
  }

  models = {
    generateContent: mockGenerateContent
  };
}

// Mock GoogleGenAI 模块
vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI as any,
  Type: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    BOOLEAN: 'boolean',
    ENUM: 'enum'
  }
}));

describe('geminiService', () => {
  beforeEach(() => {
    // 设置环境变量
    process.env.API_KEY = 'test-api-key';
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
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

      const result = await analyzeCode('test');

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('应该在最大重试次数后抛出错误', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent error'));

      await expect(analyzeCode('test')).rejects.toThrow(
        'Failed to analyze code after multiple attempts'
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(5);
    });

    it('应该使用指数退避策略', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Error'));

      const startTime = Date.now();
      await analyzeCode('test').catch(() => {});
      const endTime = Date.now();

      // 应该至少等待: 1000 + 2000 + 4000 + 8000 = 15000ms
      expect(endTime - startTime).toBeGreaterThan(14000);
    });

    it('应该解析空的响应', async () => {
      mockGenerateContent.mockResolvedValue({
        text: null
      });

      await expect(analyzeCode('test')).rejects.toThrow();
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

      await expect(analyzeCode('test')).rejects.toThrow();
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
