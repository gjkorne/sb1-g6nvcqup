// Define the Database type for Supabase
export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string[];
          tags: string[];
          status: string;
          due_date: string | null;
          time_spent: number;
          created_at: string;
          updated_at: string;
          user_id: string;
          time_estimate: number | null;
          completed_at: string | null;
          deleted_at: string | null;
          task_status: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category?: string[];
          tags?: string[];
          status: string;
          due_date?: string | null;
          time_spent?: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          time_estimate?: number | null;
          completed_at?: string | null;
          deleted_at?: string | null;
          task_status?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string[];
          tags?: string[];
          status?: string;
          due_date?: string | null;
          time_spent?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          time_estimate?: number | null;
          completed_at?: string | null;
          deleted_at?: string | null;
          task_status?: string;
        };
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          description: string;
          completed: boolean;
          created_at: string;
          updated_at: string;
          time_estimate: number | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          description: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
          time_estimate?: number | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          description?: string;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
          time_estimate?: number | null;
        };
      };
    };
  };
};