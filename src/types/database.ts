// Database types from Supabase schema
export type MeetingType = 'CA' | 'CEAAP' | 'RT';
export type MeetingStatus = 'Preparação' | 'Em Curso' | 'Concluída' | 'Publicada';
export type AgendaPointStatus = 'Proposto' | 'Aprovado' | 'Em discussão' | 'Fechado' | 'Acompanhamento' | 'Encerrado';
export type PointType = 'Informação' | 'Decisão' | 'Discussão';
export type Priority = 'Alta' | 'Média' | 'Baixa';
export type DecisionType = 'Estratégica' | 'Táctica' | 'Operacional';
export type Criticality = 'Crítica' | 'Importante' | 'Rotina';
export type VoteMode = 'Unanimidade' | 'Votação' | 'Consenso';
export type ActionStatus = 'Por iniciar' | 'Em curso' | 'Concluída' | 'Bloqueada' | 'Cancelada';
export type AppRole = 'admin' | 'sec' | 'gestao' | 'leitor';

export interface Pelouro {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  agenda_point?: AgendaPoint;
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
}

export interface DashboardMetrics {
  totalMeetings: number;
  pendingAgendaPoints: number;
  activeActions: number;
  overdueActions: number;
  completionRate: number;
  upcomingMeetings: Meeting[];
  recentDecisions: Decision[];
}
