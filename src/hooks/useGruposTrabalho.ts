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
  created_at: string;
  updated_at: string;
}

export function useGruposTrabalho() {
  return useQuery({
    queryKey: ['grupos-trabalho'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grupos_trabalho')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GrupoTrabalho[];
    },
  });
}

export function useCreateGrupoTrabalho() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grupo: Omit<GrupoTrabalho, 'id' | 'created_at' | 'updated_at'>) => {
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
      const { data, error } = await supabase
        .from('grupos_trabalho')
        .update(updates)
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
