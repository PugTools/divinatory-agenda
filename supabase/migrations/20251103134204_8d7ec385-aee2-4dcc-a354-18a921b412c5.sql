-- Allow public access to view priest config for active priests
CREATE POLICY "Public can view active priest config"
ON public.priest_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = priest_config.priest_id
    AND profiles.is_active = true
  )
);