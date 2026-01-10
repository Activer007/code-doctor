import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistorySidebar from '../components/HistorySidebar';
import HistoryDetail from '../components/HistoryDetail';
import type { HistoryRecord } from '../types';
import type { DiagnosisResponse } from '../types';

// Mock historyService
vi.mock('../services/historyService', () => ({
  loadHistory: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  clearAllHistory: vi.fn(),
  groupHistoryByDate: vi.fn(),
  getHistoryStats: vi.fn(),
  exportHistory: vi.fn(),
  importHistory: vi.fn()
}));

describe('HistorySidebar Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSelectRecord = vi.fn();

  const mockRecord: HistoryRecord = {
    id: 'test-1',
    timestamp: Date.now(),
    code: 'print("hello")',
    title: '测试代码',
    summary: '测试摘要',
    result: {} as DiagnosisResponse,
    flashcardsCount: 2,
    tags: ['python', 'print']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('当关闭时不应该渲染', () => {
    const { container } = render(
      <HistorySidebar
        isOpen={false}
        onClose={mockOnClose}
        onSelectRecord={mockOnSelectRecord}
      />
    );

    expect(container.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
  });

  it('应该渲染历史记录列表', async () => {
    const { loadHistory, groupHistoryByDate, getHistoryStats } = await import('../services/historyService');

    (loadHistory as any).mockReturnValue([mockRecord]);
    (groupHistoryByDate as any).mockReturnValue([
      {
        date: '今天',
        records: [mockRecord]
      }
    ]);
    (getHistoryStats as any).mockReturnValue({
      totalRecords: 1,
      totalFlashcards: 2,
      topTags: [{ tag: 'python', count: 1 }]
    });

    render(
      <HistorySidebar
        isOpen={true}
        onClose={mockOnClose}
        onSelectRecord={mockOnSelectRecord}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('历史记录')).toBeInTheDocument();
      expect(screen.getByText('测试代码')).toBeInTheDocument();
    });
  });

  it('应该显示统计信息', async () => {
    const { getHistoryStats, groupHistoryByDate } = await import('../services/historyService');

    (groupHistoryByDate as any).mockReturnValue([{ date: '今天', records: [] }]);
    (getHistoryStats as any).mockReturnValue({
      totalRecords: 5,
      totalFlashcards: 10,
      topTags: [{ tag: 'python', count: 5 }]
    });

    render(
      <HistorySidebar
        isOpen={true}
        onClose={mockOnClose}
        onSelectRecord={mockOnSelectRecord}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('5 条记录')).toBeInTheDocument();
      expect(screen.getByText('10 张闪卡')).toBeInTheDocument();
    });
  });

  it('应该调用 onClose 当点击关闭按钮', async () => {
    const { groupHistoryByDate } = await import('../services/historyService');
    (groupHistoryByDate as any).mockReturnValue([{ date: '今天', records: [] }]);

    render(
      <HistorySidebar
        isOpen={true}
        onClose={mockOnClose}
        onSelectRecord={mockOnSelectRecord}
      />
    );

    const closeButton = await screen.findByTitle('关闭侧边栏');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该调用 onSelectRecord 当点击历史记录', async () => {
    const { loadHistory, groupHistoryByDate } = await import('../services/historyService');

    (loadHistory as any).mockReturnValue([mockRecord]);
    (groupHistoryByDate as any).mockReturnValue([
      {
        date: '今天',
        records: [mockRecord]
      }
    ]);

    render(
      <HistorySidebar
        isOpen={true}
        onClose={mockOnClose}
        onSelectRecord={mockOnSelectRecord}
      />
    );

    const recordElement = await screen.findByText('测试代码');
    fireEvent.click(recordElement);

    await waitFor(() => {
      expect(mockOnSelectRecord).toHaveBeenCalledWith(mockRecord);
    });
  });
});

describe('HistoryDetail Component', () => {
  const mockOnBack = vi.fn();

  const mockRecord: HistoryRecord = {
    id: 'test-1',
    timestamp: Date.now(),
    code: 'print("hello world")',
    title: '测试代码',
    summary: '这是一个测试摘要',
    result: {
      rawError: '代码存在错误',
      trace: [
        {
          status: 'success',
          title: '成功步骤',
          desc: '描述',
          isError: false
        },
        {
          status: 'error',
          title: '错误步骤',
          desc: '错误描述',
          isError: true,
          badCode: 'print("test"',
          goodCode: 'print("test")',
          reason: '缺少括号',
          tip: '检查语法'
        }
      ],
      generatedFlashcards: [
        {
          concept: 'Print 函数',
          frontCode: 'print("test"',
          backCode: 'print("test")',
          explanation: 'print 函数需要完整的括号'
        }
      ]
    },
    flashcardsCount: 1,
    tags: ['python']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染历史记录详情', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('测试代码')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试摘要')).toBeInTheDocument();
  });

  it('应该显示原始代码', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('print("hello world")')).toBeInTheDocument();
  });

  it('应该显示诊断报告', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('代码存在错误')).toBeInTheDocument();
    expect(screen.getByText('成功步骤')).toBeInTheDocument();
    expect(screen.getByText('错误步骤')).toBeInTheDocument();
  });

  it('应该显示生成的闪卡', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('Print 函数')).toBeInTheDocument();
    expect(screen.getByText('print 函数需要完整的括号')).toBeInTheDocument();
  });

  it('应该调用 onBack 当点击返回按钮', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByText('返回历史');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('应该显示标签', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('应该支持复制代码', () => {
    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    global.navigator.clipboard = mockClipboard as any;

    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    const copyButton = screen.getByText('复制');
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('print("hello world")');
  });

  it('应该显示时间戳信息', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    // 应该有日期和时间显示
    expect(screen.getByText(/\d{4}年/)).toBeInTheDocument();
  });

  it('应该显示闪卡统计', () => {
    render(
      <HistoryDetail
        record={mockRecord}
        onBack={mockOnBack}
      />
    );

    expect(screen.getByText('1 张闪卡')).toBeInTheDocument();
  });
});
