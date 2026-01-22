-- Add reference_id column to meetings table
ALTER TABLE public.meetings 
ADD COLUMN reference_id text;