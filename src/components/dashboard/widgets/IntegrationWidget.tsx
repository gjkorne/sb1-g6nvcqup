// src/components/dashboard/widgets/IntegrationWidget.tsx
import React, { useState, useEffect } from 'react';
import { Box, RefreshCw, CheckCircle, AlertCircle, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Types for integration services
type IntegrationService = 'salesforce' | 'monday' | 'notion' | 'evernote';

interface IntegrationStatus {
  service: IntegrationService;
  connected: boolean;
  lastSync: Date | null;
  itemCount: number;
  error: string | null;
}

interface IntegrationTask {
  id: string;
  title: string;
  source: IntegrationService;
  dueDate?: Date;
  url?: string;
  completed: boolean;
}

// Mock integration data - this would be replaced with actual API calls
const mockIntegrationStatuses: IntegrationStatus[] = [
  {
    service: 'salesforce',
    connected: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    itemCount: 12,
    error: null
  },
  {
    service: 'monday',
    connected: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    itemCount: 8,
    error: null
  },
  {
    service: 'notion',
    connected: false,
    lastSync: null,
    itemCount: 0,
    error: 'Authentication token expired'
  },
  {
    service: 'evernote',
    connected: true,
    lastSync: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    itemCount: 5,
    error: null
  }
];

const mockIntegrationTasks: IntegrationTask[] = [
  {
    id: 'sf-1',
    title: 'Follow up with client about proposal',
    source: 'salesforce',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
    url: 'https://salesforce.com/tasks/123',
    completed: false
  },
  {
    id: 'md-1',
    title: 'Complete project milestone',
    source: 'monday',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8), // 8 hours from now
    url: 'https://monday.com/tasks/456',
    completed: false
  },
  {
    id: 'nt-1',
    title: 'Update meeting notes',
    source: 'notion',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    url: 'https://notion.so/pages/789',
    completed: false
  },
  {
    id: 'ev-1',
    title: 'Review marketing materials',
    source: 'evernote',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48), // 48 hours from now
    url: 'https://evernote.com/notes/101',
    completed: true
  }
];

// Helper functions
const getServiceColor = (service: IntegrationService): string => {
  switch (service) {
    case 'salesforce': return 'text-blue-600 bg-blue-100';
    case 'monday': return 'text-yellow-600 bg-yellow-100';
    case 'notion': return 'text-gray-600 bg-gray-100';
    case 'evernote': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getServiceIcon = (service: IntegrationService) => {
  switch (service) {
    case 'salesforce': return <Box className="w-4 h-4" />;
    case 'monday': return <Box className="w-4 h-4" />;
    case 'notion': return <Box className="w-4 h-4" />;
    case 'evernote': return <Box className="w-4 h-4" />;
    default: return <Box className="w-4 h-4" />;
  }
};

const formatTimeAgo = (date: Date | null): string => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Main component
const IntegrationWidget: React.FC = () => {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>(mockIntegrationStatuses);
  const [tasks, setTasks] = useState<IntegrationTask[]>(mockIntegrationTasks);
  const [activeTab, setActiveTab] = useState<'tasks' | 'status'>('tasks');
  const [syncingService, setSyncingService] = useState<IntegrationService | null>(null);
  
  // Simulate syncing
  const syncIntegration = (service: IntegrationService) => {
    setSyncingService(service);
    
    // Simulate API call delay
    setTimeout(() => {
      setStatuses(prev => 
        prev.map(status => 
          status.service === service 
            ? { ...status, lastSync: new Date(), error: null } 
            : status
        )
      );
      setSyncingService(null);
    }, 2000);
  };
  
  // Simulate adding a task from an integration
  const importTask = (task: IntegrationTask) => {
    // In a real app, this would create a task in the local system
    // For now, just mark it as completed in our local state
    setTasks(prev => 
      prev.map(t => 
        t.id === task.id 
          ? { ...t, completed: true } 
          : t
      )
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-gray-500" />
          Connected Services
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage your tasks from external services
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'tasks' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            External Tasks
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'status' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Connection Status
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'tasks' ? (
          <div className="divide-y">
            {tasks.length > 0 ? (
              tasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${getServiceColor(task.source)}`}>
                          {getServiceIcon(task.source)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                          {task.title}
                        </span>
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-1 ml-7">
                          Due: {format(task.dueDate, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => importTask(task)}
                      disabled={task.completed}
                      className={`px-2 py-1 text-xs rounded ${
                        task.completed 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {task.completed ? 'Imported' : 'Import'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No external tasks found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {statuses.map(status => (
              <div key={status.service} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${getServiceColor(status.service)}`}>
                      {getServiceIcon(status.service)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {status.service}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {status.connected ? (
                          <span className="flex items-center text-xs text-green-600 gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Connected
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-red-600 gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Disconnected
                          </span>
                        )}
                        {status.connected && (
                          <span className="text-xs text-gray-500">
                            Last sync: {formatTimeAgo(status.lastSync)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {status.connected ? (
                      <button
                        onClick={() => syncIntegration(status.service)}
                        disabled={syncingService === status.service}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingService === status.service ? 'animate-spin' : ''}`} />
                      </button>
                    ) : (
                      <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                        Connect
                      </button>
                    )}
                  </div>
                </div>
                {status.error && (
                  <div className="mt-2 ml-10 text-xs text-red-600">
                    Error: {status.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t px-4 py-3 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div>
          {statuses.filter(s => s.connected).length} of {statuses.length} services connected
        </div>
        <button className="text-blue-600 hover:text-blue-800">
          Manage connections
        </button>
      </div>
    </div>
  );
};

export default IntegrationWidget;