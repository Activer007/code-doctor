import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TracePlayer } from '../components/TracePlayer';

describe('TracePlayer', () => {
  it('renders step counter correctly', () => {
    render(
      <TracePlayer 
        totalSteps={10} 
        currentStep={4} 
        onStepChange={() => {}} 
        isPlaying={false} 
        onPlayPause={() => {}} 
      />
    );
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('disables back buttons on first step', () => {
    render(
      <TracePlayer 
        totalSteps={10} 
        currentStep={0} 
        onStepChange={() => {}} 
        isPlaying={false} 
        onPlayPause={() => {}} 
      />
    );
    // There are multiple buttons, we can check if there are disabled buttons
    const disabledButtons = screen.getAllByRole('button').filter(b => b.hasAttribute('disabled'));
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it('calls onPlayPause when play button is clicked', () => {
    const handlePlayPause = vi.fn();
    render(
      <TracePlayer 
        totalSteps={10} 
        currentStep={0} 
        onStepChange={() => {}} 
        isPlaying={false} 
        onPlayPause={handlePlayPause} 
      />
    );
    
    // Select all buttons
    const buttons = screen.getAllByRole('button');
    // The Play button is the 3rd button (index 2)
    fireEvent.click(buttons[2]);
    
    expect(handlePlayPause).toHaveBeenCalled();
  });
});
