/*
  # Enhance tasks table with new features

  1. New Tables
    - `task_dependencies`: Join table for task dependencies
      - `dependent_task_id` (uuid): The task that depends on another
      - `dependency_task_id` (uuid): The task that must be completed first

  2. Changes to Tasks Table
    - Add priority field (low, medium, high)
    - Add recurrence support (jsonb for flexibility)
    - Add progress tracking (0-100)
    - Add indexes for common queries

  3. Security
    - Enable RLS on new task_dependencies table
    - Maintain existing security policies
*/

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN priority text DEFAULT 'medium',
  ADD COLUMN recurrence jsonb,
  ADD COLUMN progress integer DEFAULT 0;

-- Add check constraint for priority values
ALTER TABLE tasks
  ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('low', 'medium', 'high'));

-- Add check constraint for progress range
ALTER TABLE tasks
  ADD CONSTRAINT tasks_progress_check
  CHECK (progress >= 0 AND progress <= 100);

-- Create indexes for common queries
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
CREATE INDEX idx_tasks_priority ON tasks (priority);
CREATE INDEX idx_tasks_status ON tasks (status);

-- Create task dependencies table
CREATE TABLE task_dependencies (
  dependent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (dependent_task_id, dependency_task_id)
);

-- Enable RLS on task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for task_dependencies
CREATE POLICY "Users can manage dependencies for their tasks"
  ON task_dependencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_dependencies.dependent_task_id
      AND tasks.user_id = auth.uid()
    )
  );