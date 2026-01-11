import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlashcardReview } from '../components/FlashcardReview';
import type { Flashcard } from '../types';

describe('FlashcardReview Component', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdateCard = vi.fn();

  const mockCards: Flashcard[] = [
    {
      id: 'card-1',
      concept: 'DataFrame 索引',
      frontCode: "df['A']",
      backCode: "df[['A', 'B']]",
      explanation: '多列选择需要使用列表',
      stats: {
        correctStreak: 0,
        incorrectCount: 0,
        status: 'new'
      }
    },
    {
      id: 'card-2',
      concept: 'Print 函数',
      frontCode: 'print("test"',
      backCode: 'print("test")',
      explanation: '需要完整的括号',
      stats: {
        correctStreak: 1,
        incorrectCount: 0,
        status: 'learning'
      }
    },
    {
      id: 'card-3',
      concept: '循环语法',
      frontCode: 'for i in range(10)',
      backCode: 'for i in range(10):',
      explanation: '需要冒号',
      stats: {
        correctStreak: 3,
        incorrectCount: 0,
        status: 'mastered'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染空状态当没有活跃卡片', () => {
    render(
      <FlashcardReview
        cards={[]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    expect(screen.getByText('挑战完成！')).toBeInTheDocument();
    expect(screen.getByText('所有的错题都已被你攻克。')).toBeInTheDocument();
  });

  it('应该只显示非 mastered 的卡片', () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    // 应该显示第一张活跃卡片（card-1）
    expect(screen.getByText('DataFrame 索引')).toBeInTheDocument();
  });

  it('应该过滤掉 mastered 状态的卡片', () => {
    const masteredOnlyCards: Flashcard[] = [
      {
        ...mockCards[2],
        stats: { correctStreak: 3, incorrectCount: 0, status: 'mastered' }
      }
    ];

    render(
      <FlashcardReview
        cards={masteredOnlyCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    // 应该显示完成状态
    expect(screen.getByText('挑战完成！')).toBeInTheDocument();
  });

  it('应该显示卡片概念和错误代码', () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    expect(screen.getByText('DataFrame 索引')).toBeInTheDocument();
    expect(screen.getByText("df['A']")).toBeInTheDocument();
  });

  it('应该支持用户输入答案', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    expect(input).toHaveValue("df[['A', 'B']]");
  });

  it('应该验证正确答案', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnUpdateCard).toHaveBeenCalledWith('card-1', true);
    });
  });

  it('应该验证错误答案', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: 'wrong answer' } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnUpdateCard).toHaveBeenCalledWith('card-1', false);
    });
  });

  it('应该显示正确答案反馈', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('逻辑修复成功！')).toBeInTheDocument();
    });
  });

  it('应该显示错误答案反馈', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: 'wrong' } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('修复失败')).toBeInTheDocument();
    });
  });

  it('应该显示正确答案当回答错误', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: 'wrong' } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("df[['A', 'B']]")).toBeInTheDocument();
    });
  });

  it('应该支持查看下一张卡片', async () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    // 第一张卡片
    expect(screen.getByText('DataFrame 索引')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    // 点击下一张
    const nextButton = await screen.findByText('下一张');
    fireEvent.click(nextButton);

    // 应该显示第二张卡片
    await waitFor(() => {
      expect(screen.getByText('Print 函数')).toBeInTheDocument();
    });
  });

  it('应该显示进度信息', () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    // 应该显示当前进度（1/2，因为有一张 mastered）
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('应该调用 onClose 当点击返回按钮', () => {
    render(
      <FlashcardReview
        cards={[]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const backButton = screen.getByText('返回主控台');
    fireEvent.click(backButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该规范比较代码（忽略空格）', async () => {
    render(
      <FlashcardReview
        cards={[mockCards[0]]}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    // 输入带额外空格的答案
    fireEvent.change(input, { target: { value: "df[['A',  'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnUpdateCard).toHaveBeenCalledWith('card-1', true);
    });
  });

  it('应该在最后一张卡片后循环回第一张', async () => {
    const singleCard: Flashcard[] = [mockCards[0]];

    render(
      <FlashcardReview
        cards={singleCard}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    // 点击下一张（应该触发完成）
    const nextButton = await screen.findByText('下一张');
    fireEvent.click(nextButton);

    await waitFor(() => {
      // Should loop back to the same card since it's the only one and props didn't change
      expect(screen.getByText('DataFrame 索引')).toBeInTheDocument();
    });
  });
});