import React, { useEffect, useCallback, useRef } from 'react';
import { X, Timer, Bell, Settings, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { useFocusStore } from '../store/focusStore';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';
import { formatDuration } from '../utils/time';
import { motion, AnimatePresence } from 'framer-motion';

export default function FocusMode() {
  const {
    isActive,
    currentTaskId,
    settings,
    exitFocusMode,
    updateSettings,
    addInterruption
  } = useFocusStore();

  const task = useTaskStore(
    (state) => state.tasks.find(t => t.id === currentTaskId)
  );

  const {
    isTracking,
    startTracking,
    stopTracking,
    getTaskTime
  } = useTimeStore();

  const elapsedTime = getTaskTime(currentTaskId || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      exitFocusMode();
    } else if (e.key === 't' && e.ctrlKey) {
      if (isTracking) {
        stopTracking();
      } else if (currentTaskId) {
        startTracking(currentTaskId);
      }
    }
  }, [exitFocusMode, isTracking, startTracking, stopTracking, currentTaskId]);

  // Set up keyboard listeners and focus trap
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      
      // Focus trap
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements?.length) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        firstElement.focus();
        
        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };
        
        window.addEventListener('keydown', handleTabKey);
        return () => {
          window.removeEventListener('keydown', handleTabKey);
          window.removeEventListener('keydown', handleKeyDown);
        };
      }
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleKeyDown]);

  // Auto-start timer if enabled
  useEffect(() => {
    if (isActive && settings.autoStartTimer && currentTaskId && !isTracking) {
      startTracking(currentTaskId);
    }
  }, [isActive, settings.autoStartTimer, currentTaskId, isTracking, startTracking]);

  if (!isActive || !task) return null;

  const toggleTimer = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking(currentTaskId!);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
        ref={containerRef}
      >
        <div className="max-w-4xl mx-auto px-4 py-8 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                className={`p-2 rounded-full transition-colors ${
                  settings.theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => updateSettings({ enableNotifications: !settings.enableNotifications })}
                className={`p-2 rounded-full transition-colors ${
                  settings.theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={`${settings.enableNotifications ? 'Disable' : 'Enable'} notifications`}
              >
                <Bell className={`w-5 h-5 ${settings.enableNotifications ? 'text-green-500' : ''}`} />
              </button>
            </div>
            <button
              onClick={exitFocusMode}
              className={`p-2 rounded-full transition-colors ${
                settings.theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Exit focus mode (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`text-3xl font-bold mb-4 ${
                settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {task.title}
            </motion.h1>
            
            {task.description && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`text-lg mb-8 ${
                  settings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {task.description}
              </motion.p>
            )}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-6xl font-mono mb-8 ${
                settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {formatDuration(elapsedTime)}
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={toggleTimer}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isTracking
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isTracking ? 'Stop Timer' : 'Start Timer'}
              </button>
              <button
                onClick={addInterruption}
                className={`px-6 py-3 rounded-lg font-medium ${
                  settings.theme === 'dark'
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Log Interruption
              </button>
            </motion.div>
          </div>

          {/* Subtasks */}
          {settings.showSubtasks && task.subtasks.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 max-w-md mx-auto w-full"
            >
              <h2 className={`text-lg font-medium mb-4 ${
                settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Subtasks
              </h2>
              <div className="space-y-2">
                {task.subtasks.map((subtask, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      settings.theme === 'dark'
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        subtask.completed
                          ? 'text-green-500'
                          : settings.theme === 'dark'
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className={subtask.completed ? 'line-through' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}