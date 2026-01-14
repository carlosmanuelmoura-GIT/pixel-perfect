// Core Types for Board Decisions Management System

export type MeetingType = 'CA' | 'CEAAP' | 'RT';

export type MeetingStatus = 'Preparação' | 'Em Curso' | 'Concluída' | 'Publicada';

export type AgendaPointStatus = 
  | 'Proposto'
  | 'Aprovado'
  | 'Em discussão'
  | 'Fechado'
  | 'Acompanhamento'
  | 'Encerrado';

export type PointType = 'Informação' | 'Decisão' | 'Discussão';

export type Priority = 'Alta' | 'Média' | 'Baixa';

export type DecisionType = 'Estratégica' | 'Táctica' | 'Operacional';

export type Criticality = 'Crítica' | 'Importante' | 'Rotina';

export type VoteMode = 'Unanimidade' | 'Votação' | 'Consenso';

export type ActionStatus = 'Por iniciar' | 'Em curso' | 'Concluída' | 'Bloqueada' | 'Cancelada';

export type UserRole = 'Admin' | 'SEC' | 'Gestão' | 'Leitor';

export interface Administrator {
  id: string;
  name: string;
  email: string;
  pelouros: string[];
  avatar?: string;
}

export interface Meeting {
  id: string;
  date: Date;
  type: MeetingType;
  location: string;
  status: MeetingStatus;
  participants: string[];
  observers?: string[];
  agendaPointsCount: number;
}

export interface AgendaPoint {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  subject: string;
  background?: string;
  proposer: string;
  pelouros: string[];
  priority: Priority;
  pointType: PointType;
  status: AgendaPointStatus;
  order: number;
  isConfidential?: boolean;
  createdAt: Date;
}

export interface Decision {
  id: string;
  agendaPointId: string;
  text: string;
  type: DecisionType;
  criticality: Criticality;
  date: Date;
  voteMode: VoteMode;
  votesFor?: number;
  votesAgainst?: number;
  abstentions?: number;
  background?: string;
  deliberation?: string;
}

export interface Action {
  id: string;
  decisionId: string;
  description: string;
  responsible: string;
  pelouro: string;
  startDate: Date;
  deadline: Date;
  status: ActionStatus;
  progress: number;
  criticality: Criticality;
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
