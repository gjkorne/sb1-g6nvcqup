import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Play, Pause, StopCircle, Focus, Clock, CheckCircle2, Plus } from 'lucide-react';
import { useTimeStore } from '../store/timeStore';
import { useTaskStore } from '../store/taskStore';
import { useFocusStore } from '../store/focusStore';
import { formatDuration } from '../utils/time';
import { Task } from '../types';

export default function ActiveTask() {
  const [isExpanded, setIsExpanded] = useState(true);
  const activeTask = useTaskStore(state => state.activeTask);
  const { isTracking, startTracking, pauseTracking, stopTracking, getTaskTime } = useTimeStore();
  const { enterFocusMode, isActive: isFocusMode } = useFocusStore();
  const toggleSubtask = useTaskStore(state => state.toggleSubtask);
  const addSubtask = useTaskStore(state => state.addSubtask);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (activeTask) enterFocusMode(activeTask.id);
      }
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isTracking) {
          pauseTracking();
        } else if (activeTask) {
          startTracking(activeTask.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTask, isTracking, enterFocusMode, startTracking, pauseTracking]);

  if (!activeTask) return null;

  const elapsedTime = getTaskTime(activeTask.id);
  const completedSubtasks = activeTask.subtasks.filter(st => st.completed).length;
  const totalSubtasks = activeTask.subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await addSubtask(activeTask.id, {
      title: newSubtask,
      description: ''
    });
    setNewSubtask('');
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className={`transition-all duration-300 ${isExpanded ? 'py-4' : 'py-2'}`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <div>
                <h3 className="font-medium text-gray-900">{activeTask.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(elapsedTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTracking ? (
                <>
                  <button
                    onClick={() => pauseTracking()}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-full"
                    title="Pause (Space)"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => stopTracking()}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="Stop"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startTracking(activeTask.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  title="Start (Space)"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => enterFocusMode(activeTask.id)}
                className={`p-2 rounded-full ${
                  isFocusMode
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Focus Mode (Alt+F)"
              >
                <Focus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 space-y-4"
              >
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Subtasks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      Subtasks ({completedSubtasks}/{totalSubtasks})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {activeTask.subtasks.map((subtask, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
                      >
                        <button
                          onClick={() => toggleSubtask(activeTask.id, index)}
                          className={`p-1 rounded-full ${
                            subtask.completed
                              ? 'text-green-500'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                        placeholder="Add subtask..."
                        className="flex-1 px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim()}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}