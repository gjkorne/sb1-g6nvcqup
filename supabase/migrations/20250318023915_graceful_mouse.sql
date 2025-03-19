/*
  # Update task titles

  1. Changes
    - Update any tasks with the title "supervising the kids" to be removed
    - Soft delete approach to preserve data integrity
    
  2. Security
    - Maintains existing RLS policies
*/

-- Soft delete any tasks with the specified title
UPDATE tasks 
SET deleted_at = NOW()
WHERE title = 'supervising the kids';

-- Also update any tasks that might have this as part of their title
UPDATE tasks 
SET deleted_at = NOW()
WHERE title ILIKE '%supervising the kids%';