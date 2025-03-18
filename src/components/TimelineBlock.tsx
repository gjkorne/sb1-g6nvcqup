import React from 'react';
import { motion } from 'framer-motion';
import { format, differenceInMinutes, startOfDay } from 'date-fns';
import { Task } from '../types';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { useTimeStore } from '../store/timeStore';

interface TimelineBlockProps {
  task: Task;
  sessions: any[];
  startHour: number;
  hourHeight: number;
}

export default function TimelineBlock({ task, sessions, startHour, hourHeight }: TimelineBlockProps) {
  const { startTracking, isTracking, activeTaskId } = useTimeStore();
  const dayStart = startOfDay(new Date());
  dayStart.setHours(startHour, 0, 0, 0);
  const now = new Date();

  const getPositionAndHeight = (startTime: Date, endTime: Date) => {
    const start = differenceInMinutes(startTime, dayStart) / 60;
    const duration = differenceInMinutes(endTime, startTime) / 60;
    
    return {
      top: `${start * hourHeight}px`,
      height: `${duration * hourHeight}px`
    };
  };

  const isActive = activeTaskId === task.id;
  const taskDueTime = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <>
      {/* Task block */}
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
            className={`ml-4 h-full rounded-lg border-2 border-dashed p-2 ${
              task.status === 'completed'
                ? 'border-green-200 bg-green-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">{task.title}</span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{format(taskDueTime, 'HH:mm')}</span>
                </div>
              </div>
              {task.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <button
                  onClick={() => !isTracking && startTracking(task.id)}
                  disabled={isTracking}
                  className="p-1 hover:bg-blue-100 rounded"
                >
                  <Play className="w-4 h-4 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Time tracking sessions */}
      {sessions.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .map((session, index) => {
          const startTime = new Date(session.start_time);
          const endTime = session.end_time ? new Date(session.end_time) : now;
        
          return (
            <motion.div
              key={session.id || index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-16 right-0"
              style={getPositionAndHeight(startTime, endTime)}
            >
              <div
                className={`ml-4 h-full rounded-lg ${
                  isActive ? 'bg-green-200' : 'bg-green-100'
                } hover:bg-green-200 transition-colors cursor-pointer group`}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-0 right-0 bg-white/90 p-1 text-xs rounded-t-lg">
                  <div className="font-medium">{format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}</div>
                  <div className="text-gray-500">{Math.round(session.duration / 60)} minutes</div>
                </div>
              </div>
            </motion.div>
          );
        })}
    </>
  );
}