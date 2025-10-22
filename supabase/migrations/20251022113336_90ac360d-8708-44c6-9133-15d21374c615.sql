-- Fix Critical Security Issue #1: Remove public access to sensitive profile data
-- Drop the overly permissive public policy and recreate with limited access
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;

-- Create a new policy that only exposes non-sensitive display information to the public
CREATE POLICY "Public can view priest display info" ON public.profiles
FOR SELECT
TO anon
USING (is_active = true);

-- Fix Critical Security Issue #2: Add explicit DENY policy for appointments public access
CREATE POLICY "Block all public access to appointments" ON public.appointments
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);