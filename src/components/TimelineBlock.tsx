import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInMinutes, startOfDay, parseISO } from 'date-fns';
import { Task } from '../types';
import { Play, Pause, CheckCircle, Clock, AlertCircle, Tag } from 'lucide-react';

// Helper function to get color based on category
const getCategoryColor = (category: string, opacity: number = 1): string => {
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

  return categoryColors[category?.toLowerCase()] || `rgba(107, 114, 128, ${opacity})`; // Default gray
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

export default function TimelineBlock({ 
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
  
  // Get the primary category
  const primaryCategory = Array.isArray(task.category) ? task.category[0] : task.category;
  
  // Don't use interpolation for classes in React/JSX
  const getTaskStatusClasses = () => {
    if (task.status === 'completed') {
      return 'border-green-200 bg-green-50';
    } else if (isActiveTask) {
      return 'border-blue-500 bg-blue-50 shadow-md';
    } else {
      // Get colors based on task category
      switch(primaryCategory?.toLowerCase()) {
        case 'work':
          return 'border-blue-400 bg-blue-50';
        case 'personal':
          return 'border-purple-400 bg-purple-50';
        case 'learning':
          return 'border-green-400 bg-green-50';
        case 'health':
          return 'border-red-400 bg-red-50';
        case 'meeting':
          return 'border-yellow-400 bg-yellow-50';
        case 'planning':
          return 'border-indigo-400 bg-indigo-50';
        case 'shopping':
          return 'border-pink-400 bg-pink-50';
        case 'social':
          return 'border-sky-400 bg-sky-50';
        case 'finance':
          return 'border-teal-400 bg-teal-50';
        case 'travel':
          return 'border-violet-400 bg-violet-50';
        default:
          return 'border-gray-300 bg-gray-50';
      }
    }
  };

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
            className={`ml-4 h-full rounded-lg border-l-4 p-2 ${getTaskStatusClasses()}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">{task.title}</span>
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
        
        // Get session color based on task category
        const getSessionColor = () => {
          switch(primaryCategory?.toLowerCase()) {
            case 'work':
              return !session.end_time ? 'bg-blue-300 border-blue-400' : 'bg-blue-200 border-blue-400 hover:bg-blue-300';
            case 'personal':
              return !session.end_time ? 'bg-purple-300 border-purple-400' : 'bg-purple-200 border-purple-400 hover:bg-purple-300';
            case 'learning':
              return !session.end_time ? 'bg-green-300 border-green-400' : 'bg-green-200 border-green-400 hover:bg-green-300';
            case 'health':
              return !session.end_time ? 'bg-red-300 border-red-400' : 'bg-red-200 border-red-400 hover:bg-red-300';
            case 'meeting':
              return !session.end_time ? 'bg-yellow-300 border-yellow-400' : 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300';
            case 'planning':
              return !session.end_time ? 'bg-indigo-300 border-indigo-400' : 'bg-indigo-200 border-indigo-400 hover:bg-indigo-300';
            case 'shopping':
              return !session.end_time ? 'bg-pink-300 border-pink-400' : 'bg-pink-200 border-pink-400 hover:bg-pink-300';
            case 'social': 
              return !session.end_time ? 'bg-sky-300 border-sky-400' : 'bg-sky-200 border-sky-400 hover:bg-sky-300';
            case 'finance':
              return !session.end_time ? 'bg-teal-300 border-teal-400' : 'bg-teal-200 border-teal-400 hover:bg-teal-300';
            case 'travel':
              return !session.end_time ? 'bg-violet-300 border-violet-400' : 'bg-violet-200 border-violet-400 hover:bg-violet-300';
            default:
              return !session.end_time ? 'bg-gray-300 border-gray-400' : 'bg-gray-200 border-gray-400 hover:bg-gray-300';
          }
        };
        
        return (
          <motion.div
            key={session.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute left-16 right-0 z-10"
            style={position}
          >
            <div
              className={`ml-4 h-full rounded-lg ${getSessionColor()} transition-colors cursor-pointer group border`}
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
              <div className="px-2 py-1 truncate text-xs font-medium"
                   style={{ color: getCategoryColor(primaryCategory || 'default', 0.9) }}>
                {format(startTime, 'HH:mm')} - {session.end_time ? format(endTime, 'HH:mm') : 'Now'}
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}