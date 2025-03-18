import React, { useState, useEffect } from 'react';
import { useTaskStore, Task } from '../store/taskStore';
import { ListFilter, Check, Clock, CheckCircle2, ChevronDown, ChevronRight, Plus, X, Save, Trash2, Timer, Focus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import TimeTracker from './TimeTracker';
import { useFocusStore } from '../store/focusStore';
import { TimeEstimate } from '../types';
import { motion } from 'framer-motion';
import TaskCard from './TaskCard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const activeTask = useTaskStore((state) => state.activeTask);
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
  const [priorityTasks, setPriorityTasks] = useState<string[]>([]);
  const enterFocusMode = useFocusStore((state) => state.enterFocusMode);
  const [nextTasks, setNextTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Initialize task lists
    const active = tasks.filter(t => t.status !== 'completed');
    setNextTasks(active.filter(t => priorityTasks.includes(t.id)));
    setAllTasks(active.filter(t => !priorityTasks.includes(t.id)));
  }, [tasks, priorityTasks]);

  const handleDragEnd = async (result: any) => {
    const { source, destination } = result;
    
    if (!destination) return;

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      const items = source.droppableId === 'next-tasks' ? [...nextTasks] : [...allTasks];
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);
      
      if (source.droppableId === 'next-tasks') {
        setNextTasks(items);
      } else {
        setAllTasks(items);
      }
    } 
    // Moving between lists
    else {
      const sourceItems = source.droppableId === 'next-tasks' ? [...nextTasks] : [...allTasks];
      const destItems = destination.droppableId === 'next-tasks' ? [...nextTasks] : [...allTasks];
      
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      
      if (destination.droppableId === 'next-tasks') {
        if (destItems.length <= 3) {
          setNextTasks(destItems);
          setAllTasks(sourceItems);
          setPriorityTasks([...priorityTasks, removed.id]);
        }
      } else {
        setNextTasks(sourceItems);
        setAllTasks(destItems);
        setPriorityTasks(priorityTasks.filter(id => id !== removed.id));
      }
    }
  };

  // Handle priority task management
  const togglePriorityTask = (taskId: string) => {
    setPriorityTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), taskId];
      }
      return [...prev, taskId];
    });
  };

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
          {/* Priority Tasks Section */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Next Tasks</h3>
              <p className="text-sm text-gray-500 mb-4">Drag up to 3 most important tasks here</p>
              <Droppable droppableId="next-tasks">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[100px] bg-blue-50/50 p-4 rounded-lg border-2 border-dashed border-blue-200"
                  >
                    {nextTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white rounded-lg shadow-sm p-4 ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            <TaskCard
                              task={task}
                              isCompactView={isCompactView}
                              isPriority={true}
                              onTogglePriority={() => togglePriorityTask(task.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

          {/* Active Task Section */}
          {activeTask && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-r from-green-50 to-white rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Currently Working On</span>
              </div>
              <TaskCard
                task={activeTask}
                isCompactView={false}
                isPriority={priorityTasks.includes(activeTask.id)}
                onTogglePriority={() => togglePriorityTask(activeTask.id)}
              />
            </motion.div>
          )}

          {/* Main Task List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Tasks</h3>
            <Droppable droppableId="all-tasks">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {allTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`bg-white rounded-lg shadow-sm ${
                            isCompactView ? 'py-2 px-3' : 'p-4'
                          } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <TaskCard
                            task={task}
                            isCompactView={isCompactView}
                            isPriority={false}
                            onTogglePriority={() => togglePriorityTask(task.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}