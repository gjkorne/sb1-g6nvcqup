// src/components/common/ResponsiveGridLayout.tsx
import React, { useMemo } from 'react';

export interface GridItem {
  id: string;
  size: 'small' | 'medium' | 'large' | 'full';
  priority: number; // Higher number = higher priority
  content: React.ReactNode;
  minHeight?: string; // Optional min height (e.g., '200px')
}

interface ResponsiveGridLayoutProps {
  items: GridItem[];
  className?: string;
}

/**
 * A responsive grid layout component that arranges items based on their size and priority.
 * 
 * Size options:
 * - small: 1/3 of the width on large screens
 * - medium: 1/2 of the width on large screens
 * - large: 2/3 of the width on large screens
 * - full: Full width on all screen sizes
 */
const ResponsiveGridLayout: React.FC<ResponsiveGridLayoutProps> = ({ items, className = '' }) => {
  // Sort items by priority (higher number = higher priority)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => b.priority - a.priority);
  }, [items]);

  // Get size classes based on item size
  const getSizeClasses = (size: GridItem['size']) => {
    switch(size) {
      case 'small':
        return 'col-span-12 md:col-span-6 lg:col-span-4';
      case 'medium':
        return 'col-span-12 md:col-span-6';
      case 'large':
        return 'col-span-12 md:col-span-8';
      case 'full':
        return 'col-span-12';
      default:
        return 'col-span-12 md:col-span-6';
    }
  };

  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      {sortedItems.map(item => (
        <div 
          key={item.id}
          className={`${getSizeClasses(item.size)}`}
          style={{ minHeight: item.minHeight || 'auto' }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
};

export default ResponsiveGridLayout;