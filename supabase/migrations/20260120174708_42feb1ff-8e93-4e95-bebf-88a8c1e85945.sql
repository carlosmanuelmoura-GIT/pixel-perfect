-- Add responsible_name text field to actions table
-- This allows storing the responsible person as free text instead of FK
ALTER TABLE public.actions 
ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- Remove the foreign key constraint on responsible_id since we're moving to free text
-- First drop the existing FK constraint
ALTER TABLE public.actions 
DROP CONSTRAINT IF EXISTS actions_responsible_id_fkey;

-- We can keep responsible_id for backwards compatibility but it's no longer required
COMMENT ON COLUMN public.actions.responsible_name IS 'Free text field for the responsible person name';
COMMENT ON COLUMN public.actions.pelouro_id IS 'Department reference from pelouros table';