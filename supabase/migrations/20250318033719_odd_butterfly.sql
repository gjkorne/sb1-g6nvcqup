/*
  # Fix category rules policy

  1. Changes
    - Remove duplicate policy creation
    - Add missing default category rules
    - Add missing indexes
    - Add missing comments

  2. Security
    - Maintain existing RLS policies
*/

-- Add default category rules
INSERT INTO category_rules (user_id, pattern, category, confidence, is_regex, priority) VALUES
  (auth.uid(), 'work|project|report|meeting', 'work', 0.9, true, 100),
  (auth.uid(), 'gym|exercise|workout|health', 'health', 0.9, true, 100),
  (auth.uid(), 'learn|study|course|read', 'learning', 0.9, true, 90),
  (auth.uid(), 'shop|buy|purchase', 'shopping', 0.8, true, 80),
  (auth.uid(), 'pay|bill|invoice|finance', 'finance', 0.9, true, 90),
  (auth.uid(), 'call|meet|visit|social', 'social', 0.8, true, 80),
  (auth.uid(), 'plan|organize|schedule', 'planning', 0.8, true, 70),
  (auth.uid(), 'urgent|asap|emergency', 'urgent', 1.0, true, 100);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_category_rules_user_pattern ON category_rules(user_id, pattern);

-- Add comments
COMMENT ON TABLE category_rules IS 'Stores rules for AI-driven task categorization';
COMMENT ON FUNCTION suggest_categories(text, text, uuid) IS 'Suggests categories based on task content and user history';