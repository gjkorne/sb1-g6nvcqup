import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, ChevronDown, ChevronRight, Play, Pause, Timer, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import { useTimeStore } from '../store/timeStore';
import { formatDurationDetailed } from '../utils/timeTrackingUtils';

// Helper function to get color based on category
const getCategoryColor = (category: string | string[] | null | undefined, opacity: number = 1): string => {
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

interface TimeTrackingLogProps {
  sessions: any[];
  tasks: Task[];
}

export default function TimeTrackingLog({ sessions, tasks }: TimeTrackingLogProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const { startTracking, isTracking, activeTaskId, stopTracking } = useTimeStore();

  // Group sessions by task
  const sessionsByTask = sessions.filter(session => session.task_id)
    .sort((a, b) => {
      const dateA = typeof a.start_time === 'string' ? parseISO(a.start_time) : a.start_time;
      const dateB = typeof b.start_time === 'string' ? parseISO(b.start_time) : b.start_time;
      return dateB.getTime() - dateA.getTime();
    })
    .reduce((groups, session) => {
    const task = tasks.find(t => t.id === session.task_id);
    if (!task) return groups;

    const existingGroup = groups.find(g => g.taskId === session.task_id);
    if (existingGroup) {
      existingGroup.sessions.push(session);
      existingGroup.totalDuration += session.duration;
      
      // Check if this task has an active session
      if (!session.end_time) {
        existingGroup.isActive = true;
      }
    } else {
      groups.push({
        taskId: session.task_id,
        taskTitle: task.title,
        taskCategory: task.category,
        sessions: [session],
        totalDuration: session.duration,
        isActive: !session.end_time
      });
    }
    return groups;
  }, [] as any[]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleStartTracking = (taskId: string) => {
    startTracking(taskId);
  };

  const handleStopTracking = () => {
    stopTracking();
  };

  return (
    <div className="space-y-4">
      {sessionsByTask.map(group => (
        <div 
          key={group.taskId} 
          className={`border rounded-lg transition-colors ${
            group.isActive ? 'border-green-400 bg-green-50' : 'hover:border-gray-300'
          }`}
        >
          <button
            onClick={() => toggleTask(group.taskId)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                {group.taskTitle}
                {group.isActive && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
                    Active
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{formatDurationDetailed(group.totalDuration)}</span>
                {group.taskCategory && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: getCategoryColor(group.taskCategory, 0.1),
                      color: getCategoryColor(group.taskCategory, 1)
                    }}
                  >
                    {group.taskCategory}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {group.taskId === activeTaskId ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopTracking();
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Pause className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTracking(group.taskId);
                  }}
                  disabled={isTracking}
                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
              {expandedTasks.has(group.taskId) ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {expandedTasks.has(group.taskId) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t px-3 py-2 space-y-2 bg-gray-50">
                  {group.sessions
                    .sort((a, b) => {
                      const dateA = typeof a.start_time === 'string' ? parseISO(a.start_time) : a.start_time;
                      const dateB = typeof b.start_time === 'string' ? parseISO(b.start_time) : b.start_time;
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((session: any, index: number) => {
                      const startTime = typeof session.start_time === 'string' 
                        ? parseISO(session.start_time) 
                        : session.start_time;
                      
                      const endTime = session.end_time 
                        ? (typeof session.end_time === 'string' ? parseISO(session.end_time) : session.end_time)
                        : new Date();
                      
                      return (
                        <div 
                          key={index} 
                          className={`flex items-center justify-between text-sm p-2 rounded ${
                            !session.end_time 
                              ? 'bg-green-100 animate-pulse' 
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{format(startTime, 'HH:mm')}</span>
                            <span className="text-gray-400">→</span>
                            <span>
                              {session.end_time
                                ? format(endTime, 'HH:mm')
                                : (
                                  <span className="text-green-600 font-medium">
                                    Ongoing
                                  </span>
                                )
                              }
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {formatDurationDetailed(session.duration)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {sessionsByTask.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          <Timer className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p>No time tracking sessions recorded today</p>
          <p className="text-sm mt-1">Start tracking time on a task to see it here</p>
        </div>
      )}
    </div>
  );
}