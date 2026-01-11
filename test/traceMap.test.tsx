import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TraceMap } from '../components/TraceMap';
import type { TraceStep } from '../types';

describe('TraceMap Component', () => {
  const successStep: TraceStep = {
    status: 'success',
    title: '成功步骤',
    desc: '这是一个成功的步骤',
    isError: false
  };

  const warningStep: TraceStep = {
    status: 'warning',
    title: '警告步骤',
    desc: '这是一个警告步骤',
    isError: false
  };

  const errorStep: TraceStep = {
    status: 'error',
    title: '错误步骤',
    desc: '这是一个错误步骤',
    isError: true,
    badCode: 'wrong_code',
    goodCode: 'correct_code',
    reason: '错误原因',
    tip: '改进提示'
  };

  it('应该渲染空的 trace', () => {
    const { container } = render(<TraceMap trace={[]} />);

    expect(container).toBeInTheDocument();
  });

  it('应该渲染单个成功步骤', () => {
    render(<TraceMap trace={[successStep]} />);

    expect(screen.getByText('成功步骤')).toBeInTheDocument();
    expect(screen.getByText('这是一个成功的步骤')).toBeInTheDocument();
  });

  it('应该渲染单个警告步骤', () => {
    render(<TraceMap trace={[warningStep]} />);

    expect(screen.getByText('警告步骤')).toBeInTheDocument();
    expect(screen.getByText('这是一个警告步骤')).toBeInTheDocument();
  });

  it('应该渲染单个错误步骤', () => {
    render(<TraceMap trace={[errorStep]} />);

    expect(screen.getByText('错误步骤')).toBeInTheDocument();
    expect(screen.getByText('这是一个错误步骤')).toBeInTheDocument();
  });

  it('应该显示错误代码对比', () => {
    render(<TraceMap trace={[errorStep]} />);

    expect(screen.getByText('wrong_code')).toBeInTheDocument();
    expect(screen.getByText('correct_code')).toBeInTheDocument();
  });

  it('应该显示错误原因和提示', () => {
    render(<TraceMap trace={[errorStep]} />);

    expect(screen.getByText('错误原因')).toBeInTheDocument();
    expect(screen.getByText(/改进提示/)).toBeInTheDocument();
  });

  it('应该渲染多个步骤', () => {
    const { container } = render(
      <TraceMap trace={[successStep, warningStep, errorStep]} />
    );

    expect(screen.getByText('成功步骤')).toBeInTheDocument();
    expect(screen.getByText('警告步骤')).toBeInTheDocument();
    expect(screen.getByText('错误步骤')).toBeInTheDocument();
  });

  it('应该显示步骤序号', () => {
    render(<TraceMap trace={[successStep, errorStep]} />);

    expect(screen.getByText(/步骤 1/)).toBeInTheDocument();
    expect(screen.getByText(/步骤 2/)).toBeInTheDocument();
  });

  it('应该区分不同状态的颜色', () => {
    const { container } = render(
      <TraceMap trace={[successStep, warningStep, errorStep]} />
    );

    // 检查容器中包含不同状态的文本
    expect(container.textContent).toContain('通过');
    expect(container.textContent).toContain('警告');
    expect(container.textContent).toContain('错误');
  });

  it('应该不显示原因和提示当步骤不是错误', () => {
    const { container } = render(<TraceMap trace={[successStep]} />);

    // 成功步骤不应该显示错误相关的内容
    expect(container.textContent).not.toContain('原因');
    expect(container.textContent).not.toContain('病灶代码');
    expect(container.textContent).not.toContain('修复方案');
  });

  it('应该显示错误步骤的完整信息', () => {
    render(<TraceMap trace={[errorStep]} />);

    expect(screen.getByText(/病灶代码/)).toBeInTheDocument();
    expect(screen.getByText(/修复方案/)).toBeInTheDocument();
    expect(screen.getByText('错误原因')).toBeInTheDocument();
  });

  it('应该渲染连续的步骤', () => {
    const steps: TraceStep[] = [
      { status: 'success', title: '步骤1', desc: '描述1', isError: false },
      { status: 'success', title: '步骤2', desc: '描述2', isError: false },
      { status: 'error', title: '步骤3', desc: '描述3', isError: true }
    ];

    const { container } = render(<TraceMap trace={steps} />);

    expect(screen.getByText('步骤1')).toBeInTheDocument();
    expect(screen.getByText('步骤2')).toBeInTheDocument();
    expect(screen.getByText('步骤3')).toBeInTheDocument();
  });

  it('应该处理没有 badCode 和 goodCode 的错误步骤', () => {
    const errorWithoutCode: TraceStep = {
      status: 'error',
      title: '错误',
      desc: '错误描述',
      isError: true
    };

    const { container } = render(<TraceMap trace={[errorWithoutCode]} />);

    expect(screen.getByText('错误')).toBeInTheDocument();
    // 不应该显示代码对比区域
    expect(container.textContent).not.toContain('病灶代码');
  });

  it('应该处理只有 badCode 的错误步骤', () => {
    const errorWithBadCode: TraceStep = {
      status: 'error',
      title: '错误',
      desc: '错误描述',
      isError: true,
      badCode: 'wrong'
    };

    render(<TraceMap trace={[errorWithBadCode]} />);

    expect(screen.getByText('wrong')).toBeInTheDocument();
    expect(screen.getByText(/病灶代码/)).toBeInTheDocument();
  });

  it('应该处理只有 reason 的错误步骤', () => {
    const errorWithReason: TraceStep = {
      status: 'error',
      title: '错误',
      desc: '错误描述',
      isError: true,
      reason: '这是原因'
    };

    render(<TraceMap trace={[errorWithReason]} />);

    expect(screen.getByText('这是原因')).toBeInTheDocument();
  });

  it('应该处理只有 tip 的错误步骤', () => {
    const errorWithTip: TraceStep = {
      status: 'error',
      title: '错误',
      desc: '错误描述',
      isError: true,
      tip: '这是提示'
    };

    render(<TraceMap trace={[errorWithTip]} />);

    expect(screen.getByText(/这是提示/)).toBeInTheDocument();
  });

  it('应该显示步骤的状态标签', () => {
    render(<TraceMap trace={[successStep, warningStep, errorStep]} />);

    // 应该显示不同的状态文本
    const statusElements = screen.getAllByText(/步骤 \d+:/);
    expect(statusElements.length).toBe(3);
  });
});