// src/components/dashboard/widgets/TimeTrackingWidget.tsx
import React, { useState } from 'react';
import { Clock, Play, Pause, StopCircle, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Task } from '../../../types';

interface TimeEntryProps {
  task: Task;
  elapsedTime: number;
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const TimeEntry: React.FC<TimeEntryProps> = ({ 
  task, 
  elapsedTime, 
  isActive,
  onStart,
  onPause,
  onStop
}) => {
  // Format time (seconds) to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`p-4 border-l-4 rounded-r-lg mb-4 ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'}`}>
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
          <p className="text-xs text-gray-500 mt-1">
            {Array.isArray(task.category) 
              ? task.category.join(', ') 
              : task.category || 'No category'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
            {formatTime(elapsedTime)}
          </span>
          <div className="flex gap-1">
            {isActive ? (
              <>
                <button
                  onClick={onPause}
                  className="p-1 text-amber-600 hover:bg-amber-100 rounded-full"
                  title="Pause"
                >
                  <Pause className="w-4 h-4" />
                </button>
                <button
                  onClick={onStop}
                  className="p-1 text-red-600 hover:bg-red-100 rounded-full"
                  title="Stop"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onStart}
                className="p-1 text-green-600 hover:bg-green-100 rounded-full"
                title="Start"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TimeTrackingWidgetProps {
  tasks: Task[];
  isTracking: boolean;
  activeTaskId: string | null;
  getTaskTime: (taskId: string) => number;
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  stopTracking: () => void;
}

const TimeTrackingWidget: React.FC<TimeTrackingWidgetProps> = ({
  tasks,
  isTracking,
  activeTaskId,
  getTaskTime,
  startTracking,
  pauseTracking,
  stopTracking
}) => {
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Filter and sort tasks
  const filteredTasks = tasks
    .filter(task => showCompleted || task.status !== 'completed')
    .sort((a, b) => {
      // Active task first
      if (a.id === activeTaskId) return -1;
      if (b.id === activeTaskId) return 1;
      
      // Recently tracked tasks next
      const timeA = getTaskTime(a.id);
      const timeB = getTaskTime(b.id);
      if (timeA !== timeB) return timeB - timeA;
      
      // Alphabetically by title
      return a.title.localeCompare(b.title);
    })
    .slice(0, 5); // Show only top 5 tasks
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          Time Tracking
        </h3>
        <button 
          onClick={() => setShowCompleted(prev => !prev)}
          className={`text-xs px-2 py-1 rounded ${
            showCompleted 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <TimeEntry
                task={task}
                elapsedTime={getTaskTime(task.id)}
                isActive={activeTaskId === task.id && isTracking}
                onStart={() => startTracking(task.id)}
                onPause={pauseTracking}
                onStop={stopTracking}
              />
            </motion.div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No tasks available for time tracking
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
          View time reports
          <BarChart2 className="w-4 h-4" />
        </button>
        
        <span className="text-xs text-gray-500">
          {isTracking ? 'Currently tracking time' : 'Not tracking'}
        </span>
      </div>
    </div>
  );
};

export default TimeTrackingWidget;