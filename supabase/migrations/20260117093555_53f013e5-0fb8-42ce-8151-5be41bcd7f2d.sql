-- Sistema de atributos dinâmicos para pontos de agenda

-- Tabela de famílias de atributos (categorias/tabs)
CREATE TABLE public.attribute_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tipos de atributos
CREATE TYPE public.attribute_type AS ENUM (
  'text',
  'textarea',
  'number',
  'date',
  'datetime',
  'boolean',
  'select',
  'multi_select',
  'url',
  'email',
  'currency'
);

-- Tabela de definição de atributos
CREATE TABLE public.attribute_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.attribute_families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  attribute_type attribute_type NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  default_value TEXT,
  options JSONB, -- Para campos select/multi_select: {"options": [{"value": "x", "label": "X"}]}
  validation_rules JSONB, -- {"min": 0, "max": 100, "pattern": "regex", etc}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de valores de atributos para pontos de agenda
CREATE TABLE public.agenda_point_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_point_id UUID REFERENCES public.agenda_points(id) ON DELETE CASCADE NOT NULL,
  attribute_definition_id UUID REFERENCES public.attribute_definitions(id) ON DELETE CASCADE NOT NULL,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  value_date TIMESTAMPTZ,
  value_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agenda_point_id, attribute_definition_id)
);

-- Enable RLS
ALTER TABLE public.attribute_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_point_attributes ENABLE ROW LEVEL SECURITY;

-- RLS policies for attribute_families
CREATE POLICY "Authenticated users can view attribute_families"
ON public.attribute_families FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and SEC can insert attribute_families"
ON public.attribute_families FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update attribute_families"
ON public.attribute_families FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete attribute_families"
ON public.attribute_families FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- RLS policies for attribute_definitions
CREATE POLICY "Authenticated users can view attribute_definitions"
ON public.attribute_definitions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and SEC can insert attribute_definitions"
ON public.attribute_definitions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update attribute_definitions"
ON public.attribute_definitions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete attribute_definitions"
ON public.attribute_definitions FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- RLS policies for agenda_point_attributes
CREATE POLICY "Authenticated users can view agenda_point_attributes"
ON public.agenda_point_attributes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin and SEC can insert agenda_point_attributes"
ON public.agenda_point_attributes FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can update agenda_point_attributes"
ON public.agenda_point_attributes FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

CREATE POLICY "Admin and SEC can delete agenda_point_attributes"
ON public.agenda_point_attributes FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sec'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_attribute_families_updated_at
  BEFORE UPDATE ON public.attribute_families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attribute_definitions_updated_at
  BEFORE UPDATE ON public.attribute_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agenda_point_attributes_updated_at
  BEFORE UPDATE ON public.agenda_point_attributes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir famílias de atributos de exemplo
INSERT INTO public.attribute_families (name, description, icon, order_index) VALUES
('Informação Geral', 'Dados básicos e contexto do ponto de agenda', 'info', 1),
('Análise Financeira', 'Impacto financeiro e orçamental', 'banknote', 2),
('Documentação', 'Documentos de suporte e referências', 'file-text', 3),
('Indicadores', 'Métricas e KPIs associados', 'bar-chart-3', 4);

-- Inserir definições de atributos de exemplo
INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'contexto_estrategico',
  'Contexto Estratégico',
  'Alinhamento com os objetivos estratégicos',
  'textarea'::attribute_type,
  false,
  1,
  NULL
FROM public.attribute_families f WHERE f.name = 'Informação Geral';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'urgencia',
  'Nível de Urgência',
  'Classificação da urgência do ponto',
  'select'::attribute_type,
  true,
  2,
  '{"options": [{"value": "baixa", "label": "Baixa"}, {"value": "media", "label": "Média"}, {"value": "alta", "label": "Alta"}, {"value": "critica", "label": "Crítica"}]}'::jsonb
FROM public.attribute_families f WHERE f.name = 'Informação Geral';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'impacto_orcamental',
  'Impacto Orçamental (€)',
  'Valor estimado do impacto financeiro',
  'currency'::attribute_type,
  false,
  1,
  NULL
FROM public.attribute_families f WHERE f.name = 'Análise Financeira';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'rubrica_orcamental',
  'Rubrica Orçamental',
  'Rubrica do orçamento afetada',
  'text'::attribute_type,
  false,
  2,
  NULL
FROM public.attribute_families f WHERE f.name = 'Análise Financeira';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'aprovado_financeiramente',
  'Aprovado Financeiramente',
  'Indica se tem cabimento orçamental aprovado',
  'boolean'::attribute_type,
  false,
  3,
  NULL
FROM public.attribute_families f WHERE f.name = 'Análise Financeira';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'link_documento_suporte',
  'Link Documento de Suporte',
  'URL para documento de suporte principal',
  'url'::attribute_type,
  false,
  1,
  NULL
FROM public.attribute_families f WHERE f.name = 'Documentação';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'numero_proposta',
  'Número da Proposta',
  'Referência da proposta associada',
  'text'::attribute_type,
  false,
  2,
  NULL
FROM public.attribute_families f WHERE f.name = 'Documentação';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'kpi_principal',
  'KPI Principal',
  'Indicador chave relacionado',
  'text'::attribute_type,
  false,
  1,
  NULL
FROM public.attribute_families f WHERE f.name = 'Indicadores';

INSERT INTO public.attribute_definitions (family_id, name, label, description, attribute_type, is_required, order_index, options)
SELECT 
  f.id,
  'meta_valor',
  'Valor Meta',
  'Valor objetivo a atingir',
  'number'::attribute_type,
  false,
  2,
  NULL
FROM public.attribute_families f WHERE f.name = 'Indicadores';