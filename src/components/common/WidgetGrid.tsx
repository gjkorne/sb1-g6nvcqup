import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings } from 'lucide-react';
import { Widget } from './Widget';

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: number;
  visible: boolean;
  component: React.ReactNode;
}

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetChange?: (widgets: WidgetConfig[]) => void;
  isEditing?: boolean;
  onEditToggle?: () => void;
  availableWidgets?: WidgetConfig[];
  onAddWidget?: (widgetType: string) => void;
}

export default function WidgetGrid({
  widgets,
  onWidgetChange,
  isEditing = false,
  onEditToggle,
  availableWidgets = [],
  onAddWidget
}: WidgetGridProps) {
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);

  // Get grid classes based on widget size
  const getGridClasses = (size: WidgetConfig['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 'medium':
        return 'col-span-12 sm:col-span-6';
      case 'large':
        return 'col-span-12 lg:col-span-8';
      case 'full':
        return 'col-span-12';
      default:
        return 'col-span-12 sm:col-span-6';
    }
  };

  // Handle widget size change
  const handleSizeChange = (widgetId: string, newSize: WidgetConfig['size']) => {
    if (!onWidgetChange) return;

    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, size: newSize } : widget
    );
    onWidgetChange(updatedWidgets);
  };

  // Handle widget removal
  const handleRemoveWidget = (widgetId: string) => {
    if (!onWidgetChange) return;

    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, visible: false } : widget
    );
    onWidgetChange(updatedWidgets);
  };

  return (
    <div className="space-y-6">
      {/* Grid Controls */}
      {onEditToggle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onEditToggle}
              className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
                isEditing
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              {isEditing ? 'Done Editing' : 'Edit Layout'}
            </button>
            {isEditing && onAddWidget && (
              <button
                onClick={() => setShowWidgetPicker(true)}
                className="px-3 py-1.5 rounded text-sm bg-green-100 text-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
            )}
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <div className="grid grid-cols-12 gap-6">
        <AnimatePresence>
          {widgets
            .filter(widget => widget.visible)
            .sort((a, b) => a.position - b.position)
            .map(widget => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={getGridClasses(widget.size)}
              >
                <Widget
                  id={widget.id}
                  title={widget.title}
                  size={widget.size}
                  isEditing={isEditing}
                  onRemove={
                    isEditing ? () => handleRemoveWidget(widget.id) : undefined
                  }
                  onSizeChange={
                    isEditing
                      ? (newSize) => handleSizeChange(widget.id, newSize)
                      : undefined
                  }
                >
                  {widget.component}
                </Widget>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Widget Picker Modal */}
      <AnimatePresence>
        {showWidgetPicker && onAddWidget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">Add Widget</h3>
                <button
                  onClick={() => setShowWidgetPicker(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {availableWidgets
                    .filter(w => !widgets.find(existing => existing.type === w.type && existing.visible))
                    .map(widget => (
                      <button
                        key={widget.type}
                        onClick={() => {
                          onAddWidget(widget.type);
                          setShowWidgetPicker(false);
                        }}
                        className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 text-left"
                      >
                        <h4 className="font-medium">{widget.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Add {widget.title.toLowerCase()} widget to your dashboard
                        </p>
                      </button>
                    ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}