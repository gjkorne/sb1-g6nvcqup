import React, { useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';
import { format, startOfDay, endOfDay, addHours, isSameDay, isWithinInterval, differenceInMinutes } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, BarChart2, Timer } from 'lucide-react';
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
  const { sessions, getTaskTime } = useTimeStore();
  
  // Get today's date boundaries
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Filter tasks and sessions for today
  const todaysTasks = useMemo(() => {
    return tasks.filter(task => 
      task.dueDate && 
      isSameDay(new Date(task.dueDate), today)
    );
  }, [tasks, today]);

  const todaysSessions = useMemo(() => {
    return sessions.filter(session => 
      isWithinInterval(new Date(session.start_time), {
        start: dayStart,
        end: dayEnd
      })
    );
  }, [sessions, dayStart, dayEnd]);

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
              className="absolute left-16 right-0 flex items-center"
              style={{
                top: `${(differenceInMinutes(today, dayStart) / 60 - START_HOUR) * HOUR_HEIGHT}px`,
                zIndex: 20
              }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <div className="flex-1 border-t border-red-500 border-dashed" />
            </div>

            {/* Task and session blocks */}
            {todaysTasks.map(task => (
              <TimelineBlock
                key={task.id}
                task={task}
                sessions={sessionsByTask.get(task.id) || []}
                startHour={START_HOUR}
                hourHeight={HOUR_HEIGHT}
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