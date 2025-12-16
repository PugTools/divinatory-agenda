-- Fix priest_config RLS policy - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Public can view active priest config" ON public.priest_config;

CREATE POLICY "Public can view active priest config" 
ON public.priest_config 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = priest_config.priest_id 
  AND profiles.is_active = true
));

-- Also fix game_types RLS policy
DROP POLICY IF EXISTS "Public can view active game types" ON public.game_types;

CREATE POLICY "Public can view active game types" 
ON public.game_types 
FOR SELECT 
USING (active = true);