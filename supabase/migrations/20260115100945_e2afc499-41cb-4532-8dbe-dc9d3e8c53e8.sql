-- Enums para tipos de dados
CREATE TYPE public.meeting_type AS ENUM ('CA', 'CEAAP', 'RT');
CREATE TYPE public.meeting_status AS ENUM ('Preparação', 'Em Curso', 'Concluída', 'Publicada');
CREATE TYPE public.agenda_point_status AS ENUM ('Proposto', 'Aprovado', 'Em discussão', 'Fechado', 'Acompanhamento', 'Encerrado');
CREATE TYPE public.point_type AS ENUM ('Informação', 'Decisão', 'Discussão');
CREATE TYPE public.priority AS ENUM ('Alta', 'Média', 'Baixa');
CREATE TYPE public.decision_type AS ENUM ('Estratégica', 'Táctica', 'Operacional');
CREATE TYPE public.criticality AS ENUM ('Crítica', 'Importante', 'Rotina');
CREATE TYPE public.vote_mode AS ENUM ('Unanimidade', 'Votação', 'Consenso');
CREATE TYPE public.action_status AS ENUM ('Por iniciar', 'Em curso', 'Concluída', 'Bloqueada', 'Cancelada');

-- Tabela de Pelouros (departamentos/áreas)
CREATE TABLE public.pelouros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Administradores
CREATE TABLE public.administrators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de relação Administrador-Pelouro (muitos para muitos)
CREATE TABLE public.administrator_pelouros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE CASCADE NOT NULL,
  pelouro_id UUID REFERENCES public.pelouros(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (administrator_id, pelouro_id)
);

-- Tabela de Reuniões
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ NOT NULL,
  type meeting_type NOT NULL,
  location TEXT NOT NULL,
  status meeting_status NOT NULL DEFAULT 'Preparação',
  agenda_points_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Participantes (relação muitos para muitos)
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  administrator_id UUID REFERENCES public.administrators(id) ON DELETE CASCADE NOT NULL,
  is_observer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, administrator_id)
);

-- Tabela de Pontos de Agenda
CREATE TABLE public.agenda_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  background TEXT,
  proposer_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL,
  priority priority NOT NULL DEFAULT 'Média',
  point_type point_type NOT NULL DEFAULT 'Discussão',
  status agenda_point_status NOT NULL DEFAULT 'Proposto',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_confidential BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de relação Ponto de Agenda-Pelouro
CREATE TABLE public.agenda_point_pelouros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_point_id UUID REFERENCES public.agenda_points(id) ON DELETE CASCADE NOT NULL,
  pelouro_id UUID REFERENCES public.pelouros(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agenda_point_id, pelouro_id)
);

-- Tabela de Decisões
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_point_id UUID REFERENCES public.agenda_points(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  type decision_type NOT NULL DEFAULT 'Operacional',
  criticality criticality NOT NULL DEFAULT 'Rotina',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  vote_mode vote_mode NOT NULL DEFAULT 'Consenso',
  votes_for INTEGER,
  votes_against INTEGER,
  abstentions INTEGER,
  background TEXT,
  deliberation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Ações
CREATE TABLE public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  responsible_id UUID REFERENCES public.administrators(id) ON DELETE SET NULL,
  pelouro_id UUID REFERENCES public.pelouros(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline TIMESTAMPTZ NOT NULL,
  status action_status NOT NULL DEFAULT 'Por iniciar',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  criticality criticality NOT NULL DEFAULT 'Rotina',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.pelouros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrator_pelouros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_point_pelouros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leitura (todos autenticados podem ler)
CREATE POLICY "Authenticated users can view pelouros" ON public.pelouros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view administrators" ON public.administrators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view administrator_pelouros" ON public.administrator_pelouros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view meeting_participants" ON public.meeting_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view agenda_points" ON public.agenda_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view agenda_point_pelouros" ON public.agenda_point_pelouros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view decisions" ON public.decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view actions" ON public.actions FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (admin e sec podem criar/editar/eliminar)
CREATE POLICY "Admin and SEC can insert pelouros" ON public.pelouros FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update pelouros" ON public.pelouros FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete pelouros" ON public.pelouros FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert administrators" ON public.administrators FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update administrators" ON public.administrators FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete administrators" ON public.administrators FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert administrator_pelouros" ON public.administrator_pelouros FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update administrator_pelouros" ON public.administrator_pelouros FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete administrator_pelouros" ON public.administrator_pelouros FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update meetings" ON public.meetings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete meetings" ON public.meetings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert meeting_participants" ON public.meeting_participants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update meeting_participants" ON public.meeting_participants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete meeting_participants" ON public.meeting_participants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert agenda_points" ON public.agenda_points FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update agenda_points" ON public.agenda_points FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete agenda_points" ON public.agenda_points FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert agenda_point_pelouros" ON public.agenda_point_pelouros FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update agenda_point_pelouros" ON public.agenda_point_pelouros FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete agenda_point_pelouros" ON public.agenda_point_pelouros FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin and SEC can insert decisions" ON public.decisions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can update decisions" ON public.decisions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));
CREATE POLICY "Admin and SEC can delete decisions" ON public.decisions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

CREATE POLICY "Admin, SEC and Gestao can insert actions" ON public.actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec') OR public.has_role(auth.uid(), 'gestao'));
CREATE POLICY "Admin, SEC and Gestao can update actions" ON public.actions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec') OR public.has_role(auth.uid(), 'gestao'));
CREATE POLICY "Admin and SEC can delete actions" ON public.actions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sec'));

-- Triggers para updated_at
CREATE TRIGGER update_administrators_updated_at BEFORE UPDATE ON public.administrators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agenda_points_updated_at BEFORE UPDATE ON public.agenda_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON public.actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar contagem de pontos de agenda
CREATE OR REPLACE FUNCTION public.update_meeting_agenda_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.meetings SET agenda_points_count = agenda_points_count + 1 WHERE id = NEW.meeting_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.meetings SET agenda_points_count = agenda_points_count - 1 WHERE id = OLD.meeting_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_agenda_count_on_insert
AFTER INSERT ON public.agenda_points
FOR EACH ROW EXECUTE FUNCTION public.update_meeting_agenda_count();

CREATE TRIGGER update_agenda_count_on_delete
AFTER DELETE ON public.agenda_points
FOR EACH ROW EXECUTE FUNCTION public.update_meeting_agenda_count();