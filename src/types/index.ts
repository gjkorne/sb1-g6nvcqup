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
  description: string | null;
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
  dueDate: Date | null;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  task_status: 'not_started' | 'in_progress' | 'completed';
}

export interface TimeSession {
  id: string;
  task_id: string;
  start_time: Date | string;
  end_time?: Date | string | null;
  duration: number; // in seconds
  user_id?: string;
  time_zone?: string;
  session_type?: 'manual' | 'pomodoro' | 'focus' | 'auto';
  notes?: string;
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