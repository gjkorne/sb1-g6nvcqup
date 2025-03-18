import React from 'react';
import { Task } from '../types';
import { Check, Clock, Star } from 'lucide-react';
import TimeTracker from './TimeTracker';
import { format } from 'date-fns';
import { useTaskStore } from '../store/taskStore';

interface TaskCardProps {
  task: Task;
  isCompactView: boolean;
  isPriority: boolean;
  onTogglePriority: () => void;
}

export default function TaskCard({ task, isCompactView, isPriority, onTogglePriority }: TaskCardProps) {
  const completeTask = useTaskStore((state) => state.completeTask);

  // Add drag handle styles
  const dragHandleStyles = "cursor-move hover:bg-gray-50 rounded p-1";

  return (
    <div className={`group relative ${task.status === 'completed' ? 'opacity-75' : ''}`}>
      {/* Priority Star */}
      <button
        onClick={onTogglePriority}
        className={`absolute -left-2 -top-2 p-1 rounded-full transition-colors ${
          isPriority 
            ? 'bg-yellow-100 text-yellow-500' 
            : 'bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
        title={isPriority ? 'Remove from priorities' : 'Add to priorities'}
      >
        <Star className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className={dragHandleStyles}>
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 truncate ${
            task.status === 'completed' ? 'line-through text-gray-500' : ''
          }`}>
            {task.title}
          </h3>
          
          {!isCompactView && task.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <TimeTracker taskId={task.id} isDisabled={task.status === 'completed'} />
            
            {task.dueDate && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-4 h-4" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {!isCompactView && (
            <div className="mt-2 flex flex-wrap gap-2">
              {task.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
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
        </div>
      </div>
    </div>
  );
}