import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type WorkGroupStatus = 'aberto' | 'inativo' | 'fechado';

export interface GrupoTrabalho {
  id: string;
  codigo: string;
  status: WorkGroupStatus;
  designacao: string;
  tema: string | null;
  divulgar_existencia: boolean;
  observacoes_secap: string | null;
  criacao_meeting_id: string | null;
  criacao_agenda_point_id: string | null;
  criacao_decision_id: string | null;
  fecho_meeting_id: string | null;
  fecho_agenda_point_id: string | null;
  fecho_decision_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  criacao_meeting?: { id: string; date: string; type: string } | null;
  criacao_agenda_point?: { id: string; title: string } | null;
  criacao_decision?: { id: string; text: string } | null;
  fecho_meeting?: { id: string; date: string; type: string } | null;
  fecho_agenda_point?: { id: string; title: string } | null;
  fecho_decision?: { id: string; text: string } | null;
}

export function useGruposTrabalho() {
  return useQuery({
    queryKey: ['grupos-trabalho'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos_trabalho')
        .select(`
          *,
          criacao_meeting:meetings!grupos_trabalho_criacao_meeting_id_fkey(id, date, type),
          criacao_agenda_point:agenda_points!grupos_trabalho_criacao_agenda_point_id_fkey(id, title),
          criacao_decision:decisions!grupos_trabalho_criacao_decision_id_fkey(id, text),
          fecho_meeting:meetings!grupos_trabalho_fecho_meeting_id_fkey(id, date, type),
          fecho_agenda_point:agenda_points!grupos_trabalho_fecho_agenda_point_id_fkey(id, title),
          fecho_decision:decisions!grupos_trabalho_fecho_decision_id_fkey(id, text)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GrupoTrabalho[];
    },
  });
}

export function useCreateGrupoTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grupo: Omit<GrupoTrabalho, 'id' | 'created_at' | 'updated_at' | 'criacao_meeting' | 'criacao_agenda_point' | 'criacao_decision' | 'fecho_meeting' | 'fecho_agenda_point' | 'fecho_decision'>) => {
      const { data, error } = await supabase
        .from('grupos_trabalho')
        .insert(grupo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-trabalho'] });
      toast({
        title: 'Grupo criado',
        description: 'O grupo de trabalho foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar grupo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGrupoTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GrupoTrabalho> & { id: string }) => {
      // Remove joined data before update
      const { criacao_meeting, criacao_agenda_point, criacao_decision, fecho_meeting, fecho_agenda_point, fecho_decision, ...cleanUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from('grupos_trabalho')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-trabalho'] });
      toast({
        title: 'Grupo atualizado',
        description: 'O grupo de trabalho foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar grupo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGrupoTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grupos_trabalho')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grupos-trabalho'] });
      queryClient.invalidateQueries({ queryKey: ['entregaveis'] });
      toast({
        title: 'Grupo eliminado',
        description: 'O grupo de trabalho foi eliminado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao eliminar grupo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
