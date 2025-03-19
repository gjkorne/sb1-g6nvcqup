import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
  throw new Error('Missing Supabase configuration');
}

// Create Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce'
    },
    global: {
      headers: { 'x-application-name': 'task-manager' }
    }
  }
);

// Test connection function
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('tasks').select('*').limit(1);

    if (error) {
      return { 
        success: false, 
        error: error.message,
        retryable: error.code !== 'PGRST301' // Not retryable if auth error
      };
    }

    return {
      success: true,
      timestamp: new Date(),
      count: data.length
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      retryable: true
    };
  }
}