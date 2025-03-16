import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface TimeSession {
  id?: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
}

interface TimeState {
  isTracking: boolean;
  activeTaskId: string | null;
  currentSession: TimeSession | null;
  sessions: TimeSession[];
  startTracking: (taskId: string) => void;
  pauseTracking: () => void;
  stopTracking: () => void;
  getTaskTime: (taskId: string) => number;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  isTracking: false,
  activeTaskId: null,
  currentSession: null,
  sessions: [],

  startTracking: async (taskId: string) => {
    const { currentSession } = get();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('User must be authenticated to track time');
      return;
    }

    if (currentSession && currentSession.taskId !== taskId) {
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
        taskId: session.task_id,
        startTime: startTime,
        duration: 0
      },
    });

    // Store in localStorage for persistence
    localStorage.setItem('activeSession', JSON.stringify({
      id: session.id,
      taskId: session.task_id,
      startTime: startTime,
      duration: 0
    }));
  },

  pauseTracking: async () => {
    const { currentSession, sessions } = get();
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(currentSession.startTime).getTime()) / 1000);

      const { error } = await supabase
        .from('time_sessions')
        .update({ 
          end_time: endTime,
          duration
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('Error pausing time session:', error);
        return;
      }

      set({
        isTracking: false,
        sessions: [...sessions, { ...currentSession, endTime, duration }],
        currentSession: null,
      });

      localStorage.removeItem('activeSession');
    }
  },

  stopTracking: () => {
    const { currentSession, sessions } = get();
    if (currentSession) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(currentSession.startTime).getTime()) / 1000);

      // Update the session in Supabase
      supabase
        .from('time_sessions')
        .update({ 
          end_time: endTime.toISOString(),
          duration
        })
        .eq('id', currentSession.id)
        .then(({ error }) => {
          if (error) console.error('Error stopping time session:', error);
        });

      const endedSession = {
        ...currentSession,
        endTime,
        duration
      };

      set({
        isTracking: false,
        activeTaskId: null,
        currentSession: null,
        sessions: [...sessions, endedSession],
      });

      localStorage.removeItem('activeSession');
    }
  },

  getTaskTime: (taskId: string) => {
    const { sessions, currentSession } = get();
    const now = Date.now();
    
    // Calculate time from completed sessions
    const completedTime = sessions
      .filter(session => session.taskId === taskId)
      .reduce((total, session) => {
        const start = new Date(session.startTime).getTime();
        const end = session.endTime ? new Date(session.endTime).getTime() : now;
        return total + (end - start);
      }, 0);

    // Add time from current session if it exists and belongs to this task
    const currentTime = currentSession && currentSession.taskId === taskId
      ? now - new Date(currentSession.startTime).getTime()
      : 0;

    return Math.floor((completedTime + currentTime) / 1000); // Convert to seconds
  },
}));