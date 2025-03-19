import React, { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Maximize2, Minimize2, Loader2 } from 'lucide-react';

export interface WidgetProps {
  id: string;
  title: string;
  icon?: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  isLoading?: boolean;
  isEditing?: boolean;
  onRemove?: () => void;
  onSizeChange?: (newSize: 'small' | 'medium' | 'large' | 'full') => void;
  className?: string;
  children: ReactNode;
}

export default function Widget({
  id,
  title,
  icon,
  size = 'medium',
  isLoading = false,
  isEditing = false,
  onRemove,
  onSizeChange,
  className = '',
  children
}: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white rounded-lg shadow-sm ${className} ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      }`}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          {isEditing && onSizeChange && (
            <select
              value={size}
              onChange={(e) => onSizeChange(e.target.value as any)}
              className="text-sm border rounded px-1 py-0.5"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="full">Full</option>
            </select>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-gray-400 hover:text-red-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className={`p-4 ${isLoading ? 'opacity-50' : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}

export { Widget }