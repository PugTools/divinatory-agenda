-- Add UNIQUE constraint to subdomain column in profiles table
-- Only if subdomain is not null (allows multiple null values)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_subdomain_unique 
ON public.profiles (subdomain) 
WHERE subdomain IS NOT NULL;