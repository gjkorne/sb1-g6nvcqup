export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  dependencies?: string[];
  progress: number;
  subtasks: {
    title: string;
    description: string;
    completed?: boolean;
  }[];
  status: 'todo' | 'in_progress' | 'completed';
  dueDate?: Date;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  breakDuration: number; // in minutes
  isActive: boolean;
  currentSession: 'work' | 'break' | null;
}

export interface NLPTaskResult {
  title: string;
  category: string;
  aiResponse: string;
  dueDate?: Date;
  tags: string[];
  subtasks: {
    title: string;
    description: string;
  }[];
  description?: string;
}