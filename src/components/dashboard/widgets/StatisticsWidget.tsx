// src/components/dashboard/widgets/StatisticsWidget.tsx
import React from 'react';
import { BarChart2, Clock, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  subtitle?: string;
  progress?: number;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  iconColor,
  subtitle,
  progress,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: `w-6 h-6 ${iconColor}` 
          })}
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface StatisticsWidgetProps {
  totalTasks: number;
  completedTasks: number;
  upcomingTasks: number;
  overdueTasks: number;
  timeTracked: {
    hours: number;
    minutes: number;
  };
  completionRate: number;
}

const StatisticsWidget: React.FC<StatisticsWidgetProps> = ({
  totalTasks,
  completedTasks,
  upcomingTasks,
  overdueTasks,
  timeTracked,
  completionRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Tasks"
        value={totalTasks}
        icon={<Target />}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-500"
        progress={completionRate}
        delay={0}
      />
      
      <StatCard
        title="Time Tracked"
        value={`${timeTracked.hours}h ${timeTracked.minutes}m`}
        icon={<Clock />}
        iconBgColor="bg-green-50"
        iconColor="text-green-500"
        subtitle={`${upcomingTasks} tasks upcoming`}
        delay={0.1}
      />
      
      <StatCard
        title="Completed Tasks"
        value={completedTasks}
        icon={<CheckCircle />}
        iconBgColor="bg-indigo-50"
        iconColor="text-indigo-500"
        subtitle={`${Math.round((completedTasks / totalTasks) * 100)}% completion rate`}
        delay={0.2}
      />
      
      <StatCard
        title="Overdue Tasks"
        value={overdueTasks}
        icon={<AlertCircle />}
        iconBgColor="bg-red-50"
        iconColor="text-red-500"
        subtitle={`${Math.round((overdueTasks / totalTasks) * 100)}% of total tasks`}
        delay={0.3}
      />
    </div>
  );
};

export default StatisticsWidget;