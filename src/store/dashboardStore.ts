import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, DashboardWidget, DashboardLayout } from '../types/dashboard';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_WIDGETS: DashboardWidget[] = [
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
];

const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  widgets: DEFAULT_WIDGETS,
  isDefault: true
};

interface DashboardStore extends DashboardState {
  addLayout: (name: string) => void;
  removeLayout: (id: string) => void;
  setActiveLayout: (id: string) => void;
  addWidget: (widget: Omit<DashboardWidget, 'id' | 'position'>) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetPosition: (widgetId: string, newPosition: number) => void;
  updateWidgetSettings: (widgetId: string, settings: any) => void;
  toggleEditMode: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layouts: [DEFAULT_LAYOUT],
      activeLayout: DEFAULT_LAYOUT.id,
      availableWidgets: [],
      isEditing: false,

      addLayout: (name) => {
        const newLayout: DashboardLayout = {
          id: uuidv4(),
          name,
          widgets: []
        };
        set((state) => ({
          layouts: [...state.layouts, newLayout]
        }));
      },

      removeLayout: (id) => {
        set((state) => ({
          layouts: state.layouts.filter((l) => l.id !== id),
          activeLayout: state.activeLayout === id ? DEFAULT_LAYOUT.id : state.activeLayout
        }));
      },

      setActiveLayout: (id) => {
        set({ activeLayout: id });
      },

      addWidget: (widget) => {
        const activeLayout = get().layouts.find((l) => l.id === get().activeLayout);
        if (!activeLayout) return;

        const newWidget: DashboardWidget = {
          ...widget,
          id: uuidv4(),
          position: activeLayout.widgets.length
        };

        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === state.activeLayout
              ? { ...layout, widgets: [...layout.widgets, newWidget] }
              : layout
          )
        }));
      },

      removeWidget: (widgetId) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === state.activeLayout
              ? {
                  ...layout,
                  widgets: layout.widgets.filter((w) => w.id !== widgetId)
                }
              : layout
          )
        }));
      },

      updateWidgetPosition: (widgetId, newPosition) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === state.activeLayout
              ? {
                  ...layout,
                  widgets: layout.widgets.map((widget) =>
                    widget.id === widgetId
                      ? { ...widget, position: newPosition }
                      : widget
                  )
                }
              : layout
          )
        }));
      },

      updateWidgetSettings: (widgetId, settings) => {
        set((state) => ({
          layouts: state.layouts.map((layout) =>
            layout.id === state.activeLayout
              ? {
                  ...layout,
                  widgets: layout.widgets.map((widget) =>
                    widget.id === widgetId
                      ? { ...widget, settings: { ...widget.settings, ...settings } }
                      : widget
                  )
                }
              : layout
          )
        }));
      },

      toggleEditMode: () => {
        set((state) => ({ isEditing: !state.isEditing }));
      }
    }),
    {
      name: 'dashboard-store'
    }
  )
);