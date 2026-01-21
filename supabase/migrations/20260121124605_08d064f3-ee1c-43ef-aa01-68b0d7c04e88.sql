-- Add columns for creation association
ALTER TABLE public.grupos_trabalho
ADD COLUMN criacao_meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL,
ADD COLUMN criacao_agenda_point_id uuid REFERENCES public.agenda_points(id) ON DELETE SET NULL,
ADD COLUMN criacao_decision_id uuid REFERENCES public.decisions(id) ON DELETE SET NULL;

-- Add columns for closure association
ALTER TABLE public.grupos_trabalho
ADD COLUMN fecho_meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL,
ADD COLUMN fecho_agenda_point_id uuid REFERENCES public.agenda_points(id) ON DELETE SET NULL,
ADD COLUMN fecho_decision_id uuid REFERENCES public.decisions(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_grupos_trabalho_criacao_meeting ON public.grupos_trabalho(criacao_meeting_id);
CREATE INDEX idx_grupos_trabalho_criacao_agenda_point ON public.grupos_trabalho(criacao_agenda_point_id);
CREATE INDEX idx_grupos_trabalho_criacao_decision ON public.grupos_trabalho(criacao_decision_id);
CREATE INDEX idx_grupos_trabalho_fecho_meeting ON public.grupos_trabalho(fecho_meeting_id);
CREATE INDEX idx_grupos_trabalho_fecho_agenda_point ON public.grupos_trabalho(fecho_agenda_point_id);
CREATE INDEX idx_grupos_trabalho_fecho_decision ON public.grupos_trabalho(fecho_decision_id);