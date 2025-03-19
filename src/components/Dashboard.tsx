import React, { useMemo, useState } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';
import { BarChart, Clock, CheckCircle, AlertCircle, Calendar, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import ResponsiveGridLayout, { GridItem } from './common/ResponsiveGridLayout';

export default function Dashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const getTaskTime = useTimeStore((state) => state.getTaskTime);
  const [isEditing, setIsEditing] = useState(false);

  // Helper function to safely format dates
  const formatDate = (date: Date | string | undefined, formatStr: string): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      return format(dateObj, formatStr);
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const upcomingTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) > new Date()).length;
  const overdueTasks = tasks.filter(task => 
    task.dueDate && 
    (typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate) < new Date() && 
    task.status !== 'completed'
  ).length;

  // Calculate total time tracked this week
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const thisWeeksTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    const taskDate = typeof task.createdAt === 'string' ? new Date(task.createdAt) : task.createdAt;
    if (isNaN(taskDate.getTime())) return false;
    return taskDate && taskDate >= weekStart && taskDate <= weekEnd;
  });

  const totalTimeTracked = thisWeeksTasks.reduce((total, task) => {
    return total + getTaskTime(task.id);
  }, 0);

  const hours = Math.floor(totalTimeTracked / 3600);
  const minutes = Math.floor((totalTimeTracked % 3600) / 60);

  // Calculate completion rate
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  // Define grid items
  const gridItems = useMemo<GridItem[]>(() => [
    {
      id: 'stats',
      size: 'full',
      priority: 3,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Tasks Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{totalTasks}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Target className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Completion Rate</span>
                <span className="font-medium text-gray-900">{completionRate}%</span>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Time Tracked Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Time Tracked (This Week)</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {hours}h {minutes}m
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <Clock className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{thisWeeksTasks.length} tasks tracked</span>
                <span>•</span>
                <span>{formatDate(weekStart, 'MMM d')} - {formatDate(weekEnd, 'MMM d')}</span>
              </div>
            </div>
          </div>

          {/* Completed Tasks Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{completedTasks}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <CheckCircle className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">{upcomingTasks} tasks upcoming</span>
              </div>
            </div>
          </div>

          {/* Overdue Tasks Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{overdueTasks}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{Math.round((overdueTasks / totalTasks) * 100)}% of total tasks</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'activity',
      size: 'large',
      priority: 2,
      content: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Activity Overview</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm text-gray-500">Tasks Created</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-500">Tasks Completed</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col gap-1">
                  <div 
                    className="w-full bg-blue-100 rounded-t"
                    style={{ height: `${Math.random() * 100}px` }}
                  />
                  <div 
                    className="w-full bg-green-100 rounded-b"
                    style={{ height: `${Math.random() * 80}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000), 'EEE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'recent',
      size: 'medium',
      priority: 1,
      content: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-sm text-gray-900">{task.title}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(task.createdAt, 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ], [tasks, totalTasks, completionRate, hours, minutes, thisWeeksTasks, weekStart, weekEnd, 
      completedTasks, upcomingTasks, overdueTasks]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded text-sm ${
              isEditing
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Responsive Grid Layout */}
      <ResponsiveGridLayout
        items={gridItems}
        isEditing={isEditing}
        onLayoutChange={(newLayout) => {
          console.log('Layout changed:', newLayout);
        }}
      />
    </div>
  );
}