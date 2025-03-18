import { supabase } from '../lib/supabase';

/**
 * Utilities for background synchronization of time tracking data
 */

interface SyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: any) => void;
  offlineMode?: boolean;
}

interface TimeSession {
  id?: string;
  task_id: string;
  start_time: Date | string;
  end_time?: Date | string | null;
  duration: number;
  user_id?: string;
}

interface TimeSyncManager {
  initialize: (options?: SyncOptions) => void;
  pauseSync: () => void;
  resumeSync: () => void;
  syncNow: () => Promise<boolean>;
  isOnline: () => boolean;
  getLastSyncTime: () => Date | null;
  cleanup: () => void;
  syncSession: (session: TimeSession) => Promise<boolean>;
  bulkSyncSessions: (sessions: TimeSession[]) => Promise<boolean>;
}

// Queue for storing pending sync operations during offline mode
let pendingSyncQueue: TimeSession[] = [];

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "2h 30m 15s")
 */
export function formatDurationDetailed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m${remainingSeconds > 0 ? ` ${remainingSeconds}s` : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}${
    remainingSeconds > 0 && (hours < 10) ? ` ${remainingSeconds}s` : ''
  }`;
}

/**
 * Creates a time sync manager for optimized time tracking
 */
export const createTimeSyncManager = (): TimeSyncManager => {
  let syncInterval: NodeJS.Timeout | null = null;
  let options: SyncOptions = {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    offlineMode: false
  };
  let pendingSync: Promise<boolean> | null = null;
  let retryCount = 0;
  let lastSyncTime: Date | null = null;
  let isInitialized = false;
  let isOnlineStatus = navigator.onLine;

  // Listen for online/offline events
  const handleOnline = () => {
    isOnlineStatus = true;
    if (options.autoSync && pendingSync === null && pendingSyncQueue.length > 0) {
      bulkSyncSessions(pendingSyncQueue);
    }
  };

  const handleOffline = () => {
    isOnlineStatus = false;
  };

  const initialize = (userOptions?: SyncOptions) => {
    if (isInitialized) {
      cleanup();
    }

    options = { ...options, ...userOptions };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (options.autoSync && !options.offlineMode) {
      startSyncInterval();
    }
    
    isInitialized = true;
    
    // Load any pending sessions from local storage
    const pendingSessions = localStorage.getItem('pendingTimeSessions');
    if (pendingSessions) {
      try {
        pendingSyncQueue = JSON.parse(pendingSessions);
        
        // If we're online, try to sync them immediately
        if (isOnlineStatus && options.autoSync) {
          bulkSyncSessions(pendingSyncQueue);
        }
      } catch (e) {
        console.error('Failed to load pending time sessions:', e);
        localStorage.removeItem('pendingTimeSessions');
      }
    }
  };

  const startSyncInterval = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    
    syncInterval = setInterval(() => {
      if (isOnlineStatus && !options.offlineMode && pendingSyncQueue.length > 0) {
        syncNow();
      }
    }, options.syncInterval);
  };

  const pauseSync = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };

  const resumeSync = () => {
    if (!syncInterval && options.autoSync && !options.offlineMode) {
      startSyncInterval();
    }
  };

  const syncNow = async (): Promise<boolean> => {
    if (pendingSync !== null) {
      return pendingSync;
    }

    if (!isOnlineStatus || options.offlineMode) {
      // Store any pending sessions to local storage
      if (pendingSyncQueue.length > 0) {
        localStorage.setItem('pendingTimeSessions', JSON.stringify(pendingSyncQueue));
      }
      return Promise.resolve(false);
    }

    if (options.onSyncStart) {
      options.onSyncStart();
    }

    pendingSync = new Promise(async (resolve) => {
      try {
        if (pendingSyncQueue.length === 0) {
          lastSyncTime = new Date();
          if (options.onSyncComplete) {
            options.onSyncComplete();
          }
          pendingSync = null;
          resolve(true);
          return;
        }

        // Make a copy of the queue to sync
        const sessionsToSync = [...pendingSyncQueue];
        const result = await bulkSyncSessions(sessionsToSync);

        retryCount = 0;
        lastSyncTime = new Date();
        
        if (options.onSyncComplete) {
          options.onSyncComplete();
        }
        
        pendingSync = null;
        resolve(result);
      } catch (error) {
        console.error('Sync failed:', error);
        
        if (options.onSyncError) {
          options.onSyncError(error);
        }
        
        // Retry if configured
        if (retryCount < (options.retryAttempts || 0)) {
          retryCount++;
          setTimeout(() => {
            pendingSync = null;
            syncNow();
          }, options.retryDelay);
        } else {
          retryCount = 0;
          pendingSync = null;
        }
        
        resolve(false);
      }
    });

    return pendingSync;
  };

  const syncSession = async (session: TimeSession): Promise<boolean> => {
    // Add to queue for syncing
    pendingSyncQueue.push(session);
    
    // Save to local storage in case of page refresh
    localStorage.setItem('pendingTimeSessions', JSON.stringify(pendingSyncQueue));
    
    // If we're online and not in offline mode, try to sync right away
    if (isOnlineStatus && !options.offlineMode) {
      return syncNow();
    }
    
    return Promise.resolve(false);
  };

  const bulkSyncSessions = async (sessions: TimeSession[]): Promise<boolean> => {
    if (!isOnlineStatus || options.offlineMode || sessions.length === 0) {
      return Promise.resolve(false);
    }
    
    try {
      // Upsert all sessions
      const { error } = await supabase
        .from('time_sessions')
        .upsert(
          sessions.map(session => ({
            id: session.id,
            task_id: session.task_id,
            user_id: session.user_id,
            start_time: session.start_time instanceof Date 
              ? session.start_time.toISOString() 
              : session.start_time,
            end_time: session.end_time instanceof Date 
              ? session.end_time.toISOString()
              : session.end_time,
            duration: session.duration,
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        );
      
      if (error) {
        throw error;
      }
      
      // Remove synced sessions from the queue
      pendingSyncQueue = pendingSyncQueue.filter(
        queuedSession => !sessions.some(
          syncedSession => syncedSession.id === queuedSession.id
        )
      );
      
      // Update localStorage
      if (pendingSyncQueue.length === 0) {
        localStorage.removeItem('pendingTimeSessions');
      } else {
        localStorage.setItem('pendingTimeSessions', JSON.stringify(pendingSyncQueue));
      }
      
      return true;
    } catch (error) {
      console.error('Bulk sync failed:', error);
      return false;
    }
  };

  const isOnline = (): boolean => {
    return isOnlineStatus && !options.offlineMode;
  };

  const getLastSyncTime = (): Date | null => {
    return lastSyncTime;
  };

  const cleanup = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    
    isInitialized = false;
  };

  return {
    initialize,
    pauseSync,
    resumeSync,
    syncNow,
    isOnline,
    getLastSyncTime,
    cleanup,
    syncSession,
    bulkSyncSessions
  };
};

/**
 * Type for tracking time allocation by category
 */
export interface CategoryTimeAllocation {
  category: string;
  totalTime: number;
  percentage: number;
}

/**
 * Type for tracking time statistics
 */
export interface TimeStatistics {
  totalTrackedTime: number;
  dailyAverage: number;
  mostProductiveDay: {
    day: string;
    time: number;
  };
  categoryBreakdown: CategoryTimeAllocation[];
  completedTasksTime: number;
  pendingTasksTime: number;
}

/**
 * Calculate time statistics from tracked sessions
 */
export const calculateTimeStatistics = (
  sessions: TimeSession[],
  tasks: any[]
): TimeStatistics => {
  const totalTrackedTime = sessions.reduce(
    (total, session) => total + session.duration, 0
  );
  
  // Group sessions by date to find daily averages and most productive day
  const dayMap = new Map<string, number>();
  sessions.forEach(session => {
    const date = new Date(session.start_time instanceof Date ? 
      session.start_time : new Date(session.start_time));
    const dateKey = date.toISOString().split('T')[0];
    const currentTotal = dayMap.get(dateKey) || 0;
    dayMap.set(dateKey, currentTotal + session.duration);
  });
  
  // Calculate daily average
  const dailyAverage = dayMap.size > 0 ? 
    totalTrackedTime / dayMap.size : 0;
  
  // Find most productive day
  let mostProductiveDay = { day: 'None', time: 0 };
  dayMap.forEach((time, day) => {
    if (time > mostProductiveDay.time) {
      mostProductiveDay = { day, time };
    }
  });
  
  // Group by category
  const categoryMap = new Map<string, number>();
  sessions.forEach(session => {
    const task = tasks.find(t => t.id === session.task_id);
    if (task) {
      const categories = Array.isArray(task.category) ? task.category : [task.category];
      categories.forEach(category => {
        const currentTotal = categoryMap.get(category) || 0;
        categoryMap.set(category, currentTotal + session.duration);
      });
    }
  });
  
  // Calculate category breakdown with percentages
  const categoryBreakdown: CategoryTimeAllocation[] = Array.from(categoryMap.entries())
    .map(([category, time]) => ({
      category,
      totalTime: time,
      percentage: totalTrackedTime > 0 ? (time / totalTrackedTime) * 100 : 0
    }))
    .sort((a, b) => b.totalTime - a.totalTime);
  
  // Calculate time spent on completed vs pending tasks
  const { completedTime, pendingTime } = sessions.reduce(
    (acc, session) => {
      const task = tasks.find(t => t.id === session.task_id);
      if (task) {
        if (task.status === 'completed') {
          acc.completedTime += session.duration;
        } else {
          acc.pendingTime += session.duration;
        }
      }
      return acc;
    },
    { completedTime: 0, pendingTime: 0 }
  );
  
  return {
    totalTrackedTime,
    dailyAverage,
    mostProductiveDay,
    categoryBreakdown,
    completedTasksTime: completedTime,
    pendingTasksTime: pendingTime
  };
};