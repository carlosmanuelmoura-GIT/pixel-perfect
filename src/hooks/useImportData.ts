import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface TableSchema {
  name: string;
  columns: {
    name: string;
    type: string;
    required: boolean;
  }[];
}

export interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errorCount: number;
  errors: string[];
  previewData: Record<string, unknown>[];
}

export interface ImportResult {
  success: boolean;
  importId: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
}

export interface ImportHistoryItem {
  id: string;
  user_id: string;
  table_name: string;
  file_name: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';
  errors: string[];
  imported_ids: string[];
  created_at: string;
  completed_at: string | null;
  rolled_back_at: string | null;
}

export function useImportData() {
  const [isLoading, setIsLoading] = useState(false);
  const [tables, setTables] = useState<TableSchema[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'get-tables' },
      });

      if (error) throw error;
      setTables(data.tables);
      return data.tables;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter tabelas';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplate = async (tableName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'get-template', tableName },
      });

      if (error) throw error;
      return data.template;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter template';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const validateData = async (
    tableName: string, 
    data: Record<string, unknown>[], 
    columnMapping?: Record<string, string>
  ): Promise<ValidationResult | null> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'validate', tableName, data, columnMapping },
      });

      if (error) throw error;
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao validar dados';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const importData = async (
    tableName: string, 
    data: Record<string, unknown>[], 
    fileName: string,
    columnMapping?: Record<string, string>
  ): Promise<ImportResult | null> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'import', tableName, data, fileName, columnMapping },
      });

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [tableName] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });

      toast({
        title: 'Importação concluída',
        description: `${result.successCount} de ${result.totalRows} registos importados com sucesso.`,
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao importar dados';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const rollbackImport = async (importId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'rollback', importId },
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['import-history'] });

      toast({
        title: 'Rollback concluído',
        description: `${result.rolledBackCount} registos revertidos.`,
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao reverter importação';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getHistory = async (): Promise<ImportHistoryItem[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-data', {
        body: { action: 'history' },
      });

      if (error) throw error;
      return data.history;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao obter histórico';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    tables,
    fetchTables,
    getTemplate,
    validateData,
    importData,
    rollbackImport,
    getHistory,
  };
}
