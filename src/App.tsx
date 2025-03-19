import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import TodayView from './components/TodayView';
import ActiveTask from './components/ActiveTask';
import Dashboard from './components/Dashboard';
import FocusMode from './components/FocusMode';
import AIAssistant from './components/AIAssistant';
import { useTaskStore } from './store/taskStore';
import { useTimeStore } from './store/timeStore';
import { Bot, AlertCircle } from 'lucide-react';
import { supabase, testConnection } from './lib/supabase'; 
import Auth from './components/Auth';
import { startOfDay, endOfDay, addDays } from 'date-fns';

function App() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const loadSessions = useTimeStore((state) => state.loadSessions);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'today' | 'upcoming' | 'all'>('dashboard');
  const [isSupabaseConfigured] = useState(() => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      setError(null);
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        setError('Please connect to Supabase to continue.');
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        setIsAuthenticated(!!session?.user);
        
        if (session?.user) {
          try {
            await Promise.all([
              loadTasks(),
              loadSessions()
            ]);
            if (mounted) {
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Error loading initial data:', err);
            if (mounted) {
              setError(err instanceof Error ? err.message : 'Failed to load your tasks');
              setIsLoading(false);
            }
          }
        } else {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication error');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth listener if Supabase is initialized
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setIsAuthenticated(!!session?.user);
        setIsLoading(true);
        
        if (session?.user) {
          try {
            await Promise.all([
              loadTasks(),
              loadSessions()
            ]);
          } catch (err) {
            console.error('Error loading data:', err);
            if (mounted) {
              setError('Failed to load your tasks');
            }
          }
        } else {
          // Clear tasks and sessions on sign out
          useTaskStore.setState({ tasks: [], activeTask: null });
          useTimeStore.setState({ sessions: [], currentSession: null });
        }
        
        if (mounted) {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured, loadSessions, loadTasks]);

  const filteredTasks = tasks.filter(task => {
    if (view === 'today') {
      return task.dueDate && 
        task.dueDate >= startOfDay(new Date()) && 
        task.dueDate <= endOfDay(new Date());
    }
    if (view === 'upcoming') {
      return task.dueDate && 
        task.dueDate > endOfDay(new Date()) && 
        task.dueDate <= endOfDay(addDays(new Date(), 7));
    }
    return true;
  });

  if (isLoading) {
    return (
      <Layout view={view} onViewChange={setView}>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"/>
            <div className="absolute top-0 right-0 bottom-0 left-0 rounded-full border-t-4 border-blue-600"/>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading your tasks...</p>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout view={view} onViewChange={setView}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout view={view} onViewChange={setView}>
        <Auth />
      </Layout>
    );
  }

  return (
    <Layout view={view} onViewChange={setView}>
      <ActiveTask />
      <FocusMode />
      <AIAssistant />
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto pb-4 px-4">
          {view === 'dashboard' ? (
            <Dashboard />
          ) : view === 'today' ? (
            <TodayView />
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {view === 'today'
                  ? "You don't have any tasks due today."
                  : view === 'upcoming'
                  ? "You don't have any upcoming tasks for the next week."
                  : "Hi! I'm your AI task assistant. Tell me about your tasks and I'll help organize them."}
              </p>
            </div>
          ) : (
            <TaskList tasks={filteredTasks} />
          )}
        </div>
        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <TaskInput />
            <p className="text-xs text-gray-500 mt-2">
              Try saying: "Write a blog post about AI by next Tuesday" or "Buy groceries tomorrow morning"
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;