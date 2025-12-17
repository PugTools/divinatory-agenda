-- Add client_email column to appointments table for email reminders
ALTER TABLE public.appointments ADD COLUMN client_email text;