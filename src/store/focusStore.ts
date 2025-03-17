import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FocusSettings, FocusSession } from '../types';

interface FocusState {
  isActive: boolean;
  currentTaskId: string | null;
  settings: FocusSettings;
  sessions: FocusSession[];
  enterFocusMode: (taskId: string) => void;
  exitFocusMode: () => void;
  updateSettings: (settings: Partial<FocusSettings>) => void;
  addInterruption: () => void;
  getCurrentSession: () => FocusSession | null;
}

const defaultSettings: FocusSettings = {
  autoStartTimer: true,
  showSubtasks: true,
  enableNotifications: true,
  theme: 'light'
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentTaskId: null,
      settings: defaultSettings,
      sessions: [],

      enterFocusMode: (taskId: string) => {
        const newSession: FocusSession = {
          taskId,
          startTime: new Date(),
          duration: 0,
          interruptions: 0
        };

        set({
          isActive: true,
          currentTaskId: taskId,
          sessions: [...get().sessions, newSession]
        });

        // Request notification permission if enabled
        if (get().settings.enableNotifications) {
          Notification.requestPermission();
        }
      },

      exitFocusMode: () => {
        const currentSession = get().getCurrentSession();
        if (currentSession) {
          const endTime = new Date();
          const duration = Math.floor(
            (endTime.getTime() - currentSession.startTime.getTime()) / 1000
          );

          set((state) => ({
            isActive: false,
            currentTaskId: null,
            sessions: state.sessions.map(session =>
              session === currentSession
                ? { ...session, endTime, duration }
                : session
            )
          }));
        }
      },

      updateSettings: (newSettings: Partial<FocusSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      addInterruption: () => {
        const currentSession = get().getCurrentSession();
        if (currentSession) {
          set((state) => ({
            sessions: state.sessions.map(session =>
              session === currentSession
                ? { ...session, interruptions: session.interruptions + 1 }
                : session
            )
          }));
        }
      },

      getCurrentSession: () => {
        const { sessions } = get();
        return sessions.find(
          session => !session.endTime
        ) || null;
      }
    }),
    {
      name: 'focus-store'
    }
  )
);