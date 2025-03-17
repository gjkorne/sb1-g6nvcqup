/*
  # Add time estimates and completion tracking

  1. Changes
    - Add time_estimate column to tasks and subtasks tables
    - Add completed_at timestamp to tasks table
    - Add indexes for time estimates and completed_at
    - Update existing completed tasks

  2. Data Migration
    - Set completed_at for existing completed tasks
*/

-- Add time estimate columns
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS time_estimate integer,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add time estimate to subtasks
ALTER TABLE subtasks
  ADD COLUMN IF NOT EXISTS time_estimate integer;

-- Create indexes for time estimates to optimize queries
CREATE INDEX IF NOT EXISTS idx_tasks_time_estimate ON tasks(time_estimate);
CREATE INDEX IF NOT EXISTS idx_subtasks_time_estimate ON subtasks(time_estimate);

-- Create index for completed_at
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Update the completed_at field for already completed tasks
UPDATE tasks
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;