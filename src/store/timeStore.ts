import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { persist } from 'zustand/middleware';
import { useTaskStore } from './taskStore';
import { createTimeSyncManager, calculateTimeStatistics, TimeStatistics } from '../utils/timeTrackingUtils';

interface TimeSession {
  id?: string;
  task_id: string;
  start_time: Date;
  end_time?: Date | null;
  duration: number;
  user_id?: string;
  time_zone?: string;
  session_type?: 'manual' | 'pomodoro' | 'focus' | 'auto';
  notes?: string;
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
  statistics: TimeStatistics | null;
  loadSessions: () => Promise<void>;
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  stopTracking: () => void;
  getTaskTime: (taskId: string) => number;
  syncTimeData: () => Promise<void>;
  calculateStatistics: (tasks: any[]) => void;
  addNote: (sessionId: string, note: string) => Promise<void>;
  setSessionType: (type: TimeSession['session_type']) => void;
}

const timeSyncManager = createTimeSyncManager();

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      isTracking: false,
      activeTaskId: null,
      currentSession: null,
      sessions: [],
      statistics: null,
      syncStatus: {
        state: 'synced',
        lastSynced: null,
        error: null
      },

      loadSessions: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const { data: sessions, error } = await supabase
          .from('time_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', startOfToday.toISOString())
          .lte('start_time', endOfToday.toISOString())
          .order('start_time', { ascending: false });

        if (error) {
          console.error('Error loading time sessions:', error);
          return;
        }

        // Convert string dates to Date objects
        const formattedSessions = sessions.map(session => ({
          ...session,
          start_time: session.start_time,
          end_time: session.end_time,
          duration: session.duration || Math.floor((new Date().getTime() - new Date(session.start_time).getTime()) / 1000)
        }));

        set({ sessions: formattedSessions });
      },

      startTracking: async (taskId: string) => {
        const { currentSession } = get();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('User must be authenticated to track time');
          return;
        }
        
        // Update task status in Supabase
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ task_status: 'in_progress' })
          .eq('id', taskId);

        if (taskError) {
          console.error('Error updating task status:', taskError);
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
      },

      calculateStatistics: (tasks) => {
        const { sessions } = get();
        const stats = calculateTimeStatistics(sessions, tasks);
        set({ statistics: stats });
      },
      
      addNote: async (sessionId: string, note: string) => {
        const { error } = await supabase
          .from('time_sessions')
          .update({ notes: note })
          .eq('id', sessionId);

        if (error) {
          console.error('Error adding note:', error);
          return;
        }

        set(state => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, notes: note }
              : session
          )
        }));
      },

      setSessionType: async (type) => {
        const { currentSession } = get();
        if (!currentSession) return;

        const { error } = await supabase
          .from('time_sessions')
          .update({ session_type: type })
          .eq('id', currentSession.id);

        if (error) {
          console.error('Error updating session type:', error);
          return;
        }

        set(state => ({
          currentSession: state.currentSession
            ? { ...state.currentSession, session_type: type }
            : null
        }));
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