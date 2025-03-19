import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store/dashboardStore';
import { DashboardWidget } from '../types/dashboard';

const initialState = {
  id: 'default',
  name: 'Default Layout',
  widgets: [
    {
      id: 'stats',
      type: 'stats',
      title: 'Statistics',
      size: 'small',
      position: 0
    },
    {
      id: 'timeline',
      type: 'timeline',
      title: 'Timeline',
      size: 'large',
      position: 1
    },
    {
      id: 'tracking',
      type: 'timeTracking',
      title: 'Time Tracking',
      size: 'medium',
      position: 2
    }
  ],
  isDefault: true
};

describe('Dashboard Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const store = useDashboardStore.getState();
    
    // Reset to initial state
    store.layouts = [initialState];
    store.activeLayout = 'default';
    store.isEditing = false;
  });

  it('should initialize with default layout', () => {
    const store = useDashboardStore.getState();
    expect(store.layouts).toHaveLength(1);
    expect(store.layouts[0].name).toBe('Default Layout');
    expect(store.layouts[0].isDefault).toBe(true);
    expect(store.activeLayout).toBe('default');
  });

  it('should add new layout', () => {
    const store = useDashboardStore.getState();
    store.addLayout('Test Layout');
    
    expect(store.layouts).toHaveLength(2);
    expect(store.layouts[1].name).toBe('Test Layout');
    expect(store.layouts[1].widgets).toHaveLength(0);
  });

  it('should remove layout', () => {
    const store = useDashboardStore.getState();
    store.addLayout('Test Layout');
    const newLayoutId = store.layouts[1].id;
    
    store.removeLayout(newLayoutId);
    expect(store.layouts).toHaveLength(1);
    expect(store.layouts[0].isDefault).toBe(true);
  });

  it('should not remove default layout', () => {
    const store = useDashboardStore.getState();
    const defaultLayoutId = store.layouts[0].id;
    
    store.removeLayout(defaultLayoutId);
    expect(store.layouts).toHaveLength(1);
    expect(store.layouts[0].isDefault).toBe(true);
  });

  it('should add widget to active layout', () => {
    const store = useDashboardStore.getState();
    const newWidget = {
      type: 'stats' as const,
      title: 'Test Widget',
      size: 'small' as const
    };
    
    store.addWidget(newWidget);
    expect(store.layouts[0].widgets).toHaveLength(4); // 3 default + 1 new
    expect(store.layouts[0].widgets[3].title).toBe('Test Widget');
  });

  it('should remove widget from active layout', () => {
    const store = useDashboardStore.getState();
    const widgetId = store.layouts[0].widgets[0].id;
    
    store.removeWidget(widgetId);
    expect(store.layouts[0].widgets).toHaveLength(2);
    expect(store.layouts[0].widgets.find(w => w.id === widgetId)).toBeUndefined();
  });

  it('should update widget position', () => {
    const store = useDashboardStore.getState();
    const widgetId = store.layouts[0].widgets[0].id;
    
    store.updateWidgetPosition(widgetId, 2);
    expect(store.layouts[0].widgets.find(w => w.id === widgetId)?.position).toBe(2);
  });

  it('should update widget settings', () => {
    const store = useDashboardStore.getState();
    const widgetId = store.layouts[0].widgets[0].id;
    const newSettings = { showTotal: true };
    
    store.updateWidgetSettings(widgetId, newSettings);
    expect(store.layouts[0].widgets.find(w => w.id === widgetId)?.settings).toEqual(newSettings);
  });

  it('should toggle edit mode', () => {
    const store = useDashboardStore.getState();
    expect(store.isEditing).toBe(false);
    
    store.toggleEditMode();
    expect(store.isEditing).toBe(true);
    
    store.toggleEditMode();
    expect(store.isEditing).toBe(false);
  });
});