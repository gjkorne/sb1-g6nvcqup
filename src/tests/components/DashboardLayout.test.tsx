import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { DashboardWidget } from '../../types/dashboard';

// Mock the store
vi.mock('../../store/dashboardStore', () => ({
  useDashboardStore: () => ({
    layouts: [
      {
        id: 'default',
        name: 'Default Layout',
        widgets: [
          {
            id: 'stats',
            type: 'stats',
            title: 'Statistics',
            size: 'small',
            position: 0
          }
        ],
        isDefault: true
      }
    ],
    activeLayout: 'default',
    isEditing: false,
    toggleEditMode: vi.fn(),
    setActiveLayout: vi.fn(),
    addLayout: vi.fn()
  })
}));

// Mock the widget components
vi.mock('../../components/dashboard/widgets/StatisticsWidget', () => ({
  default: () => <div>Statistics Widget</div>
}));

describe('DashboardLayout', () => {
  const store = vi.mocked(useDashboardStore());

  it('renders dashboard title', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders layout selector', () => {
    render(<DashboardLayout />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Default Layout')).toBeInTheDocument();
  });

  it('handles layout selection change', async () => {
    render(<DashboardLayout />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'default' } });
    expect(store.setActiveLayout).toHaveBeenCalledWith('default');
  });

  it('toggles edit mode', async () => {
    render(<DashboardLayout />);
    const editButton = screen.getByText('Edit Layout');
    fireEvent.click(editButton);
    expect(store.toggleEditMode).toHaveBeenCalled();
  });

  it('shows add layout button', () => {
    render(<DashboardLayout />);
    expect(screen.getByTitle('Add new layout')).toBeInTheDocument();
  });

  it('renders widgets based on layout', () => {
    render(<DashboardLayout />);
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('applies correct size classes to widgets', () => {
    render(<DashboardLayout />);
    const widget = screen.getByText('Statistics').closest('div');
    expect(widget).toHaveClass('lg:col-span-1');
  });
});