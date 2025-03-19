// src/components/widgets/Widget.tsx
import React, { ReactNode } from 'react';

export interface WidgetProps {
  title: string;
  icon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
  children: ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Widget({ 
  title, 
  icon, 
  className = '', 
  fullWidth = false,
  children,
  onRefresh,
  isLoading = false
}: WidgetProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${fullWidth ? 'col-span-full' : ''} ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {icon && <div className="text-gray-500">{icon}</div>}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// src/components/widgets/TaskStatsWidget.tsx
import React, { useMemo } from 'react';
import { BarChart2, ArrowUp, ArrowDown } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import Widget from './Widget';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

const StatCard = ({ title, value, change, changeLabel, icon }: StatCardProps) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        
        {(change !== undefined) && (
          <div className="flex items-center mt-1">
            {change > 0 ? (
              <ArrowUp className="w-3 h-3 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="w-3 h-3 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(change)}% {changeLabel || 'vs last week'}
            </span>
          </div>
        )}
      </div>
      {icon && (
        <div className="p-2 rounded-full bg-white shadow-sm">
          {icon}
        </div>
      )}
    </div>
  </div>
);

export default function TaskStatsWidget() {
  const tasks = useTaskStore(state => state.tasks);
  
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = typeof t.dueDate === 'string' ? new Date(t.dueDate) : t.dueDate;
      return dueDate < new Date() && t.status !== 'completed';
    }).length;
    
    return { total, completed, inProgress, overdue };
  }, [tasks]);
  
  return (
    <Widget 
      title="Task Statistics" 
      icon={<BarChart2 className="w-5 h-5" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Tasks" 
          value={stats.total} 
          change={5} 
        />
        <StatCard 
          title="Completed" 
          value={stats.completed} 
          change={12} 
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          change={-3} 
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdue} 
          change={stats.overdue > 0 ? 8 : -8} 
          changeLabel="from last week"
        />
      </div>
    </Widget>
  );
}

// src/components/widgets/CategoryBreakdownWidget.tsx
import React, { useMemo } from 'react';
import { PieChart, Tag } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import Widget from './Widget';

export default function CategoryBreakdownWidget() {
  const tasks = useTaskStore(state => state.tasks);
  
  const categoryData = useMemo(() => {
    const categories = new Map<string, number>();
    
    tasks.forEach(task => {
      if (Array.isArray(task.category)) {
        task.category.forEach(cat => {
          if (!cat) return;
          const count = categories.get(cat) || 0;
          categories.set(cat, count + 1);
        });
      } else if (task.category) {
        const count = categories.get(task.category) || 0;
        categories.set(task.category, count + 1);
      }
    });
    
    return Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);
  
  // Color palette
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
    'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
  ];
  
  return (
    <Widget 
      title="Category Breakdown" 
      icon={<Tag className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Category bar visualization */}
        <div className="h-10 rounded-lg overflow-hidden flex">
          {categoryData.map((category, index) => {
            const percentage = (category.count / tasks.length) * 100;
            if (percentage < 2) return null; // Don't display very small categories
            
            return (
              <div 
                key={category.name}
                className={`${colors[index % colors.length]} h-full`}
                style={{ width: `${percentage}%` }}
                title={`${category.name}: ${category.count} tasks (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        
        {/* Category details */}
        <div className="grid grid-cols-2 gap-4">
          {categoryData.slice(0, 6).map((category, index) => (
            <div key={category.name} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{category.name}</span>
                  <span className="text-xs text-gray-500">{category.count}</span>
                </div>
                <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                  <div 
                    className={colors[index % colors.length]}
                    style={{ width: `${(category.count / tasks.length) * 100}%`, height: '100%', borderRadius: '9999px' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}

// src/components/widgets/TimeAnalyticsWidget.tsx
import React from 'react';
import { Clock, BarChart } from 'lucide-react';
import { useTimeStore } from '../../store/timeStore';
import { useTaskStore } from '../../store/taskStore';
import Widget from './Widget';
import { formatDuration } from '../../utils/time';

export default function TimeAnalyticsWidget() {
  const sessions = useTimeStore(state => state.sessions);
  const tasks = useTaskStore(state => state.tasks);
  
  // Calculate total tracked time
  const totalTimeTracked = sessions.reduce((total, session) => {
    return total + session.duration;
  }, 0);
  
  // Calculate most active hours
  const hourlyData = sessions.reduce((hours, session) => {
    const startTime = typeof session.start_time === 'string' 
      ? new Date(session.start_time) 
      : session.start_time;
    
    const hour = startTime.getHours();
    hours[hour] = (hours[hour] || 0) + session.duration;
    
    return hours;
  }, {} as Record<number, number>);
  
  // Find peak hour
  let peakHour = 0;
  let peakValue = 0;
  
  Object.entries(hourlyData).forEach(([hour, duration]) => {
    if (duration > peakValue) {
      peakHour = parseInt(hour);
      peakValue = duration;
    }
  });
  
  // Calculate per-task time
  const taskTimeData = sessions.reduce((taskTimes, session) => {
    const taskId = session.task_id;
    if (!taskId) return taskTimes;
    
    taskTimes[taskId] = (taskTimes[taskId] || 0) + session.duration;
    return taskTimes;
  }, {} as Record<string, number>);
  
  // Sort tasks by time spent
  const tasksByTime = Object.entries(taskTimeData)
    .map(([taskId, duration]) => {
      const task = tasks.find(t => t.id === taskId);
      return {
        id: taskId,
        title: task?.title || 'Unknown task',
        duration
      };
    })
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 5);
  
  return (
    <Widget 
      title="Time Analytics" 
      icon={<Clock className="w-5 h-5" />}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-500">Total Time Tracked</p>
            <p className="text-xl font-semibold text-blue-700">{formatDuration(totalTimeTracked)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-500">Peak Productivity</p>
            <p className="text-xl font-semibold text-purple-700">
              {peakHour}:00 - {(peakHour + 1) % 24}:00
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Most Time Spent On</h4>
          <div className="space-y-3">
            {tasksByTime.map(task => (
              <div key={task.id} className="flex items-center">
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (task.duration / tasksByTime[0].duration) * 100)}%` }}
                  />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">{formatDuration(task.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
}

// src/components/widgets/RecentActivityWidget.tsx
import React from 'react';
import { Activity, CheckCircle, Clock } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useTimeStore } from '../../store/timeStore';
import { formatDistanceToNow } from 'date-fns';
import Widget from './Widget';

export default function RecentActivityWidget() {
  const tasks = useTaskStore(state => state.tasks);
  const sessions = useTimeStore(state => state.sessions);
  
  // Combine recent tasks and sessions
  const activities = [
    // Recently completed tasks
    ...tasks
      .filter(task => task.status === 'completed')
      .map(task => ({
        id: `task-${task.id}`,
        type: 'task_completed',
        title: task.title,
        timestamp: task.updatedAt || new Date(),
        taskId: task.id
      })),
    
    // Recent time tracking sessions
    ...sessions
      .filter(session => session.end_time)
      .map(session => {
        const task = tasks.find(t => t.id === session.task_id);
        return {
          id: `session-${session.id || Math.random().toString()}`,
          type: 'time_tracked',
          title: task?.title || 'Unknown task',
          timestamp: session.end_time ? new Date(session.end_time) : new Date(),
          duration: session.duration,
          taskId: session.task_id
        };
      })
  ]
  .sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  })
  .slice(0, 5);
  
  return (
    <Widget 
      title="Recent Activity" 
      icon={<Activity className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map(activity => (
            <div key={activity.id} className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {activity.type === 'task_completed' ? (
                  <div className="p-1 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="p-1 bg-blue-100 rounded-full">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.type === 'task_completed' ? 'Completed ' : 'Time tracked '}
                  {formatDistanceToNow(
                    activity.timestamp instanceof Date ? 
                    activity.timestamp : 
                    new Date(activity.timestamp)
                  )} ago
                  {activity.duration && ` (${Math.floor(activity.duration / 60)} min)`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-6">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </Widget>
  );
}

// src/components/widgets/PrioritiesWidget.tsx
import React from 'react';
import { Star, Play, CheckCircle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useTimeStore } from '../../store/timeStore';
import Widget from './Widget';

export default function PrioritiesWidget() {
  const tasks = useTaskStore(state => state.tasks);
  const { startTracking, isTracking, activeTaskId } = useTimeStore();
  
  // Get high priority tasks
  const priorityTasks = tasks
    .filter(task => 
      task.priority === 'high' && 
      task.status !== 'completed'
    )
    .slice(0, 3);
  
  const handleStartTracking = (taskId: string) => {
    if (!isTracking) {
      startTracking(taskId);
    }
  };
  
  return (
    <Widget 
      title="Top Priorities" 
      icon={<Star className="w-5 h-5" />}
    >
      <div className="space-y-3">
        {priorityTasks.length > 0 ? (
          priorityTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <div className="flex items-center mt-1">
                  {task.dueDate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {Array.isArray(task.category) && task.category.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {task.category[0]}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                {task.id === activeTaskId ? (
                  <button
                    disabled
                    className="p-2 bg-green-100 text-green-600 rounded-full"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartTracking(task.id)}
                    disabled={isTracking}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-full disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-6">
            <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No high priority tasks</p>
          </div>
        )}
      </div>
    </Widget>
  );
}

// src/components/Dashboard.tsx (Updated version)
import React, { useState } from 'react';
import { BarChart, Clock, Target, Calendar, ListTodo } from 'lucide-react';
import TaskStatsWidget from './widgets/TaskStatsWidget';
import CategoryBreakdownWidget from './widgets/CategoryBreakdownWidget';
import TimeAnalyticsWidget from './widgets/TimeAnalyticsWidget';
import RecentActivityWidget from './widgets/RecentActivityWidget';
import PrioritiesWidget from './widgets/PrioritiesWidget';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaskStatsWidget />
        <CategoryBreakdownWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TimeAnalyticsWidget />
        </div>
        <RecentActivityWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PrioritiesWidget />
        <div className="md:col-span-2">
          {/* Additional widget could go here */}
        </div>
      </div>
    </div>
  );
}