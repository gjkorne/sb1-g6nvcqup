import React, { useMemo, useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';
import { format, startOfDay, endOfDay, addHours, isSameDay, isWithinInterval, differenceInMinutes, parseISO } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, BarChart2, Timer, Play, Pause, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '../types';
import TimelineBlock from './TimelineBlock';
import TimeTrackingLog from './TimeTrackingLog';

const HOUR_HEIGHT = 60; // pixels per hour
const START_HOUR = 6; // 6 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

export default function TodayView() {
  const tasks = useTaskStore(state => state.tasks);
  const { sessions, getTaskTime, startTracking, isTracking, activeTaskId, stopTracking } = useTimeStore();
  const [refreshTime, setRefreshTime] = useState(Date.now()); // For auto-refreshing
  
  // Get today's date boundaries
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Effect for auto-refreshing while tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTracking) {
      interval = setInterval(() => {
        setRefreshTime(Date.now());
      }, 60000); // Update every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  // Filter tasks and sessions for today
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => 
      (task.dueDate && isSameDay(
        typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate, 
        today
      )) || 
      // Also include tasks that have time sessions today
      sessions.some(s => 
        s.task_id === task.id && 
        isWithinInterval(
          typeof s.start_time === 'string' ? parseISO(s.start_time) : s.start_time,
          { start: dayStart, end: dayEnd }
        )
      )
    );
  }, [tasks, sessions, today, dayStart, dayEnd]);

  const todaysSessions = useMemo(() => {
    return sessions.filter(session => {
      const sessionStartTime = typeof session.start_time === 'string' 
        ? parseISO(session.start_time) 
        : session.start_time;
        
      return isWithinInterval(sessionStartTime, {
        start: dayStart,
        end: dayEnd
      });
    });
  }, [sessions, dayStart, dayEnd, refreshTime]); // Added refreshTime to trigger re-evaluation

  // Calculate statistics
  const totalTrackedTime = todaysSessions.reduce((total, session) => 
    total + session.duration, 0
  );
  
  const completedTasks = todaysTasks.filter(task => 
    task.status === 'completed'
  ).length;

  // Group sessions by task for the log
  const sessionsByTask = useMemo(() => {
    const grouped = new Map<string, typeof sessions>();
    todaysSessions.forEach(session => {
      const taskSessions = grouped.get(session.task_id) || [];
      grouped.set(session.task_id, [...taskSessions, session]);
    });
    return grouped;
  }, [todaysSessions]);
  
  // Calculate time spent by category
  const categoryTimeTracking = useMemo(() => {
    const categoryMap = new Map<string, number>();
    const taskCategoryMap = new Map<string, string[]>();
    
    // Create mapping of task IDs to their categories
    todaysTasks.forEach(task => {
      const categories = Array.isArray(task.category) ? task.category : [task.category || 'Uncategorized'];
      taskCategoryMap.set(task.id, categories);
    });
    
    // Calculate time spent per category
    todaysSessions.forEach(session => {
      const taskId = session.task_id;
      const categories = taskCategoryMap.get(taskId) || ['Uncategorized'];
      
      categories.forEach(category => {
        const currentTime = categoryMap.get(category) || 0;
        categoryMap.set(category, currentTime + session.duration);
      });
    });
    
    // Convert to array and sort by time spent (descending)
    return Array.from(categoryMap.entries())
      .map(([category, duration]) => ({ category, duration }))
      .sort((a, b) => b.duration - a.duration);
  }, [todaysTasks, todaysSessions]);

  // Generate timeline hours
  const timelineHours = Array.from(
    { length: TOTAL_HOURS + 1 },
    (_, i) => addHours(dayStart, START_HOUR + i)
  );

  // Format time for display
  const formatTimeDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Get the current hour marker position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutesSinceDayStart = differenceInMinutes(now, dayStart);
    const hoursSinceDayStart = minutesSinceDayStart / 60;
    
    return Math.max(0, (hoursSinceDayStart - START_HOUR) * HOUR_HEIGHT);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Time Tracked Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatTimeDisplay(totalTrackedTime)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {completedTasks} / {todaysTasks.length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Productivity Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((totalTrackedTime / (TOTAL_HOURS * 3600)) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <BarChart2 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Category Time Distribution */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-500" />
          Category Time Distribution
        </h2>
        
        <div className="space-y-4">
          {categoryTimeTracking.length > 0 ? (
            <>
              {/* Top categories visualization */}
              <div className="flex items-center w-full h-6 rounded-full overflow-hidden">
                {categoryTimeTracking.slice(0, 4).map((category, index) => {
                  const percentage = (category.duration / totalTrackedTime) * 100;
                  if (percentage < 3) return null; // Don't show very small segments
                  
                  // Color palette for top categories
                  const colors = [
                    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-gray-500'
                  ];
                  
                  return (
                    <div 
                      key={category.category} 
                      className={`${colors[index]} h-full`} 
                      style={{ width: `${percentage}%` }}
                      title={`${category.category}: ${formatTimeDisplay(category.duration)}`}
                    />
                  );
                })}
              </div>
              
              {/* Category breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {categoryTimeTracking.slice(0, 4).map((category, index) => {
                  const percentage = (category.duration / totalTrackedTime) * 100;
                  
                  // Color palette for labels
                  const colors = [
                    'text-blue-500', 'text-green-500', 'text-purple-500', 'text-gray-500'
                  ];
                  
                  return (
                    <div key={category.category} className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index].replace('text', 'bg')}`} />
                        <span className="text-sm font-medium truncate">
                          {category.category}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className={`text-sm ${colors[index]}`}>
                          {formatTimeDisplay(category.duration)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No categories tracked today</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Today's Timeline</h2>
          <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
            {/* Time markers */}
            {timelineHours.map((hour, index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-100 flex items-center"
                style={{ top: `${index * HOUR_HEIGHT}px` }}
              >
                <span className="text-sm text-gray-500 -mt-2.5 w-16">
                  {format(hour, 'HH:mm')}
                </span>
                <div className="flex-1 border-l border-gray-100 h-[60px]" />
              </div>
            ))}

            {/* Current time indicator */}
            <div
              className="absolute left-16 right-0 flex items-center z-30"
              style={{
                top: `${getCurrentTimePosition()}px`
              }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <div className="flex-1 border-t border-red-500 border-dashed" />
              <span className="text-xs text-red-500 font-medium px-1">
                {format(new Date(), 'HH:mm')}
              </span>
            </div>

            {/* Task and session blocks */}
            {todaysTasks.map(task => (
              <TimelineBlock
                key={task.id}
                task={task}
                sessions={sessionsByTask.get(task.id) || []}
                startHour={START_HOUR}
                hourHeight={HOUR_HEIGHT}
                isActiveTask={activeTaskId === task.id}
                onStartTracking={() => startTracking(task.id)}
                onStopTracking={() => stopTracking()}
                isTracking={isTracking}
              />
            ))}
          </div>
        </div>

        {/* Time Tracking Log */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Time Tracking Log</h2>
              <div className="text-sm text-gray-500">
                Total: {formatTimeDisplay(totalTrackedTime)}
              </div>
            </div>
            <TimeTrackingLog
              sessions={todaysSessions}
              tasks={tasks}
            />
          </div>
        </div>
      </div>
    </div>
  );
}