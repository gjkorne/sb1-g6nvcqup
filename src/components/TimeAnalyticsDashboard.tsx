import React from 'react';
import { useTimeStore } from '../store/timeStore';
import { useTaskStore } from '../store/taskStore';
import { BarChart, Clock, Target, Award } from 'lucide-react';
import { formatDurationDetailed } from '../utils/timeTrackingUtils';

export default function TimeAnalyticsDashboard() {
  const tasks = useTaskStore(state => state.tasks);
  const { sessions, getTaskTime } = useTimeStore();

  // Calculate total time tracked
  const totalTimeTracked = sessions.reduce((total, session) => {
    return total + session.duration;
  }, 0);

  // Calculate average session length
  const averageSessionLength = sessions.length > 0 
    ? totalTimeTracked / sessions.length 
    : 0;

  // Find most productive day
  const dailyTotals = sessions.reduce((totals, session) => {
    const date = new Date(session.start_time).toISOString().split('T')[0];
    totals[date] = (totals[date] || 0) + session.duration;
    return totals;
  }, {} as Record<string, number>);

  const mostProductiveDay = Object.entries(dailyTotals).reduce((max, [date, time]) => {
    return time > (max.time || 0) ? { date, time } : max;
  }, { date: '', time: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Time Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Time Tracked */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Time Tracked</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDurationDetailed(totalTimeTracked)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Average Session Length */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Session</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDurationDetailed(averageSessionLength)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Target className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Most Productive Day</p>
              <p className="text-2xl font-semibold text-gray-900">
                {mostProductiveDay.date ? new Date(mostProductiveDay.date).toLocaleDateString() : 'N/A'}
              </p>
              {mostProductiveDay.date && (
                <p className="text-sm text-gray-500">
                  {formatDurationDetailed(mostProductiveDay.time)} tracked
                </p>
              )}
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <Award className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
        <div className="space-y-4">
          {sessions.slice(0, 5).map((session) => {
            const task = tasks.find(t => t.id === session.task_id);
            return (
              <div key={session.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-sm text-gray-900">{task?.title || 'Unknown Task'}</span>
                    <p className="text-xs text-gray-500">
                      {new Date(session.start_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {formatDurationDetailed(session.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}