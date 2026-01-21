-- Create storage bucket for agenda point files (Ficha)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agenda-point-files', 'agenda-point-files', false);

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view agenda point files"
ON storage.objects FOR SELECT
USING (bucket_id = 'agenda-point-files' AND auth.role() = 'authenticated');

-- Allow admin and sec to upload files
CREATE POLICY "Admin and SEC can upload agenda point files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agenda-point-files' AND (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'sec')
));

-- Allow admin and sec to update files
CREATE POLICY "Admin and SEC can update agenda point files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agenda-point-files' AND (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'sec')
));

-- Allow admin and sec to delete files
CREATE POLICY "Admin and SEC can delete agenda point files"
ON storage.objects FOR DELETE
USING (bucket_id = 'agenda-point-files' AND (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'sec')
));

-- Add file_url column to agenda_point_extra_data to store the file path
ALTER TABLE public.agenda_point_extra_data 
ADD COLUMN IF NOT EXISTS ficha_file_path TEXT;