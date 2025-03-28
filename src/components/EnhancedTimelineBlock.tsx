// src/components/EnhancedTimelineBlock.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInMinutes, startOfDay, parseISO } from 'date-fns';
import { Task } from '../types';
import { Play, Pause, CheckCircle, Clock, AlertCircle, Tag } from 'lucide-react';

// Helper function to get color based on category
export const getCategoryColor = (category: string | string[] | null | undefined, opacity: number = 1): string => {
  // Handle array of categories by using the first one
  const categoryValue = Array.isArray(category) ? category[0] : category;

  const categoryColors: {[key: string]: string} = {
    'work': `rgba(59, 130, 246, ${opacity})`, // blue
    'personal': `rgba(124, 58, 237, ${opacity})`, // purple
    'learning': `rgba(16, 185, 129, ${opacity})`, // green
    'health': `rgba(239, 68, 68, ${opacity})`, // red
    'meeting': `rgba(245, 158, 11, ${opacity})`, // amber
    'planning': `rgba(99, 102, 241, ${opacity})`, // indigo
    'shopping': `rgba(236, 72, 153, ${opacity})`, // pink
    'social': `rgba(14, 165, 233, ${opacity})`, // sky
    'finance': `rgba(20, 184, 166, ${opacity})`, // teal
    'travel': `rgba(168, 85, 247, ${opacity})`, // violet
  };

  // Handle null, undefined, or empty string cases
  if (!categoryValue) return `rgba(107, 114, 128, ${opacity})`; // Default gray
  
  const key = typeof categoryValue === 'string' ? categoryValue.toLowerCase() : '';
  return categoryColors[key] || `rgba(107, 114, 128, ${opacity})`; // Default gray
};

interface TimelineBlockProps {
  task: Task;
  sessions: any[];
  startHour: number;
  hourHeight: number;
  isActiveTask: boolean;
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export default function EnhancedTimelineBlock({ 
  task, 
  sessions, 
  startHour, 
  hourHeight,
  isActiveTask,
  isTracking,
  onStartTracking,
  onStopTracking
}: TimelineBlockProps) {
  const dayStart = startOfDay(new Date());
  dayStart.setHours(startHour, 0, 0, 0);
  const now = new Date();

  const getPositionAndHeight = (startTime: Date, endTime: Date) => {
    const start = differenceInMinutes(startTime, dayStart) / 60;
    const duration = differenceInMinutes(endTime, startTime) / 60;
    
    return {
      top: `${start * hourHeight}px`,
      height: `${Math.max(duration * hourHeight, 24)}px` // Minimum height for visibility
    };
  };

  // Format the task due date for display
  const taskDueTime = task.dueDate 
    ? (typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate)
    : null;
  
  // Calculate category-based styling
  const getTaskCategoryStyle = () => {
    if (task.status === 'completed') {
      return {
        borderColor: 'rgba(34, 197, 94, 0.8)',
        backgroundColor: 'rgba(240, 253, 244, 1)',
        textColor: 'rgba(22, 163, 74, 1)'
      };
    }
    
    // Get primary category
    const category = Array.isArray(task.category) ? task.category[0] : task.category;
    
    const borderColor = getCategoryColor(category, 0.8);
    const backgroundColor = getCategoryColor(category, 0.1);
    const textColor = getCategoryColor(category, 1);
    
    // If active task, enhance the visual emphasis
    if (isActiveTask) {
      return {
        borderColor,
        backgroundColor: getCategoryColor(category, 0.2),
        textColor
      };
    }
    
    return {
      borderColor,
      backgroundColor,
      textColor
    };
  };

  const taskStyle = getTaskCategoryStyle();

  return (
    <>
      {/* Task block - shows scheduled time from due date if available */}
      {taskDueTime && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`absolute left-16 right-0 ${
            task.status === 'completed' ? 'opacity-50' : ''
          }`}
          style={getPositionAndHeight(
            taskDueTime,
            new Date(taskDueTime.getTime() + (task.timeEstimate?.value || 60) * 60000)
          )}
        >
          <div
            className="ml-4 h-full rounded-lg border-l-4 p-2"
            style={{
              borderLeftColor: taskStyle.borderColor,
              backgroundColor: taskStyle.backgroundColor
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span 
                  className="text-sm font-medium"
                  style={{ color: taskStyle.textColor }}
                >
                  {task.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{format(taskDueTime, 'HH:mm')}</span>
                  {task.timeEstimate && (
                    <span className="bg-gray-100 px-1 rounded">
                      {task.timeEstimate.value} {task.timeEstimate.unit}
                    </span>
                  )}
                  
                  {/* Display category tags */}
                  {Array.isArray(task.category) ? (
                    task.category.map(cat => (
                      <span 
                        key={cat} 
                        className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getCategoryColor(cat, 0.1),
                          color: getCategoryColor(cat, 1)
                        }}
                      >
                        {cat}
                      </span>
                    ))
                  ) : task.category ? (
                    <span 
                      className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getCategoryColor(task.category, 0.1),
                        color: getCategoryColor(task.category, 1)
                      }}
                    >
                      {task.category}
                    </span>
                  ) : null}
                </div>
              </div>
              {task.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                isActiveTask ? (
                  <button
                    onClick={onStopTracking}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                    title="Stop tracking"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onStartTracking}
                    disabled={isTracking}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600 disabled:opacity-50"
                    title={isTracking ? "Already tracking another task" : "Start tracking"}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Time tracking sessions */}
      {sessions.map((session, index) => {
        const startTime = typeof session.start_time === 'string'
          ? parseISO(session.start_time)
          : session.start_time;
          
        const endTime = session.end_time 
          ? (typeof session.end_time === 'string' ? parseISO(session.end_time) : session.end_time)
          : now;
        
        // Skip sessions that would render outside the visible timeline
        if (differenceInMinutes(startTime, dayStart) / 60 < 0) {
          return null;
        }
        
        // Position calculation
        const position = getPositionAndHeight(startTime, endTime);
        
        // Get category for coloring the session
        const category = Array.isArray(task.category) ? task.category[0] : task.category;
        const sessionColor = getCategoryColor(category, 0.7);
        const sessionBgColor = getCategoryColor(category, 0.2);
        
        return (
          <motion.div
            key={session.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-16 right-0 z-10"
            style={position}
          >
            <div
              className="ml-4 h-full rounded-lg hover:opacity-90 transition-opacity cursor-pointer group border"
              style={{
                backgroundColor: !session.end_time ? sessionBgColor : sessionBgColor,
                borderColor: sessionColor
              }}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 bg-white/90 p-2 text-xs rounded-t-lg shadow-md z-20">
                <div className="font-medium text-gray-800">{task.title}</div>
                <div className="font-medium">{format(startTime, 'HH:mm')} - {session.end_time ? format(endTime, 'HH:mm') : 'Ongoing'}</div>
                <div className="text-gray-500">{Math.round(session.duration / 60)} minutes tracked</div>
                {!session.end_time && (
                  <button 
                    onClick={onStopTracking}
                    className="mt-1 px-2 py-1 bg-red-100 text-red-600 rounded-sm hover:bg-red-200 w-full text-center"
                  >
                    Stop Tracking
                  </button>
                )}
              </div>
              <div 
                className="px-2 py-1 truncate text-xs font-medium"
                style={{ color: sessionColor }}
              >
                {format(startTime, 'HH:mm')} - {session.end_time ? format(endTime, 'HH:mm') : 'Now'}
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}