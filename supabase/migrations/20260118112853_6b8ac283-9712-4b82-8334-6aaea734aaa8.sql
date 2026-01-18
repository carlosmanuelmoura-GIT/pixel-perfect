-- Remove defaults first before changing types
ALTER TABLE agenda_points ALTER COLUMN status DROP DEFAULT;
ALTER TABLE agenda_points ALTER COLUMN point_type DROP DEFAULT;
ALTER TABLE decisions ALTER COLUMN type DROP DEFAULT;

-- Update agenda_point_status enum
ALTER TABLE agenda_points ALTER COLUMN status TYPE text;
DROP TYPE agenda_point_status;
CREATE TYPE agenda_point_status AS ENUM ('Em agendamento', 'Agendado', 'Deliberado');

UPDATE agenda_points SET status = 'Em agendamento' WHERE status = 'Proposto';
UPDATE agenda_points SET status = 'Agendado' WHERE status IN ('Aprovado', 'Em discussão');
UPDATE agenda_points SET status = 'Deliberado' WHERE status IN ('Fechado', 'Acompanhamento', 'Encerrado');

ALTER TABLE agenda_points 
  ALTER COLUMN status TYPE agenda_point_status 
  USING status::agenda_point_status;
ALTER TABLE agenda_points 
  ALTER COLUMN status SET DEFAULT 'Em agendamento'::agenda_point_status;

-- Update point_type enum
ALTER TABLE agenda_points ALTER COLUMN point_type TYPE text;
DROP TYPE point_type;
CREATE TYPE point_type AS ENUM ('Informação', 'Para Decisão');

UPDATE agenda_points SET point_type = 'Para Decisão' WHERE point_type IN ('Decisão', 'Discussão');

ALTER TABLE agenda_points 
  ALTER COLUMN point_type TYPE point_type 
  USING point_type::point_type;
ALTER TABLE agenda_points 
  ALTER COLUMN point_type SET DEFAULT 'Para Decisão'::point_type;

-- Update decision_type enum
ALTER TABLE decisions ALTER COLUMN type TYPE text;
DROP TYPE decision_type;
CREATE TYPE decision_type AS ENUM ('Estratégica', 'Táctica', 'Operacional', 'Tomada de Conhecimento');

ALTER TABLE decisions 
  ALTER COLUMN type TYPE decision_type 
  USING type::decision_type;
ALTER TABLE decisions 
  ALTER COLUMN type SET DEFAULT 'Operacional'::decision_type;