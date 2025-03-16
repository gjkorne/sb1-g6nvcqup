/*
  # Update tasks table to support multiple categories

  1. Changes
    - Modify `category` column to be a text array instead of a single text value
    - Update existing rows to convert single category to array
    - Add default empty array for new rows

  2. Data Migration
    - Preserve existing categories by converting them to arrays
*/

DO $$ 
BEGIN
  -- First create a temporary column
  ALTER TABLE tasks ADD COLUMN categories text[] DEFAULT '{}';
  
  -- Copy existing category into the new array column
  UPDATE tasks SET categories = ARRAY[category] WHERE category IS NOT NULL;
  
  -- Drop the old column
  ALTER TABLE tasks DROP COLUMN category;
  
  -- Rename the new column to category
  ALTER TABLE tasks RENAME COLUMN categories TO category;
  
  -- Set the default value
  ALTER TABLE tasks ALTER COLUMN category SET DEFAULT '{}';
END $$;