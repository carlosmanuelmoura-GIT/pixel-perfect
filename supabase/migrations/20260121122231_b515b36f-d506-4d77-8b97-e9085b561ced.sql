-- Create protocols table
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT,
  nome TEXT NOT NULL,
  divulgacao_existencia BOOLEAN NOT NULL DEFAULT false,
  divulgacao_conteudo BOOLEAN NOT NULL DEFAULT false,
  em_vigor BOOLEAN NOT NULL DEFAULT true,
  data_celebracao DATE,
  data_producao_efeitos DATE,
  decisor TEXT,
  data_aprovacao DATE,
  tipo_ambito TEXT,
  tema TEXT,
  objeto TEXT,
  data_termo DATE,
  renovacao_automatica BOOLEAN NOT NULL DEFAULT false,
  id_doc_plus TEXT,
  link_doc_plus TEXT,
  observacoes TEXT,
  alteracoes TEXT,
  departamento_responsavel_id UUID REFERENCES public.pelouros(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view protocols"
ON public.protocols
FOR SELECT
USING (true);

CREATE POLICY "Admin and SEC can insert protocols"
ON public.protocols
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update protocols"
ON public.protocols
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete protocols"
ON public.protocols
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();