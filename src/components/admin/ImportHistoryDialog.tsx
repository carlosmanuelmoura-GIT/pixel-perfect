import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  History, 
  Loader2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  Undo2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useImportData, ImportHistoryItem } from '@/hooks/useImportData';
import { cn } from '@/lib/utils';

interface ImportHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tableLabels: Record<string, string> = {
  administrators: 'Administradores',
  pelouros: 'Departamentos',
  meetings: 'Reuniões',
  agenda_points: 'Pontos de Agenda',
  decisions: 'Decisões',
  actions: 'Ações',
  protocols: 'Protocolos',
  grupos_trabalho: 'Grupos de Trabalho',
  entregaveis: 'Entregáveis',
};

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-muted text-muted-foreground' },
  processing: { label: 'A processar', icon: Loader2, className: 'bg-status-info/10 text-status-info' },
  completed: { label: 'Concluído', icon: CheckCircle2, className: 'bg-status-success/10 text-status-success' },
  failed: { label: 'Falhado', icon: XCircle, className: 'bg-status-critical/10 text-status-critical' },
  rolled_back: { label: 'Revertido', icon: Undo2, className: 'bg-status-warning/10 text-status-warning' },
};

export function ImportHistoryDialog({ open, onOpenChange }: ImportHistoryDialogProps) {
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [rollbackItem, setRollbackItem] = useState<ImportHistoryItem | null>(null);
  const { isLoading, getHistory, rollbackImport } = useImportData();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data);
  };

  const handleRollback = async () => {
    if (!rollbackItem) return;
    
    const success = await rollbackImport(rollbackItem.id);
    if (success) {
      await loadHistory();
    }
    setRollbackItem(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Importações
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhuma importação encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Ficheiro</TableHead>
                    <TableHead>Registos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const status = statusConfig[item.status];
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(item.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {tableLabels[item.table_name] || item.table_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {item.file_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-status-success">{item.success_count}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{item.total_rows}</span>
                            {item.error_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {item.error_count} erros
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", status.className)}>
                            <StatusIcon className={cn("w-3 h-3", item.status === 'processing' && "animate-spin")} />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status === 'completed' && item.imported_ids && (item.imported_ids as string[]).length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRollbackItem(item)}
                              className="text-status-warning hover:text-status-warning"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Reverter
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rollback Confirmation */}
      <AlertDialog open={!!rollbackItem} onOpenChange={(open) => !open && setRollbackItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-status-warning" />
              Reverter Importação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja reverter esta importação? Esta ação irá eliminar{' '}
              <strong>{rollbackItem?.success_count}</strong> registos da tabela{' '}
              <strong>{tableLabels[rollbackItem?.table_name || ''] || rollbackItem?.table_name}</strong>.
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              className="bg-status-warning text-white hover:bg-status-warning/90"
            >
              Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
