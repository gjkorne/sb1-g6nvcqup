import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Clock } from 'lucide-react';
import { useTimeStore } from '../store/timeStore';
import { formatDuration } from '../utils/time';

interface TimeTrackerProps {
  taskId: string;
  isDisabled?: boolean;
}

export default function TimeTracker({ taskId, isDisabled }: TimeTrackerProps) {
  const { 
    startTracking, 
    stopTracking, 
    pauseTracking,
    getTaskTime,
    isTracking,
    activeTaskId 
  } = useTimeStore();
  
  const [elapsedTime, setElapsedTime] = useState(getTaskTime(taskId));
  const isActiveTask = activeTaskId === taskId;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActiveTask && isTracking) {
      interval = setInterval(() => {
        setElapsedTime(getTaskTime(taskId));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActiveTask, isTracking, taskId, getTaskTime]);

  const handleStart = () => {
    startTracking(taskId);
  };

  const handlePause = () => {
    pauseTracking();
  };

  const handleStop = () => {
    stopTracking();
  };

  if (isDisabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>{formatDuration(elapsedTime)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>{formatDuration(elapsedTime)}</span>
      </div>
      <div className="flex gap-1">
        {!isActiveTask || !isTracking ? (
          <button
            onClick={handleStart}
            className="p-1 text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Start tracking"
          >
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={handlePause}
              className="p-1 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
              title="Pause tracking"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={handleStop}
              className="p-1 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Stop tracking"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}