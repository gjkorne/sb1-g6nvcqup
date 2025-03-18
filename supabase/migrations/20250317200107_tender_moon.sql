/*
  # Enhance time tracking capabilities

  1. Changes
    - Add time_zone column to time_sessions for accurate timezone tracking
    - Add session_type column to support different types of time tracking (manual, pomodoro, etc.)
    - Add notes column for session annotations
    - Add indexes for common time-based queries

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to time_sessions
ALTER TABLE time_sessions
  ADD COLUMN time_zone text,
  ADD COLUMN session_type text DEFAULT 'manual',
  ADD COLUMN notes text;

-- Create index for time-based queries
CREATE INDEX idx_time_sessions_start_time ON time_sessions(start_time);
CREATE INDEX idx_time_sessions_end_time ON time_sessions(end_time);

-- Add check constraint for session_type
ALTER TABLE time_sessions
  ADD CONSTRAINT time_sessions_session_type_check
  CHECK (session_type IN ('manual', 'pomodoro', 'focus', 'auto'));

-- Add trigger to automatically update duration on end_time change
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_duration
  BEFORE INSERT OR UPDATE ON time_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();