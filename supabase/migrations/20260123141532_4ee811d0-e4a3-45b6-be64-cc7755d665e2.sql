-- Create import_history table to track all data imports
CREATE TABLE public.import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rolled_back')),
  errors JSONB DEFAULT '[]'::jsonb,
  imported_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rolled_back_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Admin and SEC can view all import history
CREATE POLICY "Admin and SEC can view import_history"
ON public.import_history
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sec'::app_role)
);

-- Admin and SEC can insert import_history
CREATE POLICY "Admin and SEC can insert import_history"
ON public.import_history
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role))
  AND auth.uid() = user_id
);

-- Admin and SEC can update their own import_history
CREATE POLICY "Admin and SEC can update import_history"
ON public.import_history
FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role))
  AND auth.uid() = user_id
);

-- Admin and SEC can delete import_history
CREATE POLICY "Admin and SEC can delete import_history"
ON public.import_history
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'sec'::app_role)
);