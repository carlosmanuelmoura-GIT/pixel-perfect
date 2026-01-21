-- Create enum for work group status
CREATE TYPE work_group_status AS ENUM ('aberto', 'inativo', 'fechado');

-- Create enum for deliverable status
CREATE TYPE deliverable_status AS ENUM ('Em trabalho', 'Entregue');

-- Create work groups table
CREATE TABLE public.grupos_trabalho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo text NOT NULL,
  status work_group_status NOT NULL DEFAULT 'aberto',
  designacao text NOT NULL,
  tema text,
  divulgar_existencia boolean NOT NULL DEFAULT false,
  observacoes_secap text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create deliverables table
CREATE TABLE public.entregaveis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_trabalho_id uuid NOT NULL REFERENCES public.grupos_trabalho(id) ON DELETE CASCADE,
  codigo text,
  descricao text NOT NULL,
  ponto_situacao text,
  decisor text,
  data_entregavel timestamp with time zone,
  num_doc_plus text,
  divulgar_entregavel boolean NOT NULL DEFAULT false,
  criacao boolean NOT NULL DEFAULT false,
  encerramento boolean NOT NULL DEFAULT false,
  link_doc text,
  notas_secap text,
  status deliverable_status NOT NULL DEFAULT 'Em trabalho',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grupos_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregaveis ENABLE ROW LEVEL SECURITY;

-- RLS policies for grupos_trabalho
CREATE POLICY "Authenticated users can view grupos_trabalho"
ON public.grupos_trabalho FOR SELECT
USING (true);

CREATE POLICY "Admin and SEC can insert grupos_trabalho"
ON public.grupos_trabalho FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update grupos_trabalho"
ON public.grupos_trabalho FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete grupos_trabalho"
ON public.grupos_trabalho FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- RLS policies for entregaveis
CREATE POLICY "Authenticated users can view entregaveis"
ON public.entregaveis FOR SELECT
USING (true);

CREATE POLICY "Admin and SEC can insert entregaveis"
ON public.entregaveis FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update entregaveis"
ON public.entregaveis FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete entregaveis"
ON public.entregaveis FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- Trigger for updated_at on grupos_trabalho
CREATE TRIGGER update_grupos_trabalho_updated_at
BEFORE UPDATE ON public.grupos_trabalho
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on entregaveis
CREATE TRIGGER update_entregaveis_updated_at
BEFORE UPDATE ON public.entregaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();