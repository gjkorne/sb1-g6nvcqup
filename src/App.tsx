import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import { useTaskStore } from './store/taskStore';
import { Bot } from 'lucide-react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import { startOfDay, endOfDay, addDays } from 'date-fns';

function App() {
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'today' | 'upcoming' | 'all'>('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
      if (session) {
        loadTasks();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        loadTasks();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadTasks]);

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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto pb-4 px-4">
          {filteredTasks.length === 0 && (
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
          )}
          <TaskList tasks={filteredTasks} />
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