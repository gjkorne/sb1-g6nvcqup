// src/components/dashboard/DashboardLayout.tsx
import React, { ReactNode, useState } from 'react';
import { Settings, X, PlusCircle, ArrowsMaximize, ArrowsMinimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WidgetConfig {
  id: string;
  title: string;
  component: ReactNode;
  width: 'half' | 'full' | 'third';
  height?: 'small' | 'medium' | 'large';
  defaultVisible?: boolean;
  position?: number;
}

interface DashboardLayoutProps {
  widgets: WidgetConfig[];
  onLayoutChange?: (visibleWidgets: string[]) => void;
  allowCustomization?: boolean;
}

export default function DashboardLayout({ 
  widgets,
  onLayoutChange,
  allowCustomization = true
}: DashboardLayoutProps) {
  // Track visible widgets and their order
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(
    widgets
      .filter(w => w.defaultVisible !== false)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map(w => w.id)
  );
  
  const [configOpen, setConfigOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    setVisibleWidgets(current => {
      if (current.includes(widgetId)) {
        const updated = current.filter(id => id !== widgetId);
        if (onLayoutChange) onLayoutChange(updated);
        return updated;
      } else {
        const updated = [...current, widgetId];
        if (onLayoutChange) onLayoutChange(updated);
        return updated;
      }
    });
  };

  // Get widget size classes
  const getWidgetClasses = (width: WidgetConfig['width'], height?: WidgetConfig['height']) => {
    const widthClasses = {
      'half': 'col-span-1 md:col-span-1',
      'third': 'col-span-1 md:col-span-1 lg:col-span-1',
      'full': 'col-span-1 md:col-span-2 lg:col-span-3'
    };
    
    const heightClasses = {
      'small': 'h-auto',
      'medium': 'h-auto md:h-64',
      'large': 'h-auto md:h-96'
    };
    
    return `${widthClasses[width]} ${height ? heightClasses[height] : 'h-auto'}`;
  };

  return (
    <div>
      {/* Dashboard header with controls */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            title={isCompact ? 'Expand view' : 'Compact view'}
          >
            {isCompact ? (
              <ArrowsMaximize className="w-5 h-5" />
            ) : (
              <ArrowsMinimize className="w-5 h-5" />
            )}
          </button>
          
          {allowCustomization && (
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Customize dashboard"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Widgets grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isCompact ? 'auto-rows-min' : ''}`}>
        {widgets
          .filter(widget => visibleWidgets.includes(widget.id))
          .sort((a, b) => {
            const aIndex = visibleWidgets.indexOf(a.id);
            const bIndex = visibleWidgets.indexOf(b.id);
            return aIndex - bIndex;
          })
          .map(widget => (
            <div 
              key={widget.id} 
              className={getWidgetClasses(widget.width, widget.height)}
            >
              {widget.component}
            </div>
          ))}
      </div>
      
      {/* Dashboard customization panel */}
      <AnimatePresence>
        {configOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Customize Dashboard</h3>
                <button
                  onClick={() => setConfigOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-500 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-500 mb-4">Select which widgets to display on your dashboard:</p>
                
                <div className="space-y-3">
                  {widgets.map(widget => (
                    <label key={widget.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={visibleWidgets.includes(widget.id)}
                        onChange={() => toggleWidget(widget.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">{widget.title}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setConfigOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Layout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add widget button (when no widgets are visible) */}
      {visibleWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
          <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No widgets are currently visible</p>
          <button
            onClick={() => setConfigOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Widgets
          </button>
        </div>
      )}
    </div>
  );
}