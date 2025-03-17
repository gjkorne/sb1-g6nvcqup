import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { persist } from 'zustand/middleware';

interface TimeSession {
  id?: string;
  task_id: string;
  start_time: Date;
  end_time?: Date | null;
  duration: number;
  user_id?: string;
}

interface SyncStatus {
  state: 'synced' | 'syncing' | 'offline' | 'error';
  lastSynced: Date | null;
  error: string | null;
}

interface TimeState {
  isTracking: boolean;
  activeTaskId: string | null;
  currentSession: TimeSession | null;
  sessions: TimeSession[];
  syncStatus: SyncStatus;
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  stopTracking: () => void;
  getTaskTime: (taskId: string) => number;
  syncTimeData: () => Promise<void>;
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      isTracking: false,
      activeTaskId: null,
      currentSession: null,
      sessions: [],
      syncStatus: {
        state: 'synced',
        lastSynced: null,
        error: null
      },

      startTracking: async (taskId: string) => {
        const { currentSession } = get();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('User must be authenticated to track time');
          return;
        }

        if (currentSession && currentSession.task_id !== taskId) {
          get().stopTracking();
        }

        const startTime = new Date();

        const newSession = {
          task_id: taskId,
          user_id: user.id,
          start_time: startTime.toISOString(),
          duration: 0
        };

        const { data: session, error } = await supabase
          .from('time_sessions')
          .insert(newSession)
          .select()
          .single();

        if (error) {
          console.error('Error starting time session:', error);
          return;
        }

        set({
          isTracking: true,
          activeTaskId: taskId,
          currentSession: {
            id: session.id,
            task_id: taskId,
            start_time: new Date(session.start_time),
            user_id: user.id,
            duration: 0
          },
          syncStatus: {
            ...get().syncStatus,
            state: 'synced',
            lastSynced: new Date()
          }
        });

        // Start background sync
        if (!window._syncInterval) {
          window._syncInterval = setInterval(() => {
            get().syncTimeData();
          }, 30000);
        }
      },

      pauseTracking: async () => {
        const { currentSession, sessions } = get();
        if (currentSession) {
          const end_time = new Date();
          const start = new Date(currentSession.start_time);
          const duration = Math.floor((end_time.getTime() - start.getTime()) / 1000);

          const { error } = await supabase
            .from('time_sessions')
            .update({ 
              end_time: end_time.toISOString(),
              duration
            })
            .eq('id', currentSession.id);

          if (error) {
            console.error('Error pausing time session:', error);
            return;
          }

          set({
            isTracking: false,
            sessions: [...sessions, { ...currentSession, end_time, duration }],
            currentSession: null,
          });

          // Clear sync interval
          if (window._syncInterval) {
            clearInterval(window._syncInterval);
            window._syncInterval = undefined;
          }
        }
      },

      stopTracking: () => {
        const { currentSession, sessions } = get();
        if (currentSession) {
          const end_time = new Date();
          const start = new Date(currentSession.start_time);
          const duration = Math.floor((end_time.getTime() - start.getTime()) / 1000);

          // Update the session in Supabase
          supabase
            .from('time_sessions')
            .update({ 
              end_time: end_time.toISOString(),
              duration
            })
            .eq('id', currentSession.id)
            .then(({ error }) => {
              if (error) console.error('Error stopping time session:', error);
            });

          const endedSession = {
            ...currentSession,
            end_time,
            duration
          };

          set({
            isTracking: false,
            activeTaskId: null,
            currentSession: null,
            sessions: [...sessions, endedSession],
          });

          // Clear sync interval
          if (window._syncInterval) {
            clearInterval(window._syncInterval);
            window._syncInterval = undefined;
          }
        }
      },

      getTaskTime: (taskId: string) => {
        const { sessions, currentSession } = get();
        const now = Date.now();
        
        // Calculate time from completed sessions
        const completedTime = sessions
          .filter(session => session.task_id === taskId)
          .reduce((total, session) => {
            const start = new Date(session.start_time).getTime();
            const end = session.end_time ? new Date(session.end_time).getTime() : now;
            return total + (end - start);
          }, 0);

        // Add time from current session if it exists and belongs to this task
        const currentTime = currentSession && currentSession.task_id === taskId
          ? now - new Date(currentSession.start_time).getTime()
          : 0;

        return Math.floor((completedTime + currentTime) / 1000); // Convert to seconds
      },

      syncTimeData: async () => {
        const { currentSession, syncStatus } = get();
        
        if (!currentSession) return;
        
        try {
          set({ syncStatus: { ...syncStatus, state: 'syncing' } });
          
          const duration = Math.floor(
            (new Date().getTime() - new Date(currentSession.start_time).getTime()) / 1000
          );

          const { error } = await supabase
            .from('time_sessions')
            .update({ duration })
            .eq('id', currentSession.id);

          if (error) throw error;

          set({
            syncStatus: {
              state: 'synced',
              lastSynced: new Date(),
              error: null
            }
          });
        } catch (error) {
          console.error('Error syncing time data:', error);
          set({
            syncStatus: {
              state: 'error',
              lastSynced: get().syncStatus.lastSynced,
              error: error.message
            }
          });
        }
      }
    }),
    {
      name: 'time-store',
      onRehydrateStorage: () => (state) => {
        // Check for interrupted sessions
        if (state?.currentSession && !window._syncInterval) {
          window._syncInterval = setInterval(() => {
            state.syncTimeData();
          }, 30000);
        }
      }
    }
  )
);

// Add type declaration for sync interval
declare global {
  interface Window {
    _syncInterval?: NodeJS.Timeout;
  }
}