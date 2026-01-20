// Database types from Supabase schema
export type MeetingType = 'CA' | 'CEAAP' | 'RT';
export type MeetingStatus = 'Preparação' | 'Em Curso' | 'Concluída' | 'Publicada';
export type AgendaPointStatus = 'Em agendamento' | 'Agendado' | 'Deliberado';
export type PointType = 'Informação' | 'Para Decisão';
export type Priority = 'Alta' | 'Média' | 'Baixa';
export type DecisionType = 'Estratégica' | 'Táctica' | 'Operacional' | 'Tomada de Conhecimento';
export type Criticality = 'Crítica' | 'Importante' | 'Normal';
export type VoteMode = 'Unanimidade' | 'Votação' | 'Consenso';
export type ActionStatus = 'Por iniciar' | 'Em curso' | 'Concluída' | 'Bloqueada' | 'Cancelada';
export type AppRole = 'admin' | 'sec' | 'gestao' | 'leitor';

export interface Pelouro {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface AdministratorPelouro {
  id: string;
  administrator_id: string;
  pelouro_id: string;
  created_at: string;
  pelouro?: Pelouro;
}

export interface Administrator {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  pelouros?: Pelouro[];
  administrator_pelouros?: AdministratorPelouro[];
}

export interface Meeting {
  id: string;
  date: string;
  type: MeetingType;
  location: string;
  status: MeetingStatus;
  agenda_points_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participants?: MeetingParticipant[];
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  administrator_id: string;
  is_observer: boolean;
  created_at: string;
  administrator?: Administrator;
}

export interface AgendaPoint {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  subject: string;
  background: string | null;
  proposer_id: string | null;
  priority: Priority;
  point_type: PointType;
  status: AgendaPointStatus;
  order: number;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  proposer?: Administrator;
  pelouros?: Pelouro[];
  meeting?: Meeting;
  decisions?: Decision[];
}

export interface Decision {
  id: string;
  agenda_point_id: string;
  text: string;
  type: DecisionType;
  criticality: Criticality;
  date: string;
  vote_mode: VoteMode;
  votes_for: number | null;
  votes_against: number | null;
  abstentions: number | null;
  background: string | null;
  deliberation: string | null;
  has_followup: boolean;
  created_at: string;
  updated_at: string;
  agenda_point?: AgendaPoint;
  actions?: Action[];
}

export interface Action {
  id: string;
  decision_id: string;
  description: string;
  responsible_id: string | null;
  pelouro_id: string | null;
  start_date: string;
  deadline: string;
  status: ActionStatus;
  progress: number;
  criticality: Criticality;
  created_at: string;
  updated_at: string;
  responsible?: Administrator;
  pelouro?: Pelouro;
  decision?: Decision;
}

export type AttributeType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'boolean' | 'select' | 'multi_select' | 'url' | 'email' | 'currency';

export interface AttributeFamily {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  definitions?: AttributeDefinition[];
}

export interface AttributeDefinition {
  id: string;
  family_id: string;
  name: string;
  label: string;
  description: string | null;
  attribute_type: AttributeType;
  is_required: boolean;
  is_active: boolean;
  order_index: number;
  default_value: string | null;
  options: { options: { value: string; label: string }[] } | null;
  validation_rules: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  family?: AttributeFamily;
}

export interface AgendaPointAttribute {
  id: string;
  agenda_point_id: string;
  attribute_definition_id: string;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  value_date: string | null;
  value_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  attribute_definition?: AttributeDefinition;
}

export interface AgendaPointExtraData {
  id: string;
  agenda_point_id: string;
  precedentes: string | null;
  observacoes: string | null;
  presenca_mca: boolean;
  motivo_ausencia_mca: string | null;
  presenca_dcm: boolean;
  motivo_ausencia_dcm: string | null;
  presenca_dep: boolean;
  motivo_ausencia_dep: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  pelouro: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  profile?: Profile;
}

export interface DashboardMetrics {
  scheduledMeetings: number;
  expiredActions: number;
  agendaPointsInScheduling: number;
  decisionsWithFollowUpPercent: number;
  nextMeetingAgendaPoints: number;
}
