import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type DeliverableStatus = 'Em trabalho' | 'Entregue';

export interface Entregavel {
  id: string;
  grupo_trabalho_id: string;
  codigo: string | null;
  descricao: string;
  ponto_situacao: string | null;
  decisor: string | null;
  data_entregavel: string | null;
  num_doc_plus: string | null;
  divulgar_entregavel: boolean;
  criacao: boolean;
  encerramento: boolean;
  link_doc: string | null;
  notas_secap: string | null;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
}

export function useEntregaveis(grupoTrabalhoId?: string) {
  return useQuery({
    queryKey: ['entregaveis', grupoTrabalhoId],
    queryFn: async () => {
      let query = supabase
        .from('entregaveis')
        .select('*')
        .order('created_at', { ascending: true });

      if (grupoTrabalhoId) {
        query = query.eq('grupo_trabalho_id', grupoTrabalhoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Entregavel[];
    },
  });
}

export function useCreateEntregavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entregavel: Omit<Entregavel, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('entregaveis')
        .insert(entregavel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregaveis'] });
      toast({
        title: 'Entregável criado',
        description: 'O entregável foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar entregável',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateEntregavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Entregavel> & { id: string }) => {
      const { data, error } = await supabase
        .from('entregaveis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregaveis'] });
      toast({
        title: 'Entregável atualizado',
        description: 'O entregável foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar entregável',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteEntregavel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('entregaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entregaveis'] });
      toast({
        title: 'Entregável eliminado',
        description: 'O entregável foi eliminado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao eliminar entregável',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
