-- Inserir Pelouros
INSERT INTO public.pelouros (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Operações', 'Gestão de operações e processos'),
  ('22222222-2222-2222-2222-222222222222', 'Financeiro', 'Gestão financeira e contabilidade'),
  ('33333333-3333-3333-3333-333333333333', 'Tecnologia', 'Sistemas e infraestrutura tecnológica'),
  ('44444444-4444-4444-4444-444444444444', 'Recursos Humanos', 'Gestão de pessoas e cultura'),
  ('55555555-5555-5555-5555-555555555555', 'Comercial', 'Vendas e relações comerciais'),
  ('66666666-6666-6666-6666-666666666666', 'Marketing', 'Comunicação e marketing'),
  ('77777777-7777-7777-7777-777777777777', 'Jurídico', 'Assuntos legais e compliance'),
  ('88888888-8888-8888-8888-888888888888', 'Sustentabilidade', 'ESG e responsabilidade social');

-- Inserir Administradores
INSERT INTO public.administrators (id, name, email, avatar_url) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'João Silva', 'joao.silva@empresa.pt', NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Maria Santos', 'maria.santos@empresa.pt', NULL),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'António Costa', 'antonio.costa@empresa.pt', NULL),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Ana Ferreira', 'ana.ferreira@empresa.pt', NULL),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Pedro Oliveira', 'pedro.oliveira@empresa.pt', NULL);

-- Associar Administradores a Pelouros
INSERT INTO public.administrator_pelouros (administrator_id, pelouro_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '88888888-8888-8888-8888-888888888888');

-- Inserir Reuniões
INSERT INTO public.meetings (id, date, type, location, status, agenda_points_count) VALUES
  ('11111111-0000-0000-0000-000000000001', '2026-01-20 10:00:00+00', 'CA', 'Sala de Administração - Piso 5', 'Preparação', 0),
  ('11111111-0000-0000-0000-000000000002', '2026-01-25 14:00:00+00', 'CEAAP', 'Sala de Reuniões A', 'Preparação', 0),
  ('11111111-0000-0000-0000-000000000003', '2026-01-10 09:00:00+00', 'CA', 'Sala de Administração - Piso 5', 'Concluída', 0),
  ('11111111-0000-0000-0000-000000000004', '2026-02-05 10:00:00+00', 'RT', 'Sala de Reuniões B', 'Preparação', 0);

-- Inserir Participantes nas Reuniões
INSERT INTO public.meeting_participants (meeting_id, administrator_id, is_observer) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false),
  ('11111111-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false),
  ('11111111-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false),
  ('11111111-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', false),
  ('11111111-0000-0000-0000-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false),
  ('11111111-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false),
  ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', false),
  ('11111111-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false),
  ('11111111-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', false),
  ('11111111-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', false),
  ('11111111-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', false),
  ('11111111-0000-0000-0000-000000000004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', false);

-- Inserir Pontos de Agenda (vai atualizar automaticamente agenda_points_count via trigger)
INSERT INTO public.agenda_points (id, meeting_id, title, description, subject, proposer_id, priority, point_type, status, "order") VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Aprovação do Orçamento 2026', 'Análise e aprovação do orçamento anual para 2026', 'Financeiro', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alta', 'Decisão', 'Proposto', 1),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Plano de Transformação Digital', 'Apresentação do roadmap de transformação digital', 'Estratégia', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Alta', 'Discussão', 'Proposto', 2),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', 'Relatório de Sustentabilidade', 'Análise do relatório ESG anual', 'Sustentabilidade', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Média', 'Informação', 'Proposto', 3),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'Revisão de Políticas RH', 'Atualização das políticas de recursos humanos', 'RH', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Média', 'Decisão', 'Fechado', 1),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'Expansão Internacional', 'Discussão sobre entrada em novos mercados', 'Estratégia', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Alta', 'Decisão', 'Fechado', 2);

-- Associar Pontos de Agenda a Pelouros
INSERT INTO public.agenda_point_pelouros (agenda_point_id, pelouro_id) VALUES
  ('22222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('22222222-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333'),
  ('22222222-0000-0000-0000-000000000003', '88888888-8888-8888-8888-888888888888'),
  ('22222222-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444'),
  ('22222222-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555');

-- Inserir Decisões
INSERT INTO public.decisions (id, agenda_point_id, text, type, criticality, date, vote_mode, votes_for, votes_against, abstentions) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004', 'Aprovada a nova política de trabalho híbrido com implementação faseada', 'Táctica', 'Importante', '2026-01-10 10:30:00+00', 'Votação', 4, 0, 0),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005', 'Aprovada a entrada no mercado espanhol no Q2 2026', 'Estratégica', 'Crítica', '2026-01-10 11:15:00+00', 'Unanimidade', 4, 0, 0);

-- Inserir Ações
INSERT INTO public.actions (id, decision_id, description, responsible_id, pelouro_id, start_date, deadline, status, progress, criticality) VALUES
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Elaborar plano de comunicação para nova política de trabalho híbrido', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '2026-01-11 00:00:00+00', '2026-01-25 00:00:00+00', 'Em curso', 60, 'Importante'),
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'Atualizar sistemas de controlo de assiduidade', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '2026-01-15 00:00:00+00', '2026-02-15 00:00:00+00', 'Por iniciar', 0, 'Rotina'),
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000002', 'Identificar parceiros locais em Espanha', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '55555555-5555-5555-5555-555555555555', '2026-01-12 00:00:00+00', '2026-02-28 00:00:00+00', 'Em curso', 30, 'Crítica'),
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000002', 'Análise jurídica de requisitos legais em Espanha', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '77777777-7777-7777-7777-777777777777', '2026-01-12 00:00:00+00', '2026-02-10 00:00:00+00', 'Por iniciar', 0, 'Importante'),
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002', 'Preparar orçamento para expansão', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '2026-01-15 00:00:00+00', '2026-02-20 00:00:00+00', 'Em curso', 45, 'Crítica'),
  ('44444444-0000-0000-0000-000000000006', '33333333-0000-0000-0000-000000000001', 'Formar gestores sobre nova política', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '2026-01-20 00:00:00+00', '2026-01-10 00:00:00+00', 'Bloqueada', 20, 'Importante');