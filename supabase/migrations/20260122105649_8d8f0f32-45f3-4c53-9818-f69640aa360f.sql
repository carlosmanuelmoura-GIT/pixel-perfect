-- Security Fix: Restrict administrator email exposure and confidential data access
-- This migration addresses multiple security vulnerabilities

-- 1. Create a public view for administrators WITHOUT email (for general UI use)
CREATE OR REPLACE VIEW public.administrators_public
WITH (security_invoker = on)
AS SELECT 
  id, 
  name, 
  avatar_url, 
  user_id,
  created_at,
  updated_at
FROM public.administrators;

-- Grant access to the view
GRANT SELECT ON public.administrators_public TO authenticated;

-- 2. Restrict full administrators table access to admin/sec roles only
DROP POLICY IF EXISTS "Authenticated users can view administrators" ON public.administrators;

CREATE POLICY "Admin and SEC can view full administrator details"
  ON public.administrators FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

-- 3. Restrict agenda_points access based on confidentiality
DROP POLICY IF EXISTS "Authenticated users can view agenda_points" ON public.agenda_points;

CREATE POLICY "Users can view non-confidential or authorized agenda points"
  ON public.agenda_points FOR SELECT
  TO authenticated
  USING (
    NOT is_confidential OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'sec')
  );

-- 4. Restrict agenda_point_extra_data based on linked agenda point confidentiality
DROP POLICY IF EXISTS "Authenticated users can view agenda_point_extra_data" ON public.agenda_point_extra_data;

CREATE POLICY "Users can view extra data for non-confidential or authorized points"
  ON public.agenda_point_extra_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agenda_points ap
      WHERE ap.id = agenda_point_id
      AND (
        NOT ap.is_confidential OR
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'sec')
      )
    )
  );

-- 5. Restrict storage access based on agenda point confidentiality
DROP POLICY IF EXISTS "Authenticated users can view agenda point files" ON storage.objects;

CREATE POLICY "Users can access files for non-confidential or authorized agenda points"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'agenda-point-files' AND
    EXISTS (
      SELECT 1 FROM public.agenda_points ap
      WHERE ap.id::text = split_part(name, '/', 1)
      AND (
        NOT ap.is_confidential OR
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'sec')
      )
    )
  );