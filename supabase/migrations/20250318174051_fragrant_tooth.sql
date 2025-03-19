/*
  # Add version function and improve error handling

  1. Changes
    - Add version() function for connection testing
    - Add error handling functions
    - Add connection test helpers

  2. Security
    - Enable access for authenticated users
*/

-- Create version function for connection testing
CREATE OR REPLACE FUNCTION version()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT version();
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION version() TO authenticated;

-- Create error handling helper function
CREATE OR REPLACE FUNCTION handle_error(
  p_error text,
  p_context jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN jsonb_build_object(
    'error', p_error,
    'context', p_context,
    'timestamp', now()
  );
END;
$$;

-- Create connection test function
CREATE OR REPLACE FUNCTION test_connection()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN jsonb_build_object(
    'connected', true,
    'version', version(),
    'timestamp', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN handle_error(SQLERRM);
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION test_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_error(text, jsonb) TO authenticated;