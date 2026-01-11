import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeEditor } from '../components/CodeEditor';

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
    expect(screen.getByTestId('monaco-editor-mock')).toBeInTheDocument();
  });

  it('应该显示初始值', () => {
    render(<CodeEditor {...defaultProps} value="print('hello')" />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    expect(textarea).toHaveValue("print('hello')");
  });

  it('应该在输入时调用 onChange', () => {
    render(<CodeEditor {...defaultProps} />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    fireEvent.change(textarea, { target: { value: 'new code' } });

    expect(mockOnChange).toHaveBeenCalledWith('new code');
  });

  it('应该支持清空按钮', () => {
    render(<CodeEditor {...defaultProps} value="some code" />);

    const clearButton = screen.getByText('清空');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('应该在分析时禁用编辑器', () => {
    render(<CodeEditor {...defaultProps} isAnalyzing={true} />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    expect(textarea).toBeDisabled(); // Mock maps readOnly to disabled

    const clearButton = screen.getByText('清空');
    expect(clearButton).toBeDisabled();
  });

  it('应该在未分析时启用编辑器', () => {
    render(<CodeEditor {...defaultProps} isAnalyzing={false} />);

    const textarea = screen.getByTestId('monaco-editor-mock');
    expect(textarea).not.toBeDisabled();

    const clearButton = screen.getByText('清空');
    expect(clearButton).not.toBeDisabled();
  });
});