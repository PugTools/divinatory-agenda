-- Create rate_limits table for tracking request counts
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on key for fast lookups
CREATE UNIQUE INDEX idx_rate_limits_key ON public.rate_limits(key);

-- Create index on window_start for cleanup
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to manage rate limits (using service role)
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Try to get existing record
  SELECT * INTO v_record FROM rate_limits WHERE key = p_key FOR UPDATE;
  
  IF v_record IS NULL THEN
    -- No record, create new one
    INSERT INTO rate_limits (key, requests, window_start)
    VALUES (p_key, 1, now());
    RETURN TRUE;
  ELSIF v_record.window_start < v_window_start THEN
    -- Window expired, reset counter
    UPDATE rate_limits 
    SET requests = 1, window_start = now()
    WHERE key = p_key;
    RETURN TRUE;
  ELSIF v_record.requests >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN FALSE;
  ELSE
    -- Increment counter
    UPDATE rate_limits 
    SET requests = requests + 1
    WHERE key = p_key;
    RETURN TRUE;
  END IF;
END;
$$;

-- Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;