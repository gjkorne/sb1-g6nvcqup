import React, { useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { ListFilter, Check, Clock, CheckCircle2, ChevronDown, ChevronRight, Plus, X, Save, Trash2, Timer, Focus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TimeTracker from './TimeTracker';
import { useFocusStore } from '../store/focusStore';
import { TimeEstimate } from '../types';

export default function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const deletedTasks = useTaskStore((state) => state.deletedTasks);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteSubtask = useTaskStore((state) => state.deleteSubtask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const updateTaskCategory = useTaskStore((state) => state.updateTaskCategory);
  const completeTask = useTaskStore((state) => state.completeTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const restoreTask = useTaskStore((state) => state.restoreTask);
  const addSubtask = useTaskStore((state) => state.addSubtask);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
  const [newSubtask, setNewSubtask] = useState<{ [key: string]: string }>({});
  const [isCompactView, setIsCompactView] = useState(false);
  const enterFocusMode = useFocusStore((state) => state.enterFocusMode);

  const formatTime = (estimate: TimeEstimate | undefined) => {
    if (!estimate) return 'No estimate';
    
    if (estimate.unit === 'minutes' && estimate.value >= 60) {
      const hours = Math.floor(estimate.value / 60);
      const minutes = estimate.value % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    
    return `${estimate.value} ${estimate.unit}`;
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    const categories = Array.isArray(task.category) ? task.category : [];
    return categories.includes(filter);
  }).filter((task) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return task.status === 'completed';
    return task.status !== 'completed';
  });

  const startEditing = (task: any) => {
    setEditingTask(task.id);
    setEditValues({
      title: task.title,
      description: task.description || '',
    });
  };

  const saveEdits = async (taskId: string) => {
    await updateTask(taskId, {
      title: editValues.title,
      description: editValues.description,
    });
    setEditingTask(null);
    setEditValues({});
  };

  const startAddingSubtask = (taskId: string) => {
    setNewSubtask({
      ...newSubtask,
      [taskId]: '',
    });
    if (!expandedTasks.has(taskId)) {
      toggleExpanded(taskId);
    }
  };

  const handleAddSubtask = async (taskId: string) => {
    if (newSubtask[taskId]?.trim()) {
      await addSubtask(taskId, {
        title: newSubtask[taskId],
        description: '',
      });
      setNewSubtask({
        ...newSubtask,
        [taskId]: '',
      });
    }
  };

  // Get unique categories, ensuring proper type handling
  const uniqueCategories = Array.from(new Set(
    tasks.flatMap(task => Array.isArray(task.category) ? task.category : [])
      .filter(category => category && typeof category === 'string')
  ));

  const categories = ['all', ...uniqueCategories];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <ListFilter className="w-5 h-5 text-gray-500" />
          <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category === 'all' 
                ? 'All' 
                : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'completed'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className={`px-3 py-1 rounded-full text-sm ${
              isCompactView
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isCompactView ? 'Detailed View' : 'Compact View'}
          </button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className={`bg-white rounded-lg shadow-sm ${isCompactView ? 'py-2 px-3' : 'p-4'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className={`flex items-center gap-2 ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                    {editingTask === task.id ? (
                      <input
                        type="text"
                        value={editValues.title}
                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                        className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <h3 className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                    )}
                    {task.dueDate && !isCompactView && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        Due: {(() => {
                          try {
                            const date = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
                            return format(date, 'MMM d, yyyy');
                          } catch (error) {
                            return 'Invalid date';
                          }
                        })()}
                      </span>
                    )}
                    <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                      • Created {(() => {
                        try {
                          const date = typeof task.createdAt === 'string' ? parseISO(task.createdAt) : new Date(task.createdAt);
                          return format(date, 'MMM d, yyyy');
                        } catch (error) {
                          return 'Unknown date';
                        }
                      })()}
                    </span>
                    {editingTask === task.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdits(task.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(task)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <span className="text-xs">Edit</span>
                      </button>
                    )}
                  </div>
                  {editingTask === task.id ? (
                    <textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : task.description && (
                    <p className={`text-sm text-gray-600 ${isCompactView ? 'hidden' : ''}`}>{task.description}</p>
                  )}
                  {task.timeEstimate && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Timer className="w-3.5 h-3.5" />
                      <span>Estimated: {formatTime(task.timeEstimate)}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <TimeTracker 
                      taskId={task.id} 
                      isDisabled={task.status === 'completed'} 
                    />
                    {!isCompactView && Array.isArray(task.category) && task.category.map((cat) => (
                      <div key={cat} className="flex items-center gap-1">
                        <button
                          onClick={() => setFilter(cat)}
                          className={`px-2 py-1 rounded-full text-xs transition-colors ${
                            filter === cat
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title="Filter by this category"
                        >
                          {cat}
                        </button>
                        <button
                          onClick={() => updateTaskCategory(task.id, cat, false)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title={`Remove ${cat} category`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const newCategory = prompt('Enter a new category:');
                          if (newCategory?.trim()) {
                            updateTaskCategory(task.id, newCategory.trim().toLowerCase(), true);
                          }
                        }}
                        className="px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        + Add Category
                      </button>
                    </div>
                    {!isCompactView && task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {task.subtasks.length > 0 && (
                    <div>
                      <button
                        onClick={() => !isCompactView && toggleExpanded(task.id)} 
                        className="flex items-center gap-1 mt-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span>
                          {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                        </span>
                      </button>
                      {!isCompactView && expandedTasks.has(task.id) && (
                        <div className="mt-2 space-y-2 pl-6">
                          {task.subtasks.map((subtask, index) => (
                            <div
                              key={index}
                              className="flex items-start justify-between gap-2 group"
                          >
                              <div className="flex items-start gap-2 flex-1" onClick={() => toggleSubtask(task.id, index)}>
                                <button className="flex-shrink-0 w-4 h-4 mt-1">
                                  {subtask.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-gray-400 transition-colors" />
                                  )}
                                </button>
                                <span
                                  className={`text-sm ${
                                    subtask.completed
                                      ? 'text-gray-400 line-through'
                                      : 'text-gray-700'
                                  } group-hover:text-gray-900 transition-colors cursor-pointer`}
                                >
                                  {subtask.title}
                                </span>
                              </div>
                              <button
                                onClick={() => deleteSubtask(task.id, subtask.title)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                                title="Delete subtask"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {expandedTasks.has(task.id) && (
                        <div className="mt-2 pl-6">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newSubtask[task.id] || ''}
                              onChange={(e) => setNewSubtask({ ...newSubtask, [task.id]: e.target.value })}
                              placeholder="Add a subtask..."
                              className="flex-1 text-sm px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddSubtask(task.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleAddSubtask(task.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {!task.subtasks.length && (
                    <button
                      onClick={() => startAddingSubtask(task.id)}
                      className="flex items-center gap-1 mt-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add subtask</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => completeTask(task.id)}
                  className={`p-2 rounded-full transition-colors ${
                    task.status === 'completed'
                      ? 'text-green-500 bg-green-50'
                      : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                  }`}
                  title={task.status === 'completed' ? 'Completed' : 'Mark as complete'}
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => enterFocusMode(task.id)}
                  className="p-2 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                  title="Enter focus mode"
                >
                  <Focus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {deletedTasks.map((task) => (
            <div key={task.id} className="bg-red-50 rounded-lg shadow-sm p-4 opacity-75">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-sm">Task deleted</span>
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                </div>
                <button
                  onClick={() => restoreTask(task.id)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Undo2 className="w-4 h-4" />
                  <span>Restore</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}