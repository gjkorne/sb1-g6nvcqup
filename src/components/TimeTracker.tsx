import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Clock, CloudOff, Cloud as CloudSync, Check, AlertCircle } from 'lucide-react';
import { useTimeStore } from '../store/timeStore';
import { formatDuration } from '../utils/time';
import { format } from 'date-fns';

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
  const syncStatus = useTimeStore((state) => state.syncStatus);
  
  const [elapsedTime, setElapsedTime] = useState(getTaskTime(taskId));
  const isActiveTask = activeTaskId === taskId;

  useEffect(() => {
    const updateTimer = () => {
      setElapsedTime(getTaskTime(taskId));
    };
    
    let interval: NodeJS.Timeout | undefined;

    if (isActiveTask && isTracking) {
      interval = setInterval(updateTimer, 1000);
      // Initial update
      updateTimer();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
        interval = undefined;
      }
    };
  }, [isActiveTask, isTracking, taskId, getTaskTime]);

  const renderSyncStatus = () => {
    if (!isActiveTask || !isTracking) return null;

    const statusIcons = {
      synced: <Check className="w-4 h-4 text-green-500" title="Synced" />,
      syncing: <CloudSync className="w-4 h-4 text-blue-500 animate-spin" title="Syncing..." />,
      offline: <CloudOff className="w-4 h-4 text-gray-500" title="Offline" />,
      error: <AlertCircle className="w-4 h-4 text-red-500" title="Sync error" />
    };

    return (
      <div className="flex items-center gap-1 ml-2 group relative">
        {statusIcons[syncStatus.state]}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {syncStatus.state === 'synced' && syncStatus.lastSynced && 
            `Last synced: ${format(syncStatus.lastSynced, 'HH:mm:ss')}`}
          {syncStatus.state === 'error' && `Error: ${syncStatus.error}`}
          {syncStatus.state === 'syncing' && 'Syncing...'}
          {syncStatus.state === 'offline' && 'Working offline'}
        </div>
      </div>
    );
  };

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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-gray-600">
        <Clock className="w-4 h-4" />
        <span>{formatDuration(elapsedTime)}</span>
        {renderSyncStatus()}
      </div>
      <div className="flex gap-1 ml-auto sm:ml-0">
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