import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';

interface TimeTrackingLogProps {
  sessions: any[];
  tasks: Task[];
}

export default function TimeTrackingLog({ sessions, tasks }: TimeTrackingLogProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Group sessions by task
  const sessionsByTask = sessions.filter(session => session.task_id)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .reduce((groups, session) => {
    const task = tasks.find(t => t.id === session.task_id);
    if (!task) return groups;

    const existingGroup = groups.find(g => g.taskId === session.task_id);
    if (existingGroup) {
      existingGroup.sessions.push(session);
      existingGroup.totalDuration += session.duration;
    } else {
      groups.push({
        taskId: session.task_id,
        taskTitle: task.title,
        taskCategory: Array.isArray(task.category) ? task.category[0] : task.category,
        sessions: [session],
        totalDuration: session.duration
      });
    }
    return groups;
  }, [] as any[]);

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {sessionsByTask.map(group => (
        <div key={group.taskId} className="border rounded-lg hover:border-gray-300 transition-colors">
          <button
            onClick={() => toggleTask(group.taskId)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-900">{group.taskTitle}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{formatDuration(group.totalDuration)}</span>
                {group.taskCategory && (
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {group.taskCategory}
                  </span>
                )}
              </div>
            </div>
            {expandedTasks.has(group.taskId) ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedTasks.has(group.taskId) && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t px-3 py-2 space-y-2 bg-gray-50">
                  {group.sessions
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                    .map((session: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{format(new Date(session.start_time), 'HH:mm')}</span>
                        <span className="text-gray-400">→</span>
                        <span>
                          {session.end_time
                            ? format(new Date(session.end_time), 'HH:mm')
                            : 'Ongoing'}
                        </span>
                      </div>
                      <span className="text-gray-500">
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {sessionsByTask.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          No time tracking sessions recorded today
        </div>
      )}
    </div>
  );
}