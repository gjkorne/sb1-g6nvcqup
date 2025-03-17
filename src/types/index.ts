export interface TimeEstimate {
  value: number;
  unit: 'minutes' | 'hours';
}

export interface SubtaskWithEstimate {
  title: string;
  description: string;
  completed?: boolean;
  timeEstimate?: TimeEstimate;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  timeEstimate?: TimeEstimate;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
  };
  dependencies?: string[];
  progress: number;
  subtasks: SubtaskWithEstimate[];
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

export interface FocusSettings {
  autoStartTimer: boolean;
  showSubtasks: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark';
}

export interface FocusSession {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  interruptions: number;
}

export interface NLPTaskResult {
  title: string;
  category: string;
  aiResponse: string;
  dueDate?: Date;
  tags: string[];
  timeEstimate?: TimeEstimate;
  clarifyingQuestions?: string[];
  priority?: 'low' | 'medium' | 'high';
  subtasks: {
    title: string;
    description: string;
  }[];
  description?: string;
}