/*
  # Enhance Task Categories System

  1. Changes
    - Add category_weights table for dynamic category prioritization
    - Add category_rules table for AI-driven categorization
    - Add functions for intelligent category management
    - Add indexes for performance optimization

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create category_weights table for dynamic prioritization
CREATE TABLE category_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  category text NOT NULL,
  weight float NOT NULL DEFAULT 1.0,
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Create category_rules table for AI-driven categorization
CREATE TABLE category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  pattern text NOT NULL,
  category text NOT NULL,
  confidence float DEFAULT 1.0,
  is_regex boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to update category weights based on usage
CREATE OR REPLACE FUNCTION update_category_weight()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert category weight
  INSERT INTO category_weights (user_id, category, weight, usage_count, last_used)
  VALUES (
    NEW.user_id,
    NEW.category[1], -- Take primary category
    1.0,
    1,
    now()
  )
  ON CONFLICT (user_id, category)
  DO UPDATE SET
    weight = category_weights.weight * 1.1, -- Increase weight by 10%
    usage_count = category_weights.usage_count + 1,
    last_used = now(),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category weight updates
CREATE TRIGGER update_category_weights_trigger
  AFTER INSERT OR UPDATE OF category
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_category_weight();

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

-- Enable RLS
ALTER TABLE category_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their category weights"
  ON category_weights
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their category rules"
  ON category_rules
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX idx_category_weights_user_category ON category_weights(user_id, category);
CREATE INDEX idx_category_rules_user_pattern ON category_rules(user_id, pattern);
CREATE INDEX idx_category_weights_usage ON category_weights(user_id, usage_count DESC);

-- Add default categories
INSERT INTO category_rules (user_id, pattern, category, confidence, is_regex, priority) VALUES
  (auth.uid(), 'work|project|report|meeting', 'work', 0.9, true, 100),
  (auth.uid(), 'gym|exercise|workout|health', 'health', 0.9, true, 100),
  (auth.uid(), 'learn|study|course|read', 'learning', 0.9, true, 90),
  (auth.uid(), 'shop|buy|purchase', 'shopping', 0.8, true, 80),
  (auth.uid(), 'pay|bill|invoice|finance', 'finance', 0.9, true, 90),
  (auth.uid(), 'call|meet|visit|social', 'social', 0.8, true, 80),
  (auth.uid(), 'plan|organize|schedule', 'planning', 0.8, true, 70),
  (auth.uid(), 'urgent|asap|emergency', 'urgent', 1.0, true, 100);

COMMENT ON TABLE category_weights IS 'Stores user-specific category weights for dynamic prioritization';
COMMENT ON TABLE category_rules IS 'Stores rules for AI-driven task categorization';
COMMENT ON FUNCTION update_category_weight() IS 'Updates category weights based on usage';
COMMENT ON FUNCTION suggest_categories(text, text, uuid) IS 'Suggests categories based on task content and user history';