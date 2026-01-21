import { useMemo } from 'react';
import { useMeetings, useAgendaPoints, useDecisions, useActions, useProtocols } from './useSupabaseData';
import { useGruposTrabalho } from './useGruposTrabalho';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export type SearchResultType = 'meeting' | 'agenda_point' | 'decision' | 'action' | 'grupo_trabalho' | 'protocol';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  url: string;
  icon: 'calendar' | 'file-text' | 'gavel' | 'check-circle' | 'users' | 'scroll';
}

const meetingTypeLabels: Record<string, string> = {
  CA: 'Conselho de Administração',
  CEAAP: 'Assuntos Administrativos',
  RT: 'Reunião de Trabalho',
};

const statusLabels: Record<string, string> = {
  aberto: 'Aberto',
  inativo: 'Inativo',
  fechado: 'Fechado',
};

export function useGlobalSearch(query: string) {
  const { data: meetings = [] } = useMeetings();
  const { data: agendaPoints = [] } = useAgendaPoints();
  const { data: decisions = [] } = useDecisions();
  const { data: actions = [] } = useActions();
  const { data: gruposTrabalho = [] } = useGruposTrabalho();
  const { data: protocols = [] } = useProtocols();

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Search meetings
    meetings.forEach(meeting => {
      const meetingLabel = meetingTypeLabels[meeting.type] || meeting.type;
      const dateFormatted = format(new Date(meeting.date), "d 'de' MMMM 'de' yyyy", { locale: pt });
      const searchText = `${meetingLabel} ${meeting.location} ${dateFormatted} ${meeting.status}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        searchResults.push({
          id: meeting.id,
          type: 'meeting',
          title: `${meeting.type} - ${dateFormatted}`,
          subtitle: `${meetingLabel} • ${meeting.location}`,
          url: `/reunioes?meeting=${meeting.id}`,
          icon: 'calendar',
        });
      }
    });

    // Search agenda points
    agendaPoints.forEach(point => {
      const searchText = `${point.title} ${point.subject} ${point.description || ''} ${point.status}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        const meeting = point.meeting;
        const meetingInfo = meeting 
          ? `${meeting.type} - ${format(new Date(meeting.date), 'dd/MM/yyyy')}`
          : '';
        
        searchResults.push({
          id: point.id,
          type: 'agenda_point',
          title: point.title,
          subtitle: `${point.subject} • ${meetingInfo}`,
          url: `/agenda?point=${point.id}`,
          icon: 'file-text',
        });
      }
    });

    // Search decisions
    decisions.forEach(decision => {
      const searchText = `${decision.text} ${decision.deliberation || ''} ${decision.type}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        const agendaPoint = decision.agenda_point;
        const meeting = agendaPoint?.meeting;
        const context = meeting 
          ? `${meeting.type} - ${format(new Date(meeting.date), 'dd/MM/yyyy')}`
          : '';
        
        searchResults.push({
          id: decision.id,
          type: 'decision',
          title: decision.text.length > 80 ? decision.text.substring(0, 80) + '...' : decision.text,
          subtitle: `Decisão ${decision.type} • ${context}`,
          url: `/agenda?point=${decision.agenda_point_id}`,
          icon: 'gavel',
        });
      }
    });

    // Search actions
    actions.forEach(action => {
      const searchText = `${action.description} ${action.status} ${action.responsible_name || ''}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        const deadlineFormatted = format(new Date(action.deadline), 'dd/MM/yyyy');
        
        searchResults.push({
          id: action.id,
          type: 'action',
          title: action.description.length > 80 ? action.description.substring(0, 80) + '...' : action.description,
          subtitle: `${action.status} • Prazo: ${deadlineFormatted}`,
          url: `/acoes?action=${action.id}`,
          icon: 'check-circle',
        });
      }
    });

    // Search grupos de trabalho
    gruposTrabalho.forEach(grupo => {
      const searchText = `${grupo.codigo} ${grupo.designacao} ${grupo.tema || ''} ${grupo.observacoes_secap || ''}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        const statusLabel = statusLabels[grupo.status] || grupo.status;
        
        searchResults.push({
          id: grupo.id,
          type: 'grupo_trabalho',
          title: `${grupo.codigo} - ${grupo.designacao}`,
          subtitle: `${statusLabel} • ${grupo.tema || 'Sem tema'}`,
          url: `/grupos-trabalho?grupo=${grupo.id}`,
          icon: 'users',
        });
      }
    });

    // Search protocols
    protocols.forEach(protocol => {
      const searchText = `${protocol.nome} ${protocol.tema || ''} ${protocol.objeto || ''} ${protocol.decisor || ''}`.toLowerCase();
      
      if (searchText.includes(normalizedQuery)) {
        const statusText = protocol.em_vigor ? 'Em vigor' : 'Não vigente';
        
        searchResults.push({
          id: protocol.id,
          type: 'protocol',
          title: protocol.nome,
          subtitle: `${statusText} • ${protocol.tema || 'Sem tema'}`,
          url: `/protocolos?protocol=${protocol.id}`,
          icon: 'scroll',
        });
      }
    });

    // Limit results
    return searchResults.slice(0, 25);
  }, [query, meetings, agendaPoints, decisions, actions, gruposTrabalho, protocols]);

  return { results };
}
