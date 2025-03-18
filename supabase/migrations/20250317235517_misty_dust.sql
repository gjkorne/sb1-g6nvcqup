/*
  # Add task status tracking

  1. Changes
    - Add task_status field to tasks table
    - Add status check constraint
    - Update existing tasks to 'not_started' status
    - Add index for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add task_status field with constraint
ALTER TABLE tasks 
ADD COLUMN task_status text NOT NULL DEFAULT 'not_started';

-- Add constraint to ensure valid status values
ALTER TABLE tasks
ADD CONSTRAINT tasks_task_status_check 
CHECK (task_status IN ('not_started', 'in_progress', 'completed'));

-- Create index for task_status
CREATE INDEX idx_tasks_task_status ON tasks(task_status);

-- Update existing tasks to not_started
UPDATE tasks 
SET task_status = 'not_started' 
WHERE task_status IS NULL;