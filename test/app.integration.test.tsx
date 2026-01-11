import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { analyzeCode } from '../services/geminiService';
import { addHistoryRecord } from '../services/historyService';
import type { DiagnosisResponse } from '../types';

// Mock services
vi.mock('../services/geminiService');
vi.mock('../services/historyService', async () => {
  const actual = await vi.importActual('../services/historyService');
  return {
    ...actual as any,
    addHistoryRecord: vi.fn(),
    getHistoryStats: vi.fn().mockReturnValue({ totalRecords: 0, totalFlashcards: 0, topTags: [] }),
    loadHistory: vi.fn().mockReturnValue([]),
    // Mock other functions as needed by HistorySidebar
    groupHistoryByDate: vi.fn().mockReturnValue([]),
    searchHistory: vi.fn().mockReturnValue([]),
    filterByTag: vi.fn().mockReturnValue([])
  };
});

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
  return {
    default: ({ value, onChange, options }: any) => {
      return (
        <textarea
          data-testid="monaco-editor-mock"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={options?.readOnly}
        />
      );
    },
    useMonaco: () => ({
      editor: {
        defineTheme: vi.fn(),
        setTheme: vi.fn(),
      }
    })
  };
});

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

describe('App Integration Tests', () => {
  const mockDiagnosisResult: DiagnosisResponse = {
    rawError: '代码存在索引错误',
    trace: [
      {
        status: 'success',
        title: '导入成功',
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
        reason: '需要使用列表',
        tip: '使用方括号'
      }
    ],
    generatedFlashcards: [
      {
        concept: 'DataFrame 多列索引',
        frontCode: "df['A', 'B']",
        backCode: "df[['A', 'B']]",
        explanation: '多列选择需要列表'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();

    // Mock analyzeCode
    vi.mocked(analyzeCode).mockResolvedValue(mockDiagnosisResult);

    // Mock addHistoryRecord
    vi.mocked(addHistoryRecord).mockReturnValue({
      id: 'history-1',
      timestamp: Date.now(),
      code: "df['A', 'B']",
      title: '测试代码',
      summary: '测试摘要',
      result: mockDiagnosisResult,
      flashcardsCount: 1,
      tags: ['pandas']
    });

    // Mock localStorage for flashcards
    mockLocalStorage.store['code_doctor_flashcards'] = '[]';
  });

  it('应该渲染主应用', () => {
    render(<App />);

    expect(screen.getByText('CODE')).toBeInTheDocument();
    expect(screen.getByText('DOCTOR')).toBeInTheDocument();
    expect(screen.getByText('历史记录')).toBeInTheDocument();
    expect(screen.getByText('错题闪卡')).toBeInTheDocument();
  });

  it('应该显示输入终端和诊断报告区域', () => {
    render(<App />);

    expect(screen.getByText(/输入终端/i)).toBeInTheDocument();
    expect(screen.getByText(/诊断报告/i)).toBeInTheDocument();
  });

  it('应该允许用户输入代码', () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: "print('hello')" } });

    expect(textarea).toHaveValue("print('hello')");
  });

  it('应该在点击启动扫描时调用 analyzeCode', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: "df['A', 'B']" } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(analyzeCode).toHaveBeenCalledWith("df['A', 'B']");
    });
  });

  it('应该显示诊断结果', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('代码存在索引错误')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示执行追踪地图', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('导入成功')).toBeInTheDocument();
      expect(screen.getByText('索引错误')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该自动保存历史记录', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(addHistoryRecord).toHaveBeenCalledWith(
        'test code',
        mockDiagnosisResult
      );
    }, { timeout: 5000 });
  });

  it('应该显示生成的闪卡数量', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/1 闪卡/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该显示错误消息当诊断失败', async () => {
    vi.mocked(analyzeCode).mockRejectedValue(new Error('API Error'));

    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/系统故障/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('应该打开历史记录侧边栏', async () => {
    render(<App />);

    const historyButton = screen.getByText('历史记录');
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '历史记录' })).toBeInTheDocument();
    });
  });

  it('应该禁用错题闪卡按钮当没有闪卡', () => {
    render(<App />);

    const flashcardButton = screen.getByRole('button', { name: /错题闪卡/ });
    expect(flashcardButton).toBeDisabled();
  });

  it('应该启用错题闪卡按钮当有闪卡', async () => {
    mockLocalStorage.store['code_doctor_flashcards'] = JSON.stringify([
      {
        id: 'card-1',
        concept: 'Test',
        frontCode: 'wrong',
        backCode: 'correct',
        explanation: 'explanation',
        stats: {
          correctStreak: 0,
          incorrectCount: 0,
          status: 'new'
        }
      }
    ]);

    render(<App />);

    const flashcardButton = screen.getByRole('button', { name: /错题闪卡/ });
    expect(flashcardButton).not.toBeDisabled();
  });

  it('应该显示系统状态', () => {
    render(<App />);

    expect(screen.getByText('系统状态: 在线')).toBeInTheDocument();
  });

  it('应该显示版本信息', () => {
    render(<App />);

    expect(screen.getByText(/v\d+\.\d+\.\d+/)).toBeInTheDocument();
  });

  it('应该支持清空代码', () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const clearButton = screen.getByText('清空');
    fireEvent.click(clearButton);

    expect(textarea).toHaveValue('');
  });

  it('应该显示分析中状态', () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    // 应该显示加载状态
    expect(screen.getByText(/正在诊断逻辑/)).toBeInTheDocument();
  });

  it('应该支持重置视图', async () => {
    render(<App />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'test code' } });

    const submitButton = screen.getByText('启动扫描');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('重置视图')).toBeInTheDocument();
    }, { timeout: 5000 });

    const resetButton = screen.getByText('重置视图');
    fireEvent.click(resetButton);

    // 应该返回初始状态
    expect(screen.getByTestId('monaco-editor-mock')).toBeInTheDocument();
  });
});
