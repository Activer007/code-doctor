import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlashcardReview } from '../components/FlashcardReview';
import type { Flashcard } from '../types';
import { Rating } from 'ts-fsrs';

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
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在答对后显示评分按钮', async () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    const submitButton = screen.getByText('验证修复方案');
    fireEvent.click(submitButton);

    expect(screen.getByText('逻辑修复成功！')).toBeInTheDocument();
    expect(screen.getByText('掌握')).toBeInTheDocument();
    expect(screen.getByText('太简单')).toBeInTheDocument();
  });

  it('应该在评分后调用 onUpdateCard', async () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "df[['A', 'B']]" } });

    fireEvent.click(screen.getByText('验证修复方案'));

    const goodButton = screen.getByText('掌握');
    fireEvent.click(goodButton);

    expect(mockOnUpdateCard).toHaveBeenCalledWith('card-1', true, Rating.Good);
  });

  it('应该在答错后直接调用 onUpdateCard 并显示错误反馈', async () => {
    render(
      <FlashcardReview
        cards={mockCards}
        onClose={mockOnClose}
        onUpdateCard={mockOnUpdateCard}
      />
    );

    const input = screen.getByPlaceholderText('在此输入修复后的代码...');
    fireEvent.change(input, { target: { value: "wrong" } });

    fireEvent.click(screen.getByText('验证修复方案'));

    expect(screen.getByText('修复失败')).toBeInTheDocument();
    expect(mockOnUpdateCard).toHaveBeenCalledWith('card-1', false, Rating.Again);
  });
});
