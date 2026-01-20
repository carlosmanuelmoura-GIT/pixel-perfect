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
  AgendaPointAttribute,
  AgendaPointExtraData,
  MeetingType,
  MeetingStatus,
  AgendaPointStatus,
  PointType,
  Priority,
  DecisionType,
  VoteMode,
  Criticality,
  UserRole,
  Profile,
  AppRole,
  AttributeType
} from '@/types/database';
import { toast } from 'sonner';

// ============== MEETINGS ==============
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

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (meeting: { 
      date: string; 
      type: MeetingType; 
      location: string;
      status?: MeetingStatus;
    }) => {
      const { data, error } = await supabase
        .from('meetings')
        .insert(meeting)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar reunião: ' + error.message);
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      date?: string; 
      type?: MeetingType; 
      location?: string;
      status?: MeetingStatus;
    }) => {
      const { error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar reunião: ' + error.message);
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião eliminada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar reunião: ' + error.message);
    },
  });
}

export function useDuplicateMeeting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ meetingId, newDate }: { meetingId: string; newDate: string }) => {
      // Get original meeting
      const { data: original, error: fetchError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create new meeting
      const { data: newMeeting, error: createError } = await supabase
        .from('meetings')
        .insert({
          date: newDate,
          type: original.type,
          location: original.location,
          status: 'Preparação' as MeetingStatus,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Optionally copy agenda points
      const { data: agendaPoints } = await supabase
        .from('agenda_points')
        .select('*')
        .eq('meeting_id', meetingId);
      
      if (agendaPoints && agendaPoints.length > 0) {
        const newPoints = agendaPoints.map(p => ({
          meeting_id: newMeeting.id,
          title: p.title,
          subject: p.subject,
          description: p.description,
          background: p.background,
          proposer_id: p.proposer_id,
          priority: p.priority,
          point_type: p.point_type,
          status: 'Em agendamento' as AgendaPointStatus,
          order: p.order,
          is_confidential: p.is_confidential,
        }));
        
        await supabase.from('agenda_points').insert(newPoints);
      }
      
      return newMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['agenda_points'] });
      toast.success('Reunião duplicada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao duplicar reunião: ' + error.message);
    },
  });
}

// ============== AGENDA POINTS ==============
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

export function useCreateAgendaPoint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (point: { 
      meeting_id: string;
      title: string;
      subject: string;
      description?: string;
      background?: string;
      proposer_id?: string;
      priority?: Priority;
      point_type?: PointType;
      status?: AgendaPointStatus;
      order?: number;
      is_confidential?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('agenda_points')
        .insert(point)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda_points'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Ponto de agenda criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar ponto de agenda: ' + error.message);
    },
  });
}

export function useUpdateAgendaPoint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      title?: string;
      subject?: string;
      description?: string;
      background?: string;
      proposer_id?: string;
      priority?: Priority;
      point_type?: PointType;
      status?: AgendaPointStatus;
      order?: number;
      is_confidential?: boolean;
    }) => {
      const { error } = await supabase
        .from('agenda_points')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda_points'] });
      toast.success('Ponto de agenda atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ponto de agenda: ' + error.message);
    },
  });
}

export function useDeleteAgendaPoint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agenda_points')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda_points'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Ponto de agenda eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar ponto de agenda: ' + error.message);
    },
  });
}

// ============== AGENDA POINT EXTRA DATA ==============
export function useAgendaPointExtraData(agendaPointId?: string) {
  return useQuery({
    queryKey: ['agenda_point_extra_data', agendaPointId],
    queryFn: async () => {
      if (!agendaPointId) return null;
      
      const { data, error } = await supabase
        .from('agenda_point_extra_data')
        .select('*')
        .eq('agenda_point_id', agendaPointId)
        .maybeSingle();
      
      if (error) throw error;
      return data as AgendaPointExtraData | null;
    },
    enabled: !!agendaPointId,
  });
}

export function useUpsertAgendaPointExtraData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      agenda_point_id: string;
      precedentes?: string | null;
      observacoes?: string | null;
      presenca_mca?: boolean;
      motivo_ausencia_mca?: string | null;
      presenca_dcm?: boolean;
      motivo_ausencia_dcm?: string | null;
      presenca_dep?: boolean;
      motivo_ausencia_dep?: string | null;
    }) => {
      const { error } = await supabase
        .from('agenda_point_extra_data')
        .upsert(data, { onConflict: 'agenda_point_id' });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agenda_point_extra_data', variables.agenda_point_id] });
      toast.success('Dados guardados com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao guardar dados: ' + error.message);
    },
  });
}

// ============== DECISIONS ==============
export function useDecisions(agendaPointId?: string) {
  return useQuery({
    queryKey: ['decisions', agendaPointId],
    queryFn: async () => {
      let query = supabase
        .from('decisions')
        .select(`
          *,
          agenda_point:agenda_points(
            *,
            meeting:meetings(*)
          )
        `)
        .order('date', { ascending: false });
      
      if (agendaPointId) {
        query = query.eq('agenda_point_id', agendaPointId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Decision[];
    },
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (decision: { 
      agenda_point_id: string;
      text: string;
      type?: DecisionType;
      criticality?: Criticality;
      vote_mode?: VoteMode;
      votes_for?: number;
      votes_against?: number;
      abstentions?: number;
      background?: string;
      deliberation?: string;
      has_followup?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('decisions')
        .insert(decision)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      toast.success('Decisão criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar decisão: ' + error.message);
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      text?: string;
      type?: DecisionType;
      criticality?: Criticality;
      vote_mode?: VoteMode;
      votes_for?: number;
      votes_against?: number;
      abstentions?: number;
      background?: string;
      deliberation?: string;
      has_followup?: boolean;
    }) => {
      const { error } = await supabase
        .from('decisions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      toast.success('Decisão atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar decisão: ' + error.message);
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('decisions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
      toast.success('Decisão eliminada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar decisão: ' + error.message);
    },
  });
}

// ============== ACTIONS ==============
export function useActions(decisionId?: string) {
  return useQuery({
    queryKey: ['actions', decisionId],
    queryFn: async () => {
      let query = supabase
        .from('actions')
        .select(`
          *,
          responsible:administrators(*),
          pelouro:pelouros(*),
          decision:decisions(
            *,
            agenda_point:agenda_points(
              *,
              meeting:meetings(*)
            )
          )
        `)
        .order('deadline', { ascending: true });
      
      if (decisionId) {
        query = query.eq('decision_id', decisionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Action[];
    },
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (action: { 
      decision_id: string;
      description: string;
      responsible_id?: string;
      pelouro_id?: string;
      start_date?: string;
      deadline: string;
      status?: ActionStatus;
      progress?: number;
      criticality?: Criticality;
    }) => {
      const { data, error } = await supabase
        .from('actions')
        .insert(action)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      toast.success('Ação criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar ação: ' + error.message);
    },
  });
}

export function useUpdateAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      description?: string;
      responsible_id?: string;
      pelouro_id?: string;
      start_date?: string;
      deadline?: string;
      status?: ActionStatus; 
      progress?: number;
      criticality?: Criticality;
    }) => {
      const { error } = await supabase
        .from('actions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      toast.success('Ação atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ação: ' + error.message);
    },
  });
}

export function useDeleteAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      toast.success('Ação eliminada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar ação: ' + error.message);
    },
  });
}

// ============== ADMINISTRATORS ==============
export function useAdministrators() {
  return useQuery({
    queryKey: ['administrators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('administrators')
        .select(`
          *,
          administrator_pelouros(
            *,
            pelouro:pelouros(*)
          )
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Administrator[];
    },
  });
}

export function useCreateAdministrator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (admin: { 
      name: string;
      email: string;
      avatar_url?: string;
      user_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('administrators')
        .insert(admin)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      toast.success('Administrador criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar administrador: ' + error.message);
    },
  });
}

export function useUpdateAdministrator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      name?: string;
      email?: string;
      avatar_url?: string;
      user_id?: string;
    }) => {
      const { error } = await supabase
        .from('administrators')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      toast.success('Administrador atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar administrador: ' + error.message);
    },
  });
}

export function useDeleteAdministrator() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      toast.success('Administrador eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar administrador: ' + error.message);
    },
  });
}

// ============== ADMINISTRATOR PELOUROS ==============
export function useAdministratorPelouros(administratorId?: string) {
  return useQuery({
    queryKey: ['administrator_pelouros', administratorId],
    queryFn: async () => {
      if (!administratorId) return [];
      
      const { data, error } = await supabase
        .from('administrator_pelouros')
        .select(`
          *,
          pelouro:pelouros(*)
        `)
        .eq('administrator_id', administratorId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!administratorId,
  });
}

export function useSetAdministratorPelouros() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ administratorId, pelouroIds }: { administratorId: string; pelouroIds: string[] }) => {
      // Delete existing relations
      await supabase
        .from('administrator_pelouros')
        .delete()
        .eq('administrator_id', administratorId);
      
      // Insert new relations
      if (pelouroIds.length > 0) {
        const { error } = await supabase
          .from('administrator_pelouros')
          .insert(pelouroIds.map(pelouroId => ({
            administrator_id: administratorId,
            pelouro_id: pelouroId,
          })));
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      queryClient.invalidateQueries({ queryKey: ['administrator_pelouros'] });
      toast.success('Pelouros atualizados com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pelouros: ' + error.message);
    },
  });
}

// ============== USER ROLES ==============
export function useUserRoles() {
  return useQuery({
    queryKey: ['user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserRole[];
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roles'] });
      toast.success('Role atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar role: ' + error.message);
    },
  });
}

// ============== PELOUROS ==============
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

export function useCreatePelouro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pelouro: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('pelouros')
        .insert(pelouro)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelouros'] });
      toast.success('Pelouro criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar pelouro: ' + error.message);
    },
  });
}

export function useUpdatePelouro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; description?: string }) => {
      const { error } = await supabase
        .from('pelouros')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelouros'] });
      toast.success('Pelouro atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pelouro: ' + error.message);
    },
  });
}

export function useDeletePelouro() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pelouros')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pelouros'] });
      toast.success('Pelouro eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar pelouro: ' + error.message);
    },
  });
}

// ============== ATTRIBUTE FAMILIES ==============
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

export function useAllAttributeFamilies() {
  return useQuery({
    queryKey: ['attribute_families', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribute_families')
        .select(`
          *,
          definitions:attribute_definitions(*)
        `)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as AttributeFamily[];
    },
  });
}

export function useCreateAttributeFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (family: { 
      name: string; 
      description?: string; 
      icon?: string;
      order_index?: number;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('attribute_families')
        .insert(family)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Família de atributos criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar família: ' + error.message);
    },
  });
}

export function useUpdateAttributeFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      name?: string;
      description?: string;
      icon?: string;
      order_index?: number;
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from('attribute_families')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Família de atributos atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar família: ' + error.message);
    },
  });
}

export function useDeleteAttributeFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attribute_families')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Família de atributos eliminada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar família: ' + error.message);
    },
  });
}

// ============== ATTRIBUTE DEFINITIONS ==============
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

export function useAllAttributeDefinitions() {
  return useQuery({
    queryKey: ['attribute_definitions', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attribute_definitions')
        .select('*, family:attribute_families(*)')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as AttributeDefinition[];
    },
  });
}

export function useCreateAttributeDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (definition: { 
      family_id: string;
      name: string;
      label: string;
      description?: string;
      attribute_type?: AttributeType;
      is_required?: boolean;
      is_active?: boolean;
      order_index?: number;
      default_value?: string;
      options?: unknown;
      validation_rules?: unknown;
    }) => {
      const { data, error } = await supabase
        .from('attribute_definitions')
        .insert(definition as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_definitions'] });
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Atributo criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar atributo: ' + error.message);
    },
  });
}

export function useUpdateAttributeDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string;
      name?: string;
      label?: string;
      description?: string;
      attribute_type?: AttributeType;
      is_required?: boolean;
      is_active?: boolean;
      order_index?: number;
      default_value?: string;
      options?: unknown;
      validation_rules?: unknown;
    }) => {
      const { error } = await supabase
        .from('attribute_definitions')
        .update(updates as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_definitions'] });
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Atributo atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar atributo: ' + error.message);
    },
  });
}

export function useDeleteAttributeDefinition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attribute_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attribute_definitions'] });
      queryClient.invalidateQueries({ queryKey: ['attribute_families'] });
      toast.success('Atributo eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar atributo: ' + error.message);
    },
  });
}

// ============== AGENDA POINT ATTRIBUTES ==============
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

export function useUpsertAgendaPointAttribute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attribute: {
      id?: string;
      agenda_point_id: string;
      attribute_definition_id: string;
      value_text?: string | null;
      value_number?: number | null;
      value_boolean?: boolean | null;
      value_date?: string | null;
      value_json?: unknown;
    }) => {
      const { error } = await supabase
        .from('agenda_point_attributes')
        .upsert(attribute as any, { onConflict: 'id' });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agenda_point_attributes', variables.agenda_point_id] });
    },
    onError: (error) => {
      toast.error('Erro ao guardar atributo: ' + error.message);
    },
  });
}

export function useDeleteAgendaPointAttribute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, agendaPointId }: { id: string; agendaPointId: string }) => {
      const { error } = await supabase
        .from('agenda_point_attributes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return agendaPointId;
    },
    onSuccess: (agendaPointId) => {
      queryClient.invalidateQueries({ queryKey: ['agenda_point_attributes', agendaPointId] });
      toast.success('Atributo eliminado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao eliminar atributo: ' + error.message);
    },
  });
}

// ============== DASHBOARD METRICS ==============
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Get scheduled meetings (future meetings with status 'Preparação' or 'Em Curso')
      const { count: scheduledMeetings } = await supabase
        .from('meetings')
        .select('*', { count: 'exact', head: true })
        .gte('date', now);

      // Get expired follow-up actions (deadline passed, not completed/cancelled)
      const { count: expiredActions } = await supabase
        .from('actions')
        .select('*', { count: 'exact', head: true })
        .lt('deadline', now)
        .in('status', ['Por iniciar', 'Em curso']);

      // Get agenda points in scheduling phase ('Em agendamento')
      const { count: agendaPointsInScheduling } = await supabase
        .from('agenda_points')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Em agendamento');

      // Get next meeting and its agenda points count
      const { data: nextMeetings } = await supabase
        .from('meetings')
        .select('id')
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(1);
      
      let nextMeetingAgendaPoints = 0;
      if (nextMeetings && nextMeetings.length > 0) {
        const { count } = await supabase
          .from('agenda_points')
          .select('*', { count: 'exact', head: true })
          .eq('meeting_id', nextMeetings[0].id)
          .eq('status', 'Em agendamento');
        nextMeetingAgendaPoints = count || 0;
      }

      // Get total decisions and decisions with follow-up
      const { count: totalDecisions } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true });

      const { count: decisionsWithFollowup } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('has_followup', true);

      const decisionsWithFollowUpPercent = totalDecisions && totalDecisions > 0 
        ? Math.round(((decisionsWithFollowup || 0) / totalDecisions) * 100)
        : 0;

      return {
        scheduledMeetings: scheduledMeetings || 0,
        expiredActions: expiredActions || 0,
        agendaPointsInScheduling: agendaPointsInScheduling || 0,
        decisionsWithFollowUpPercent,
        nextMeetingAgendaPoints,
      };
    },
  });
}
