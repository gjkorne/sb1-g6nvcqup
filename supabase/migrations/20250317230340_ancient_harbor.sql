/*
  # Add task ordering support

  1. Changes
    - Add task_order column to tasks table
    - Add next_tasks table for prioritized tasks
    - Add indexes for efficient ordering queries

  2. Security
    - Enable RLS on next_tasks table
    - Add policies for authenticated users
*/

-- Add order column to tasks
ALTER TABLE tasks
  ADD COLUMN display_order integer;

-- Create next_tasks table for priority tasks
CREATE TABLE next_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, task_id)
);

-- Create indexes
CREATE INDEX idx_tasks_display_order ON tasks(display_order);
CREATE INDEX idx_next_tasks_display_order ON next_tasks(display_order);

-- Enable RLS
ALTER TABLE next_tasks ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their next tasks"
  ON next_tasks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());