import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Meeting, 
  AgendaPoint, 
  Decision, 
  Action, 
  Administrator, 
  Pelouro,
  ActionStatus,
  AttributeFamily,
  AttributeDefinition,
  AgendaPointAttribute
} from '@/types/database';

// Meetings
export function useMeetings() {
  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          participants:meeting_participants(
            *,
            administrator:administrators(*)
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Meeting[];
    },
  });
}

export function useUpcomingMeetings() {
  return useQuery({
    queryKey: ['meetings', 'upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          participants:meeting_participants(
            *,
            administrator:administrators(*)
          )
        `)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data as Meeting[];
    },
  });
}

// Agenda Points
export function useAgendaPoints(meetingId?: string) {
  return useQuery({
    queryKey: ['agenda_points', meetingId],
    queryFn: async () => {
      let query = supabase
        .from('agenda_points')
        .select(`
          *,
          proposer:administrators(*),
          meeting:meetings(*)
        `)
        .order('order', { ascending: true });
      
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AgendaPoint[];
    },
  });
}

// Decisions
export function useDecisions() {
  return useQuery({
    queryKey: ['decisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decisions')
        .select(`
          *,
          agenda_point:agenda_points(
            *,
            meeting:meetings(*)
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Decision[];
    },
  });
}

export function useRecentDecisions(limit = 5) {
  return useQuery({
    queryKey: ['decisions', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decisions')
        .select(`
          *,
          agenda_point:agenda_points(
            *,
            meeting:meetings(*)
          )
        `)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as Decision[];
    },
  });
}

// Actions
export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select(`
          *,
          responsible:administrators(*),
          pelouro:pelouros(*),
          decision:decisions(
            *,
            agenda_point:agenda_points(*)
          )
        `)
        .order('deadline', { ascending: true });
      
      if (error) throw error;
      return data as Action[];
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      progress 
    }: { 
      id: string; 
      status?: ActionStatus; 
      progress?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      if (status !== undefined) updates.status = status;
      if (progress !== undefined) updates.progress = progress;
      
      const { error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

// Administrators
export function useAdministrators() {
  return useQuery({
    queryKey: ['administrators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Administrator[];
    },
  });
}

// Pelouros
export function usePelouros() {
  return useQuery({
    queryKey: ['pelouros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pelouros')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Pelouro[];
    },
  });
}

// Attribute Families
export function useAttributeFamilies() {
  return useQuery({
    queryKey: ['attribute_families'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribute_families')
        .select(`
          *,
          definitions:attribute_definitions(*)
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as AttributeFamily[];
    },
  });
}

// Attribute Definitions
export function useAttributeDefinitions(familyId?: string) {
  return useQuery({
    queryKey: ['attribute_definitions', familyId],
    queryFn: async () => {
      let query = supabase
        .from('attribute_definitions')
        .select('*, family:attribute_families(*)')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      
      if (familyId) {
        query = query.eq('family_id', familyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AttributeDefinition[];
    },
  });
}

// Agenda Point Attributes
export function useAgendaPointAttributes(agendaPointId?: string) {
  return useQuery({
    queryKey: ['agenda_point_attributes', agendaPointId],
    queryFn: async () => {
      if (!agendaPointId) return [];
      
      const { data, error } = await supabase
        .from('agenda_point_attributes')
        .select(`
          *,
          attribute_definition:attribute_definitions(
            *,
            family:attribute_families(*)
          )
        `)
        .eq('agenda_point_id', agendaPointId);
      
      if (error) throw error;
      return data as AgendaPointAttribute[];
    },
    enabled: !!agendaPointId,
  });
}

// Dashboard Metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Get meetings count
      const { count: totalMeetings } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true });

      // Get pending agenda points
      const { count: pendingAgendaPoints } = await supabase
        .from('agenda_points')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Proposto', 'Em discussão']);

      // Get active actions
      const { count: activeActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Por iniciar', 'Em curso']);

      // Get overdue actions
      const { count: overdueActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .lt('deadline', now)
        .in('status', ['Por iniciar', 'Em curso']);

      // Get completed actions for completion rate
      const { count: completedActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Concluída');

      const { count: totalActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true });

      const completionRate = totalActions && totalActions > 0 
        ? Math.round((completedActions || 0) / totalActions * 100)
        : 0;

      return {
        totalMeetings: totalMeetings || 0,
        pendingAgendaPoints: pendingAgendaPoints || 0,
        activeActions: activeActions || 0,
        overdueActions: overdueActions || 0,
        completionRate,
      };
    },
  });
}
