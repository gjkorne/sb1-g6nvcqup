// src/components/widgets/TimelineWidget.tsx
import React, { useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Play, CheckCircle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useTimeStore } from '../../store/timeStore';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  addDays, 
  subDays, 
  isSameDay, 
  differenceInMinutes,
  parseISO
} from 'date-fns';
import Widget from './Widget';

// Helper function to get color based on category
const getCategoryColor = (category: string | string[] | null | undefined, opacity: number = 1): string => {
  // Handle array of categories by using the first one
  const categoryValue = Array.isArray(category) ? category[0] : category;

  const categoryColors: {[key: string]: string} = {
    'work': `rgba(59, 130, 246, ${opacity})`, // blue
    'personal': `rgba(124, 58, 237, ${opacity})`, // purple
    'learning': `rgba(16, 185, 129, ${opacity})`, // green
    'health': `rgba(239, 68, 68, ${opacity})`, // red
    'meeting': `rgba(245, 158, 11, ${opacity})`, // amber
    'planning': `rgba(99, 102, 241, ${opacity})`, // indigo
    'shopping': `rgba(236, 72, 153, ${opacity})`, // pink
    'social': `rgba(14, 165, 233, ${opacity})`, // sky
    'finance': `rgba(20, 184, 166, ${opacity})`, // teal
    'travel': `rgba(168, 85, 247, ${opacity})`, // violet
  };

  // Handle null, undefined, or empty string cases
  if (!categoryValue) return `rgba(107, 114, 128, ${opacity})`; // Default gray
  
  const key = typeof categoryValue === 'string' ? categoryValue.toLowerCase() : '';
  return categoryColors[key] || `rgba(107, 114, 128, ${opacity})`; // Default gray
};

const HOUR_HEIGHT = 40; // Height per hour in pixels
const START_HOUR = 8; // Start at 8 AM
const END_HOUR = 18; // End at 6 PM
const HOURS_SHOWN = END_HOUR - START_HOUR;

export default function TimelineWidget() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const tasks = useTaskStore(state => state.tasks);
  const { sessions, startTracking, isTracking, activeTaskId, stopTracking } = useTimeStore();
  
  // Date navigation
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());
  
  // Get day boundaries
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  
  // Filter tasks for the selected day
  const dayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
    return isSameDay(dueDate, selectedDate);
  });
  
  // Filter sessions for the selected day
  const daySessions = sessions.filter(session => {
    const sessionDate = typeof session.start_time === 'string' 
      ? parseISO(session.start_time) 
      : session.start_time;
    return isSameDay(sessionDate, selectedDate);
  });
  
  // Group sessions by task
  const sessionsByTask = daySessions.reduce((groups, session) => {
    const taskId = session.task_id;
    if (!groups[taskId]) groups[taskId] = [];
    groups[taskId].push(session);
    return groups;
  }, {} as Record<string, any[]>);
  
  // Generate timeline hours
  const timelineHours = Array.from(
    { length: HOURS_SHOWN + 1 },
    (_, i) => START_HOUR + i
  );
  
  // Calculate position for current time indicator
  const getCurrentTimePosition = () => {
    const now = new Date();
    if (!isSameDay(now, selectedDate)) return -1;
    
    const hourDecimal = now.getHours() + now.getMinutes() / 60;
    if (hourDecimal < START_HOUR || hourDecimal > END_HOUR) return -1;
    
    return (hourDecimal - START_HOUR) * HOUR_HEIGHT;
  };
  
  // Position calculation for tasks
  const getTaskPosition = (task: any) => {
    if (!task.dueDate) return { top: 0, height: 0, visible: false };
    
    const dueDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate;
    const hour = dueDate.getHours() + dueDate.getMinutes() / 60;
    
    if (hour < START_HOUR || hour > END_HOUR) return { top: 0, height: 0, visible: false };
    
    // Calculate position and height
    const top = (hour - START_HOUR) * HOUR_HEIGHT;
    const duration = task.timeEstimate?.value || 60; // Default to 1 hour if no estimate
    const height = (duration / 60) * HOUR_HEIGHT;
    
    return { top, height, visible: true };
  };
  
  // Position calculation for sessions
  const getSessionPosition = (session: any) => {
    const startTime = typeof session.start_time === 'string' 
      ? parseISO(session.start_time) 
      : session.start_time;
      
    const endTime = session.end_time 
      ? (typeof session.end_time === 'string' ? parseISO(session.end_time) : session.end_time)
      : new Date();
    
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Check if session is visible in timeline
    const isStartVisible = startHour >= START_HOUR && startHour <= END_HOUR;
    const isEndVisible = endHour >= START_HOUR && endHour <= END_HOUR;
    const spansThroughView = startHour < START_HOUR && endHour > START_HOUR;
    
    if (!isStartVisible && !isEndVisible && !spansThroughView) {
      return { top: 0, height: 0, visible: false };
    }
    
    // Calculate position
    const top = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT);
    
    // Calculate height
    const visibleEndHour = Math.min(endHour, END_HOUR);
    const visibleStartHour = Math.max(startHour, START_HOUR);
    const visibleDuration = visibleEndHour - visibleStartHour;
    const height = Math.max(visibleDuration * HOUR_HEIGHT, 16); // Minimum height for visibility
    
    return { top, height, visible: true };
  };
  
  return (
    <Widget 
      title="Timeline" 
      icon={<CalendarClock className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Date navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            {!isSameDay(selectedDate, new Date()) && (
              <button
                onClick={goToToday}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Today
              </button>
            )}
          </div>
          
          <button
            onClick={goToNextDay}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Timeline */}
        <div className="relative border rounded-lg overflow-hidden" style={{ height: HOURS_SHOWN * HOUR_HEIGHT + 'px' }}>
          {/* Hour markers */}
          {timelineHours.map(hour => (
            <div
              key={hour}
              className="absolute w-full border-t border-gray-100 flex items-center"
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + 'px' }}
            >
              <span className="text-xs text-gray-500 px-2">
                {hour}:00
              </span>
            </div>
          ))}
          
          {/* Current time indicator */}
          {getCurrentTimePosition() > 0 && (
            <div
              className="absolute left-0 right-0 border-t border-red-500 z-10"
              style={{ top: getCurrentTimePosition() + 'px' }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
              <div className="absolute -top-1 -right-1 text-xs text-red-500 font-medium">
                {format(new Date(), 'HH:mm')}
              </div>
            </div>
          )}
          
          {/* Tasks */}
          {dayTasks.map(task => {
            const position = getTaskPosition(task);
            if (!position.visible) return null;
            
            // Determine color based on task category
            const category = Array.isArray(task.category) ? task.category[0] : task.category;
            const bgColor = getCategoryColor(category, 0.1);
            const borderColor = getCategoryColor(category, 1);
            
            return (
              <div
                key={`task-${task.id}`}
                className="absolute left-16 right-4 rounded-md border-l-4 z-20 px-2 py-1 hover:opacity-80 transition-opacity"
                style={{
                  top: position.top + 'px',
                  height: position.height + 'px',
                  borderLeftColor: borderColor,
                  backgroundColor: bgColor
                }}
              >
                <div className="flex items-center justify-between h-full overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: borderColor }}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {task.timeEstimate?.value 
                        ? `${task.timeEstimate.value} ${task.timeEstimate.unit}` 
                        : ''}
                    </p>
                  </div>
                  
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <button
                      onClick={() => activeTaskId === task.id ? stopTracking() : startTracking(task.id)}
                      disabled={isTracking && activeTaskId !== task.id}
                      className="p-1 rounded-full flex-shrink-0"
                      style={{ 
                        color: activeTaskId === task.id ? '#ef4444' : '#3b82f6',
                        opacity: isTracking && activeTaskId !== task.id ? 0.5 : 1 
                      }}
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Time tracking sessions */}
          {Object.entries(sessionsByTask).map(([taskId, taskSessions]) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return null;
            
            return taskSessions.map((session, index) => {
              const position = getSessionPosition(session);
              if (!position.visible) return null;
              
              return (
                <div
                  key={`session-${session.id || index}`}
                  className="absolute left-4 w-8 bg-green-200 border border-green-300 rounded-sm z-10"
                  style={{
                    top: position.top + 'px',
                    height: position.height + 'px'
                  }}
                  title={`${task.title}: ${session.duration / 60} min`}
                >
                  <div 
                    className="h-full w-1 absolute left-0 top-0 bottom-0"
                    style={{ 
                      backgroundColor: getCategoryColor(task.category, 1)
                    }}
                  />
                </div>
              );
            });
          })}
          
          {/* Empty state */}
          {dayTasks.length === 0 && Object.keys(sessionsByTask).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <CalendarClock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No tasks or time sessions for this day</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Widget>
  );
}