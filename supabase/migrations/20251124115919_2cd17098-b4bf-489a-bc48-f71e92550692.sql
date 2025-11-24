-- Fix infinite recursion in RLS policies
-- The issue: profiles policy checks priest_config, and priest_config policy checks profiles
-- This creates an infinite loop

-- Drop the problematic policy on profiles
DROP POLICY IF EXISTS "Public can view priest display info" ON public.profiles;

-- Create a simpler policy that doesn't depend on priest_config
-- Public can view active priests' basic info
CREATE POLICY "Public can view active priests"
ON public.profiles
FOR SELECT
USING (is_active = true);

-- The priest_config policy that checks profiles.is_active is fine
-- It won't cause recursion now that profiles doesn't check priest_config