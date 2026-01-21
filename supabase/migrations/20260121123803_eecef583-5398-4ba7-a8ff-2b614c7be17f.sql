-- Add columns to link protocols to meetings, agenda points, and decisions
ALTER TABLE public.protocols
ADD COLUMN meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL,
ADD COLUMN agenda_point_id uuid REFERENCES public.agenda_points(id) ON DELETE SET NULL,
ADD COLUMN decision_id uuid REFERENCES public.decisions(id) ON DELETE SET NULL;