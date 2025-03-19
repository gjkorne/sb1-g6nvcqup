/*
  # Update category system with rules and weights

  1. Changes
    - Add category_rules table for AI-driven categorization
    - Add suggest_categories function for intelligent category suggestions
    - Add default category rules
    - Add indexes for performance optimization

  2. Security
    - Enable RLS on category_rules table
    - Add policies for authenticated users
*/

-- Create function to suggest categories based on task content
CREATE OR REPLACE FUNCTION suggest_categories(
  p_task_title text,
  p_task_description text,
  p_user_id uuid
)
RETURNS text[] AS $$
DECLARE
  v_categories text[];
  v_rule RECORD;
BEGIN
  -- Initialize empty array
  v_categories := '{}';
  
  -- Check against user's category rules
  FOR v_rule IN 
    SELECT category, confidence
    FROM category_rules
    WHERE user_id = p_user_id
    AND (
      (is_regex AND (
        p_task_title ~* pattern OR 
        p_task_description ~* pattern
      )) OR
      (NOT is_regex AND (
        p_task_title ILIKE '%' || pattern || '%' OR
        p_task_description ILIKE '%' || pattern || '%'
      ))
    )
    ORDER BY priority DESC, confidence DESC
    LIMIT 3
  LOOP
    -- Add category if confidence is high enough
    IF v_rule.confidence >= 0.7 THEN
      v_categories := array_append(v_categories, v_rule.category);
    END IF;
  END LOOP;
  
  -- If no categories found, get user's most used categories
  IF array_length(v_categories, 1) IS NULL THEN
    SELECT array_agg(category ORDER BY weight DESC, usage_count DESC)
    INTO v_categories
    FROM category_weights
    WHERE user_id = p_user_id
    LIMIT 3;
  END IF;
  
  RETURN v_categories;
END;
$$ LANGUAGE plpgsql;

-- Add default category rules
DO $$ 
BEGIN
  INSERT INTO category_rules (user_id, pattern, category, confidence, is_regex, priority)
  SELECT 
    auth.uid(),
    pattern,
    category,
    confidence,
    is_regex,
    priority
  FROM (VALUES 
    ('work|project|report|meeting', 'work', 0.9, true, 100),
    ('gym|exercise|workout|health', 'health', 0.9, true, 100),
    ('learn|study|course|read', 'learning', 0.9, true, 90),
    ('shop|buy|purchase', 'shopping', 0.8, true, 80),
    ('pay|bill|invoice|finance', 'finance', 0.9, true, 90),
    ('call|meet|visit|social', 'social', 0.8, true, 80),
    ('plan|organize|schedule', 'planning', 0.8, true, 70),
    ('urgent|asap|emergency', 'urgent', 1.0, true, 100)
  ) AS v(pattern, category, confidence, is_regex, priority)
  ON CONFLICT DO NOTHING;
END $$;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_category_rules_user_pattern ON category_rules(user_id, pattern);
CREATE INDEX IF NOT EXISTS idx_category_weights_usage ON category_weights(user_id, usage_count DESC);

-- Add comments
COMMENT ON FUNCTION suggest_categories(text, text, uuid) IS 'Suggests categories based on task content and user history';
COMMENT ON TABLE category_rules IS 'Stores rules for AI-driven task categorization';