import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatisticsWidget from '../../../components/dashboard/widgets/StatisticsWidget';

// Mock the stores
vi.mock('../../../store/timeStore', () => ({
  useTimeStore: () => ({
    sessions: [
      { duration: 3600 }, // 1 hour
      { duration: 1800 }  // 30 minutes
    ]
  })
}));

vi.mock('../../../store/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'in_progress' }
    ]
  })
}));

describe('StatisticsWidget', () => {
  it('renders time tracked statistic', () => {
    render(<StatisticsWidget />);
    expect(screen.getByText('Time Tracked')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('renders completed tasks statistic', () => {
    render(<StatisticsWidget />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('renders productivity score', () => {
    render(<StatisticsWidget />);
    expect(screen.getByText('Productivity')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    vi.mocked(useTimeStore).mockReturnValueOnce({ sessions: [] });
    vi.mocked(useTaskStore).mockReturnValueOnce({ tasks: [] });
    
    render(<StatisticsWidget />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});