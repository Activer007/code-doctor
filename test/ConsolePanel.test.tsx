import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConsolePanel } from '../components/ConsolePanel';

describe('ConsolePanel', () => {
  it('renders "Ready to execute" initially', () => {
    render(
      <ConsolePanel 
        output="" 
        isRunning={false} 
        onRun={() => {}} 
      />
    );
    expect(screen.getByText('Ready to execute...')).toBeInTheDocument();
  });

  it('renders stdout output when provided', () => {
    render(
      <ConsolePanel 
        output="Hello World" 
        isRunning={false} 
        onRun={() => {}} 
      />
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders error message when provided', () => {
    render(
      <ConsolePanel 
        output=""
        error="SyntaxError: invalid syntax"
        isRunning={false} 
        onRun={() => {}} 
      />
    );
    expect(screen.getByText('SyntaxError: invalid syntax')).toBeInTheDocument();
  });

  it('disables run button while running', () => {
    const handleRun = vi.fn();
    render(
      <ConsolePanel 
        output=""
        isRunning={true} 
        onRun={handleRun} 
      />
    );
    
    const button = screen.getByRole('button', { name: /run code/i }); // Button text might be hidden or just icon, but let's check class
    expect(button).toBeDisabled();
  });
});
