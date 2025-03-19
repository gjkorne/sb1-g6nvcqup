/*
  # Fix task schema and add missing fields

  1. Changes
    - Add missing fields to tasks table
    - Update constraints and defaults
    - Add indexes for performance
    - Fix category array handling

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing fields and fix defaults
ALTER TABLE tasks
  ALTER COLUMN category SET DEFAULT '{}',
  ALTER COLUMN tags SET DEFAULT '{}',
  ALTER COLUMN status SET DEFAULT 'todo',
  ALTER COLUMN time_spent SET DEFAULT 0,
  ALTER COLUMN progress SET DEFAULT 0;

-- Add check constraint for status
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('todo', 'in_progress', 'completed'));

-- Add check constraint for task_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'tasks_task_status_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_task_status_check 
      CHECK (task_status IN ('not_started', 'in_progress', 'completed'));
  END IF;
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks USING gin(category);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_task_status ON tasks(task_status);

-- Add function to validate task data
CREATE OR REPLACE FUNCTION validate_task()
RETURNS trigger AS $$
BEGIN
  -- Ensure arrays are not null
  NEW.category := COALESCE(NEW.category, '{}');
  NEW.tags := COALESCE(NEW.tags, '{}');
  
  -- Set default status if null
  NEW.status := COALESCE(NEW.status, 'todo');
  NEW.task_status := COALESCE(NEW.task_status, 'not_started');
  
  -- Set default timestamps
  NEW.created_at := COALESCE(NEW.created_at, now());
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task validation
DROP TRIGGER IF EXISTS validate_task_trigger ON tasks;
CREATE TRIGGER validate_task_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION validate_task();