import React, { useState } from 'react';
import { Plus, Loader2, AlertCircle, Check, X, Trash2, Clock, HelpCircle, Timer } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { processTaskWithNLP } from '../utils/nlp';
import { TimeEstimate, SubtaskWithEstimate } from '../types';

export default function TaskInput() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTask, setPendingTask] = useState<any>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<{[key: string]: string}>({});
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
    setClarificationAnswers({});
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

  const updateSubtaskTime = (index: number, newTime: number) => {
    if (pendingTask) {
      const updatedSubtasks = [...pendingTask.subtasks];
      updatedSubtasks[index] = {
        ...updatedSubtasks[index],
        timeEstimate: {
          ...updatedSubtasks[index].timeEstimate,
          value: newTime
        }
      };
      setPendingTask({ ...pendingTask, subtasks: updatedSubtasks });
    }
  };

  const updateTaskTime = (newTime: number) => {
    if (pendingTask && pendingTask.timeEstimate) {
      setPendingTask({
        ...pendingTask,
        timeEstimate: {
          ...pendingTask.timeEstimate,
          value: newTime
        }
      });
    }
  };

  const formatTime = (estimate: TimeEstimate | undefined) => {
    if (!estimate) return 'No estimate';
    
    // Convert minutes to hours and minutes display
    if (estimate.unit === 'minutes' && estimate.value >= 60) {
      const hours = Math.floor(estimate.value / 60);
      const minutes = estimate.value % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    
    return `${estimate.value} ${estimate.unit}`;
  };

  const handleClarificationSubmit = async () => {
    if (!pendingTask || !pendingTask.clarifyingQuestions) return;
    
    setIsProcessing(true);
    
    // Prepare a new prompt that includes the original task plus answers
    const clarifiedPrompt = `
      Original task: ${pendingTask.title}
      
      Additional information:
      ${pendingTask.clarifyingQuestions.map((q: string, i: number) => 
        `Q: ${q}\nA: ${clarificationAnswers[i] || 'No answer provided'}`
      ).join('\n\n')}
      
      Please refine your task analysis with this additional information.
    `;
    
    try {
      const refinedTask = await processTaskWithNLP(clarifiedPrompt);
      if (!refinedTask.error) {
        setPendingTask({
          ...refinedTask,
          // Preserve the original title if the AI changes it too much
          title: pendingTask.title
        });
      }
    } catch (error) {
      console.error('Error refining task:', error);
    }
    
    setIsProcessing(false);
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
              </button>
              <button
                onClick={handleReject}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Task</p>
              <p className="text-sm text-gray-900">{pendingTask.title}</p>
              
              {/* Time Estimate Section */}
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Timer className="w-4 h-4 text-gray-500" />
                    Time Estimate
                  </p>
                  <span className="text-xs text-gray-500">
                    {pendingTask.timeEstimate ? formatTime(pendingTask.timeEstimate) : 'No estimate'}
                  </span>
                </div>
                
                {pendingTask.timeEstimate && (
                  <div className="mt-1">
                    <input
                      type="range"
                      min={5}
                      max={pendingTask.timeEstimate.unit === 'hours' ? 480 : 180}
                      step={5}
                      value={pendingTask.timeEstimate.value}
                      onChange={(e) => updateTaskTime(parseInt(e.target.value))}
                      className="w-full accent-blue-600 h-2"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Clarifying Questions Section */}
            {pendingTask.clarifyingQuestions && pendingTask.clarifyingQuestions.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-800">Some questions to improve this task:</h4>
                </div>
                
                {pendingTask.clarifyingQuestions.map((question: string, index: number) => (
                  <div key={index} className="space-y-1">
                    <p className="text-sm text-blue-700">{question}</p>
                    <input
                      type="text"
                      value={clarificationAnswers[index] || ''}
                      onChange={(e) => setClarificationAnswers({
                        ...clarificationAnswers,
                        [index]: e.target.value
                      })}
                      placeholder="Your answer..."
                      className="w-full text-sm px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
                
                <button
                  onClick={handleClarificationSubmit}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Update Task Based on Answers</span>
                </button>
              </div>
            )}

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
              
              {pendingTask.priority && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pendingTask.priority === 'high' ? 'bg-red-50 text-red-600' :
                  pendingTask.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                  'bg-green-50 text-green-600'
                }`}>
                  {pendingTask.priority} priority
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
                <ul className="mt-2 space-y-3">
                  {pendingTask.subtasks.map((subtask: SubtaskWithEstimate, index: number) => (
                    <li key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 flex-col">
                        <div className="flex items-start gap-2 flex-1">
                          <div className="w-3 h-3 mt-1.5 rounded-full border-2 border-gray-300" />
                          <div className="space-y-1 flex-1">
                            <p className="text-sm text-gray-900">{subtask.title}</p>
                            {subtask.description && (
                              <p className="text-xs text-gray-500">{subtask.description}</p>
                            )}
                            
                            {/* Subtask Time Estimate */}
                            {subtask.timeEstimate && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(subtask.timeEstimate)}</span>
                                </div>
                                <input
                                  type="range"
                                  min={5}
                                  max={120}
                                  step={5}
                                  value={subtask.timeEstimate.value}
                                  onChange={(e) => updateSubtaskTime(index, parseInt(e.target.value))}
                                  className="flex-1 accent-blue-600 h-1.5"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeSubtask(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Remove subtask"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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