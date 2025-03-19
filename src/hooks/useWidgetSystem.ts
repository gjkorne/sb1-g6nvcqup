import { useState, useEffect } from 'react';
import { WidgetConfig } from '../components/common/WidgetGrid';

interface UseWidgetSystemProps {
  defaultWidgets: WidgetConfig[];
  storageKey?: string;
}

export function useWidgetSystem({ defaultWidgets, storageKey = 'dashboard-widgets' }: UseWidgetSystemProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    // Try to load saved widget configuration
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved widget configuration:', e);
        }
      }
    }
    return defaultWidgets;
  });

  const [isEditing, setIsEditing] = useState(false);

  // Save widget configuration when it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    }
  }, [widgets, storageKey]);

  // Add a new widget
  const addWidget = (widgetType: string) => {
    const widgetTemplate = defaultWidgets.find(w => w.type === widgetType);
    if (!widgetTemplate) return;

    setWidgets(current => [
      ...current,
      {
        ...widgetTemplate,
        id: `${widgetType}-${Date.now()}`,
        position: current.length,
        visible: true
      }
    ]);
  };

  // Update widget configuration
  const updateWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Reset to default configuration
  const resetToDefault = () => {
    setWidgets(defaultWidgets);
  };

  return {
    widgets,
    isEditing,
    addWidget,
    updateWidgets,
    toggleEditMode,
    resetToDefault
  };
}