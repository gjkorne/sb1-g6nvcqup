/*
  # Fix time sessions table column names

  1. Changes
    - Rename start_time to startTime
    - Rename end_time to endTime
    - Add missing columns
    - Drop and recreate table to ensure clean state

  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing table and recreate with correct column names
DROP TABLE IF EXISTS time_sessions;

CREATE TABLE time_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  startTime timestamptz NOT NULL,
  endTime timestamptz,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can manage their time sessions"
  ON time_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Recreate indexes
CREATE INDEX idx_time_sessions_task_id ON time_sessions(task_id);