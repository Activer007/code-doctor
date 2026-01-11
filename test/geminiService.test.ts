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
          }
        ]
      };

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse)
      });

      const result = await analyzeCode("df['A', 'B']");

      expect(result).toEqual(mockResponse);
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
      
      // 步进两次重试
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await promise;

      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
    });

    it('应该在最大重试次数后抛出错误', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Persistent error'));

      const promise = analyzeCode('test');

      // 步进四次重试延迟 (1s, 2s, 4s, 8s)
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(4000);
      await vi.advanceTimersByTimeAsync(8000);
      
      await expect(promise).rejects.toThrow(
        'Failed to analyze code after multiple attempts'
      );

      expect(mockGenerateContent).toHaveBeenCalledTimes(5);
    });

    it('应该解析空的响应', async () => {
      mockGenerateContent.mockResolvedValue({
        text: null
      });

      const promise = analyzeCode('test');
      
      // 即使是 Null 响应也会触发重试循环
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(20000); // 步进足够长的时间
      }

      await expect(promise).rejects.toThrow();
    });

    it('应该处理 JSON 解析错误', async () => {
      mockGenerateContent.mockResolvedValue({
        text: 'invalid json{{{'
      });

      const promise = analyzeCode('test');
      
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(20000);
      }

      await expect(promise).rejects.toThrow();
    });
  });
});
