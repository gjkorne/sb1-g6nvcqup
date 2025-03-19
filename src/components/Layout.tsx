import React, { useCallback } from 'react';
import { Menu, X, Settings, Calendar, Clock, BarChart, LogOut, Sun, Calendar as CalendarIcon, ListTodo, Star, PieChart } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { useTimeStore } from '../store/timeStore';

const TimeAnalyticsDashboard = lazy(() => import('./TimeAnalyticsDashboard'));

interface LayoutProps {
  children: React.ReactNode;
  view?: 'dashboard' | 'today' | 'upcoming' | 'all';
  onViewChange?: (view: 'dashboard' | 'today' | 'upcoming' | 'all') => void;
}

export default function Layout({ children, view = 'all', onViewChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      
      // Clear all application state
      useTaskStore.setState({ tasks: [], activeTask: null });
      useTimeStore.setState({ sessions: [], currentSession: null });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force a full page reload to clear all state
      window.location.reload();
      
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
      alert('Failed to sign out. Please try again.');
    }
  }, []);

  const navigationItems = [
    { icon: BarChart, label: 'Dashboard', value: 'dashboard' },
    { icon: Sun, label: 'Today', value: 'today' },
    { icon: CalendarIcon, label: 'Upcoming', value: 'upcoming' },
    { icon: ListTodo, label: 'All Tasks', value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white shadow-lg transition-transform duration-200 ease-in-out z-20`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-800">Menu</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <nav className="space-y-2">
            <div className="pb-4 border-b">
              <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Views
              </p>
              {navigationItems.map(({ icon: Icon, label, value }) => (
                <button
                  key={value}
                  onClick={() => {
                    onViewChange?.(value as 'dashboard' | 'today' | 'upcoming' | 'all');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    view === value
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  } rounded-lg transition-colors`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="pt-4">
              <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Features
              </p>
              <button
                onClick={() => setShowAnalytics(true)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <PieChart className="w-5 h-5 mr-3" />
                <span>Time Analytics</span>
              </button>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Settings</span>
              </button>
            </div>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-blue-600">{format(new Date(), 'MMM d, yyyy')}</span>
              </div>
              <p className="text-sm text-blue-800 font-medium">Daily Progress</p>
              <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }} />
              </div>
              <p className="mt-1 text-xs text-blue-600">6/10 tasks completed</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`flex items-center gap-2 mt-4 p-2 w-full ${
                isSigningOut 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogOut className={`w-5 h-5 ${isSigningOut ? 'animate-spin' : ''}`} />
              <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile navigation */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t">
        <nav className="flex justify-around py-2">
          {navigationItems.map(({ icon: Icon, label, value }) => (
            <button
              key={value}
              onClick={() => onViewChange?.(value as 'today' | 'upcoming' | 'all')}
              className={`flex flex-col items-center p-2 ${
                view === value ? 'text-blue-600' : 'text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs mt-1">{label}</span>
            </button>
          ))}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center p-2 text-gray-600"
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs mt-1">Menu</span>
          </button>
        </nav>
      </div>
      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col min-h-screen pb-16 lg:pb-0 lg:pl-64">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-gray-900">AI Task Manager</h1>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
          {children}
          {showAnalytics && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-xl font-semibold">Time Analytics</h2>
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                  }>
                    <TimeAnalyticsDashboard />
                  </Suspense>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}