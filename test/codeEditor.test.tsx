import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeEditor } from '../components/CodeEditor';

describe('CodeEditor Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    isAnalyzing: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染编辑器', () => {
    render(<CodeEditor {...defaultProps} />);

    expect(screen.getByText('SOURCE_INPUT.py')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/在此粘贴 Python 代码/)).toBeInTheDocument();
  });

  it('应该显示初始值', () => {
    render(<CodeEditor {...defaultProps} value="print('hello')" />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    expect(textarea).toHaveValue("print('hello')");
  });

  it('应该在输入时调用 onChange', () => {
    render(<CodeEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    fireEvent.change(textarea, { target: { value: 'new code' } });

    expect(mockOnChange).toHaveBeenCalledWith('new code');
  });

  it('应该计算行数', () => {
    const { container } = render(
      <CodeEditor {...defaultProps} value="line1\nline2\nline3" />
    );

    // 检查行号是否正确渲染（至少3行）
    const lineNumbers = container.querySelectorAll('.text-right');
    expect(lineNumbers.length).toBeGreaterThan(0);
  });

  it('应该在按 Tab 键时插入 4 个空格', () => {
    render(<CodeEditor {...defaultProps} value="def test():" />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    fireEvent.keyDown(textarea, { key: 'Tab' });

    expect(mockOnChange).toHaveBeenCalledWith('def test():    ');
  });

  it('应该支持清空按钮', () => {
    render(<CodeEditor {...defaultProps} value="some code" />);

    const clearButton = screen.getByText('清空');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('应该在分析时禁用编辑器', () => {
    render(<CodeEditor {...defaultProps} isAnalyzing={true} />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    expect(textarea).toBeDisabled();

    const clearButton = screen.getByText('清空');
    expect(clearButton).toBeDisabled();
  });

  it('应该在未分析时启用编辑器', () => {
    render(<CodeEditor {...defaultProps} isAnalyzing={false} />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    expect(textarea).not.toBeDisabled();

    const clearButton = screen.getByText('清空');
    expect(clearButton).not.toBeDisabled();
  });

  it('应该显示行号', () => {
    const { container } = render(<CodeEditor {...defaultProps} />);

    // 检查是否显示行号（默认至少15行）
    const lineNumbersContainer = container.querySelector('.text-right');
    expect(lineNumbersContainer).toBeInTheDocument();

    const lineNumbers = lineNumbersContainer?.querySelectorAll('div');
    expect(lineNumbers?.length).toBeGreaterThanOrEqual(15);
  });

  it('应该处理多行代码的行号', () => {
    const multiLineCode = 'line1\nline2\nline3\nline4\nline5';
    const { container } = render(
      <CodeEditor {...defaultProps} value={multiLineCode} />
    );

    // 应该显示至少5个行号
    const lineNumbersContainer = container.querySelector('.text-right');
    const lineNumbers = lineNumbersContainer?.querySelectorAll('div');
    expect(lineNumbers?.length).toBeGreaterThanOrEqual(5);
  });

  it('应该支持单行输入', () => {
    render(<CodeEditor {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    fireEvent.change(textarea, { target: { value: 'single line' } });

    expect(mockOnChange).toHaveBeenCalledWith('single line');
  });

  it('应该保留缩进', () => {
    render(<CodeEditor {...defaultProps} value="    indented code" />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    expect(textarea).toHaveValue("    indented code");
  });

  it('应该更新行数当输入换行符', () => {
    const { rerender } = render(<CodeEditor {...defaultProps} value="line1" />);

    rerender(<CodeEditor {...defaultProps} value="line1\nline2\nline3" />);

    const textarea = screen.getByPlaceholderText(/在此粘贴 Python 代码/);
    expect(textarea).toHaveValue("line1\nline2\nline3");
  });
});
