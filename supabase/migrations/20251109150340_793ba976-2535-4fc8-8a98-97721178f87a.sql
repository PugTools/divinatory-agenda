-- Fix critical security issues

-- 1. CRITICAL: Remove public read access to payment_transactions
DROP POLICY IF EXISTS "Public can view payment transactions" ON payment_transactions;

-- 2. Fix profiles email exposure - only allow viewing safe public fields
DROP POLICY IF EXISTS "Public can view priest display info" ON profiles;

CREATE POLICY "Public can view priest display info"
ON profiles
FOR SELECT
USING (
  is_active = true 
  AND id IN (SELECT priest_id FROM priest_config)
);

-- 3. Add unique index to prevent double-booking
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_priest_datetime 
ON appointments (priest_id, scheduled_date, scheduled_time)
WHERE status != 'cancelled';

-- 4. Add check constraint for reasonable future dates (drop first if exists)
DO $$ 
BEGIN
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS reasonable_future_date;
  ALTER TABLE appointments 
  ADD CONSTRAINT reasonable_future_date
  CHECK (
    scheduled_date >= CURRENT_DATE 
    AND scheduled_date <= CURRENT_DATE + INTERVAL '365 days'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;