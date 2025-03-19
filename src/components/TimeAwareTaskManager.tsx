import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';
import { useFocusStore } from '../store/focusStore';
import { Clock, Focus, Timer, CheckCircle2, AlertCircle, Brain, Zap } from 'lucide-react';
import { formatDuration } from '../utils/time';
import { Task } from '../types';

interface TimeBlock {
  startTime: Date;
  endTime: Date;
  taskId: string | null;
  isBreak: boolean;
}

export default function TimeAwareTaskManager() {
  const tasks = useTaskStore((state) => state.tasks);
  const activeTask = useTaskStore((state) => state.activeTask);
  const { startTracking, stopTracking, isTracking, getTaskTime } = useTimeStore();
  const { enterFocusMode } = useFocusStore();
  
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [showTimeEstimateGuide, setShowTimeEstimateGuide] = useState(false);
  const [mounted, setMounted] = useState(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => setMounted(false);
  }, []);

  // Time block visualization
  useEffect(() => {
    if (!mounted) return;
    
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(9, 0, 0, 0);
    
    const blocks: TimeBlock[] = [];
    let currentTime = startOfDay;
    
    while (currentTime < now) {
      const endTime = new Date(currentTime);
      endTime.setMinutes(currentTime.getMinutes() + 30);
      
      blocks.push({
        startTime: new Date(currentTime),
        endTime: new Date(endTime),
        taskId: null,
        isBreak: false
      });
      
      currentTime = endTime;
    }
    
    if (mounted) {
      setTimeBlocks(blocks);
    }
  }, [mounted]);

  // Pomodoro timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (pomodoroActive && remainingTime !== null) {
      interval = setInterval(() => {
        if (!mounted) return;
        
        setRemainingTime((prev) => {
          if (prev === null || prev <= 0) {
            setPomodoroActive(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroActive, remainingTime, mounted]);

  const startPomodoro = useCallback(() => {
    if (!mounted) return;
    setPomodoroActive(true);
    setRemainingTime(pomodoroMinutes * 60);
  }, [pomodoroMinutes, mounted]);

  const handleTaskStart = useCallback((taskId: string) => {
    if (!mounted) return;
    
    try {
      startTracking(taskId);
      startPomodoro();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  }, [startTracking, startPomodoro, mounted]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header with Time Awareness Tools */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          Time-Aware Task Manager
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTimeEstimateGuide(!showTimeEstimateGuide)}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            title="Time Estimation Guide"
          >
            <Clock className="w-5 h-5" />
          </button>
          <button
            onClick={startPomodoro}
            className={`p-2 rounded-full ${
              pomodoroActive
                ? 'bg-green-50 text-green-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            } transition-colors`}
            title="Start Pomodoro Timer"
          >
            <Timer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Time Estimation Guide */}
      <AnimatePresence>
        {showTimeEstimateGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50 rounded-lg p-4 overflow-hidden"
          >
            <h3 className="font-medium text-blue-900 mb-2">Time Estimation Guide</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Break tasks into 25-minute chunks for better estimation
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Add 50% buffer time to account for transitions and breaks
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Use past completed tasks as reference points
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Task Section */}
      {activeTask && (
        <div className="relative">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-full bg-green-500 rounded-full" />
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{activeTask.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {formatDuration(getTaskTime(activeTask.id))}
                  </span>
                  {pomodoroActive && remainingTime !== null && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => stopTracking()}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Stop Task"
                >
                  <AlertCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => enterFocusMode(activeTask.id)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  title="Enter Focus Mode"
                >
                  <Focus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Blocks Visualization */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900">Today's Time Blocks</h3>
        <div className="grid grid-cols-1 gap-2">
          {timeBlocks.map((block, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                block.taskId
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {block.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {block.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {block.taskId && (
                  <span className="text-sm text-blue-600">
                    {tasks.find(t => t.id === block.taskId)?.title}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Available Tasks</h3>
        <div className="grid gap-3">
          {tasks
            .filter(task => task.status !== 'completed' && task.id !== activeTask?.id)
            .map(task => (
              <div
                key={task.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {task.timeEstimate && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Est: {task.timeEstimate.value} {task.timeEstimate.unit}
                        </span>
                      )}
                      {task.priority === 'high' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTaskStart(task.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Start Task"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}