import { create } from 'zustand';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be authenticated');
  return user.id;
}

interface TaskState {
  tasks: Task[];
  activeTask: Task | null;
  setTaskActive: (taskId: string) => Promise<void>;
  getActiveTask: () => Task | null;
  deletedTasks: Task[];
  loadTasks: () => Promise<void>;
  addTask: (taskData: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  addSubtask: (taskId: string, subtask: { title: string; description: string }) => void;
  completeTask: (taskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskTitle: string) => void;
  deleteTask: (taskId: string) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskIndex: number) => void;
  updateTimeEstimate: (taskId: string, timeEstimate: TimeEstimate) => Promise<void>;
  updateSubtaskTimeEstimate: (taskId: string, subtaskIndex: number, timeEstimate: TimeEstimate) => Promise<void>;
  setActiveTask: (task: Task | null) => void;
  updateTaskCategory: (taskId: string, category: string, add: boolean) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  deletedTasks: [],
  activeTask: null,
  setTaskActive: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ task_status: 'in_progress' })
        .eq('id', taskId);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? { ...task, task_status: 'in_progress' }
            : task
        ),
        activeTask: state.tasks.find(task => task.id === taskId) || null
      }));
    } catch (error) {
      console.error('Error setting task active:', error);
    }
  },
  getActiveTask: () => get().activeTask,
  loadTasks: async () => {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        subtasks (*)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading tasks:', error);
      return;
    }

    // Convert time_estimate from database to TimeEstimate object
    const formattedTasks = tasks?.map(task => ({
      ...task,
      timeEstimate: task.time_estimate ? {
        value: task.time_estimate,
        unit: 'minutes'
      } : undefined,
      subtasks: task.subtasks?.map((subtask: any) => ({
        ...subtask,
        timeEstimate: subtask.time_estimate ? {
          value: subtask.time_estimate,
          unit: 'minutes'
        } : undefined
      })) || []
    })) || [];

    set({ tasks: formattedTasks });
  },
  addTask: async (taskData) => {
    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title || '',
      timeEstimate: taskData.timeEstimate,
      category: Array.isArray(taskData.category) ? taskData.category : [taskData.category || 'general'],
      tags: taskData.tags || [],
      status: 'todo',
      timeSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData,
    };

    try {
      const userId = await getCurrentUserId();

      // Insert task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          time_estimate: taskData.timeEstimate ? (
            taskData.timeEstimate.unit === 'hours' 
              ? taskData.timeEstimate.value * 60 
              : taskData.timeEstimate.value
          ) : null,
          category: Array.isArray(newTask.category) ? newTask.category : [newTask.category],
          tags: newTask.tags,
          status: newTask.status,
          due_date: newTask.dueDate,
          time_spent: newTask.timeSpent,
          user_id: userId
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Insert subtasks if any
      if (newTask.subtasks.length > 0) {
        const { error: subtasksError } = await supabase
          .from('subtasks')
          .insert(
            newTask.subtasks.map(subtask => ({
              task_id: newTask.id,
              title: subtask.title,
              description: subtask.description,
              time_estimate: subtask.timeEstimate ? (
                subtask.timeEstimate.unit === 'hours'
                  ? subtask.timeEstimate.value * 60
                  : subtask.timeEstimate.value
              ) : null,
              completed: subtask.completed || false
            }))
          );

        if (subtasksError) throw subtasksError;
      }

      set((state) => ({ tasks: [...state.tasks, newTask] }));
    } catch (error) {
      console.error('Error adding task:', error);
    }
  },
  updateTask: async (taskId, updates) => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date()
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },
  completeTask: async (taskId) => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          updated_at: new Date()
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Mark all subtasks as completed
      const { error: subtasksError } = await supabase
        .from('subtasks')
        .update({ completed: true })
        .eq('task_id', taskId);

      if (subtasksError) throw subtasksError;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: 'completed',
                subtasks: task.subtasks.map(subtask => ({ ...subtask, completed: true })),
                updatedAt: new Date()
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  },
  updateTaskCategory: async (taskId: string, category: string, add: boolean) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task) return;

      const currentCategories = Array.isArray(task.category) ? task.category : [];
      const updatedCategories = add
        ? [...new Set([...currentCategories, category])]
        : currentCategories.filter(c => c !== category);

      const { error } = await supabase
        .from('tasks')
        .update({ 
          category: updatedCategories,
          updated_at: new Date()
        })
        .eq('id', taskId);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, category: updatedCategories, updatedAt: new Date() }
            : t
        ),
      }));
    } catch (error) {
      console.error('Error updating task category:', error);
    }
  },
  addSubtask: async (taskId, subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          title: subtask.title,
          description: subtask.description,
        });

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: [...task.subtasks, { ...subtask, completed: false }],
                updatedAt: new Date(),
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  },
  deleteSubtask: async (taskId, subtaskTitle) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('task_id', taskId)
        .eq('title', subtaskTitle);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.filter(
                  (subtask) => subtask.title !== subtaskTitle
                ),
                updatedAt: new Date(),
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  },
  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks') 
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', taskId)
        .select();

      if (error) throw error;

      const deletedTask = useTaskStore.getState().tasks.find(t => t.id === taskId);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId),
        deletedTasks: [...state.deletedTasks, deletedTask],
      }));

      // Schedule hard delete after 10 seconds
      setTimeout(async () => {
        const stillDeleted = useTaskStore.getState().deletedTasks.some(t => t.id === taskId);
        if (stillDeleted) {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

          if (error) console.error('Error hard deleting task:', error);
          
          set((state) => ({
            deletedTasks: state.deletedTasks.filter(t => t.id !== taskId),
          }));
        }
      }, 10000);

    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },

  restoreTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ deleted_at: null })
        .eq('id', taskId);

      if (error) throw error;

      const restoredTask = get().deletedTasks.find(t => t.id === taskId);
      set((state) => ({
        tasks: [...state.tasks, restoredTask],
        deletedTasks: state.deletedTasks.filter(t => t.id !== taskId),
      }));
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  },
  toggleSubtask: async (taskId, subtaskIndex) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task) return;

      const subtask = task.subtasks[subtaskIndex];
      const completed = !subtask.completed;

      const { error } = await supabase
        .from('subtasks')
        .update({ completed })
        .eq('task_id', taskId)
        .eq('title', subtask.title);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask, index) =>
                  index === subtaskIndex
                    ? { ...subtask, completed }
                    : subtask
                ),
                updatedAt: new Date(),
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error toggling subtask:', error);
    }
  },
  updateTimeEstimate: async (taskId, timeEstimate) => {
    try {
      // Convert to minutes for database storage
      const timeEstimateMinutes = timeEstimate.unit === 'hours'
        ? timeEstimate.value * 60
        : timeEstimate.value;
      
      const { error } = await supabase
        .from('tasks')
        .update({
          time_estimate: timeEstimateMinutes,
          updated_at: new Date()
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                timeEstimate,
                updatedAt: new Date()
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error updating time estimate:', error);
    }
  },
  updateSubtaskTimeEstimate: async (taskId, subtaskIndex, timeEstimate) => {
    try {
      const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
      if (!task || !task.subtasks[subtaskIndex]) return;
      
      const subtask = task.subtasks[subtaskIndex];
      
      // Convert to minutes for database storage
      const timeEstimateMinutes = timeEstimate.unit === 'hours'
        ? timeEstimate.value * 60
        : timeEstimate.value;
      
      const { error } = await supabase
        .from('subtasks')
        .update({
          time_estimate: timeEstimateMinutes,
          updated_at: new Date()
        })
        .eq('task_id', taskId)
        .eq('title', subtask.title);
        
      if (error) throw error;
      
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((s, index) =>
                  index === subtaskIndex
                    ? { ...s, timeEstimate }
                    : s
                ),
                updatedAt: new Date()
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error updating subtask time estimate:', error);
    }
  },
  setActiveTask: (task) =>
    set((state) => ({
      activeTask: task
    }))
}));