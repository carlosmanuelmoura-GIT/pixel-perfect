-- Add has_followup column to decisions table
ALTER TABLE public.decisions ADD COLUMN has_followup boolean NOT NULL DEFAULT false;

-- Create agenda_point_extra_data table for new tabs (Precedentes, Presenças, Observações)
CREATE TABLE public.agenda_point_extra_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_point_id uuid NOT NULL REFERENCES public.agenda_points(id) ON DELETE CASCADE,
  precedentes text,
  observacoes text,
  presenca_mca boolean DEFAULT false,
  motivo_ausencia_mca text,
  presenca_dcm boolean DEFAULT false,
  motivo_ausencia_dcm text,
  presenca_dep boolean DEFAULT false,
  motivo_ausencia_dep text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(agenda_point_id)
);

-- Enable RLS on agenda_point_extra_data
ALTER TABLE public.agenda_point_extra_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agenda_point_extra_data
CREATE POLICY "Authenticated users can view agenda_point_extra_data" 
ON public.agenda_point_extra_data 
FOR SELECT 
USING (true);

CREATE POLICY "Admin and SEC can insert agenda_point_extra_data" 
ON public.agenda_point_extra_data 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update agenda_point_extra_data" 
ON public.agenda_point_extra_data 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete agenda_point_extra_data" 
ON public.agenda_point_extra_data 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- Create trigger for updated_at on agenda_point_extra_data
CREATE TRIGGER update_agenda_point_extra_data_updated_at
BEFORE UPDATE ON public.agenda_point_extra_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();