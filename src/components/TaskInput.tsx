import React, { useState } from 'react';
import { Plus, Loader2, AlertCircle, Check, X, Trash2 } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { processTaskWithNLP } from '../utils/nlp';

export default function TaskInput() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTask, setPendingTask] = useState<any>(null);
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processedTask = await processTaskWithNLP(input);
      
      if (processedTask.error) {
        setError(processedTask.error);
        setIsProcessing(false);
        return;
      }
      
      const { error: _, ...taskData } = processedTask;
      setPendingTask(taskData);
      setInput('');
    } catch (error) {
      console.error('Error processing task:', error);
      setError('Failed to create task. Please try again.');
    }
    setIsProcessing(false);
  };

  const handleConfirm = () => {
    if (pendingTask) {
      addTask(pendingTask);
      handleReset();
    }
  };

  const handleQuickAdd = () => {
    if (pendingTask) {
      const { subtasks, ...basicTask } = pendingTask;
      addTask({ ...basicTask, subtasks: [] });
      handleReset();
    }
  };

  const handleReset = () => {
    setPendingTask(null);
    setInput('');
  };

  const handleReject = () => {
    handleReset();
    setInput(pendingTask?.title || '');
  };

  const removeSubtask = (index: number) => {
    if (pendingTask) {
      const updatedSubtasks = [...pendingTask.subtasks];
      updatedSubtasks.splice(index, 1);
      setPendingTask({ ...pendingTask, subtasks: updatedSubtasks });
    }
  };

  return (
    <div className="space-y-2">
      {pendingTask && (
        <div className="bg-white rounded-lg border p-4 mb-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Confirm Task Details</h3>
              <p className="text-sm text-gray-500 mt-1">{pendingTask.aiResponse}</p>
            </div>
            <div className="flex items-center gap-2">
              {pendingTask.subtasks.length > 0 && (
                <button
                  onClick={handleQuickAdd}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  title="Add task without subtasks"
                >
                  Quick Add
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                title="Confirm"
              >
                <Check className="w-5 h-5" />
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={handleReject}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Cancel"
              >
                <X className="w-5 h-5" />
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Task</p>
              <p className="text-sm text-gray-900">{pendingTask.title}</p>
            </div>
            {pendingTask.description && (
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-900">{pendingTask.description}</p>
              </div>
            )}
            <div className="flex gap-2">
              {Array.isArray(pendingTask.category) ? pendingTask.category.map((cat) => (
                <span key={cat} className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-600">
                  {cat}
                </span>
              )) : (
                <span className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-600">
                  {pendingTask.category || 'general'}
                </span>
              )}
              {pendingTask.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
            {pendingTask.subtasks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Subtasks</p>
                <ul className="mt-2 space-y-2">
                  {pendingTask.subtasks.map((subtask: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 mt-1 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-900">{subtask.title}</span>
                      </div>
                      <button
                        onClick={() => removeSubtask(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Remove subtask"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center bg-gray-50 rounded-lg border focus-within:border-blue-500 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your task..."
            className="w-full px-4 py-3 pr-12 text-gray-700 bg-transparent rounded-lg focus:outline-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="absolute right-2 p-2 text-gray-600 hover:text-blue-500 disabled:opacity-50 bg-white rounded-full shadow-sm"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}