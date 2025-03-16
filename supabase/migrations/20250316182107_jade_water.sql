/*
  # Add time tracking and soft delete capabilities

  1. Changes
    - Add time_sessions table for persistent time tracking
    - Add deleted_at column to tasks table for soft delete
    - Add time tracking columns to subtasks

  2. Security
    - Enable RLS on time_sessions table
    - Add policies for authenticated users
*/

-- Create time_sessions table
CREATE TABLE time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration integer DEFAULT 0, -- in seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add soft delete to tasks
ALTER TABLE tasks 
  ADD COLUMN deleted_at timestamptz;

-- Add time tracking to subtasks
ALTER TABLE subtasks
  ADD COLUMN time_spent integer DEFAULT 0,
  ADD COLUMN due_date timestamptz;

-- Enable RLS
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for time_sessions
CREATE POLICY "Users can manage their time sessions"
  ON time_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for soft deletes
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_time_sessions_task_id ON time_sessions(task_id);