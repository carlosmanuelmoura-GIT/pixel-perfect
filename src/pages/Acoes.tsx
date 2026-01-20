import { useState, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Plus, 
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  MoreHorizontal,
  User,
  Loader2,
  Pencil,
  Trash2,
  FileText,
  Gavel,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useActions, 
  usePelouros, 
  useAdministrators,
  useDecisions,
  useCreateAction,
  useUpdateAction,
  useDeleteAction
} from '@/hooks/useSupabaseData';
import type { Action, ActionStatus, Criticality, Decision } from '@/types/database';
import { cn } from '@/lib/utils';

const statusConfig: Record<ActionStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'Por iniciar': { label: 'Por Iniciar', icon: Clock, color: 'text-status-neutral', bgColor: 'bg-muted' },
  'Em curso': { label: 'Em Curso', icon: Clock, color: 'text-status-info', bgColor: 'bg-status-info/10' },
  'Concluída': { label: 'Concluída', icon: CheckCircle, color: 'text-status-success', bgColor: 'bg-status-success/10' },
  'Bloqueada': { label: 'Bloqueada', icon: Pause, color: 'text-status-warning', bgColor: 'bg-status-warning/10' },
  'Cancelada': { label: 'Cancelada', icon: XCircle, color: 'text-status-neutral', bgColor: 'bg-muted' },
};

const criticalityStyles: Record<Criticality, string> = {
  'Crítica': 'bg-status-critical/10 text-status-critical border-status-critical/20',
  'Importante': 'bg-status-warning/10 text-status-warning border-status-warning/20',
  'Normal': 'bg-muted text-muted-foreground border-border',
};

const kanbanColumns: ActionStatus[] = ['Por iniciar', 'Em curso', 'Concluída'];
const actionStatuses: ActionStatus[] = ['Por iniciar', 'Em curso', 'Concluída', 'Bloqueada', 'Cancelada'];
const criticalities: Criticality[] = ['Crítica', 'Importante', 'Normal'];

export default function Acoes() {
  const [pelouroFilter, setPelouroFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [deleteAction, setDeleteAction] = useState<Action | null>(null);
  
  const { data: actions = [], isLoading } = useActions();
  const { data: pelouros = [] } = usePelouros();
  const { data: administrators = [] } = useAdministrators();
  const { data: decisions = [] } = useDecisions();
  
  const createAction = useCreateAction();
  const updateAction = useUpdateAction();
  const deleteActionMutation = useDeleteAction();

  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      if (pelouroFilter !== 'all' && action.pelouro?.id !== pelouroFilter) return false;
      return true;
    });
  }, [actions, pelouroFilter]);

  const getActionsByStatus = (status: ActionStatus) => 
    filteredActions.filter(a => a.status === status);

  const handleCreate = () => {
    setEditingAction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (action: Action) => {
    setEditingAction(action);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteAction) {
      await deleteActionMutation.mutateAsync(deleteAction.id);
      setDeleteAction(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Ações em Follow-up" subtitle="Acompanhamento das ações resultantes das decisões">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Ações em Follow-up" subtitle="Acompanhamento das ações resultantes das decisões">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={pelouroFilter} onValueChange={setPelouroFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pelouro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pelouros</SelectItem>
                {pelouros.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-none"
              >
                Kanban
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                Lista
              </Button>
            </div>
          </div>

          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Nova Ação
          </Button>
        </div>

        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kanbanColumns.map(status => {
              const config = statusConfig[status];
              const columnActions = getActionsByStatus(status);
              
              return (
                <div key={status} className="kanban-column">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <config.icon className={cn("w-5 h-5", config.color)} />
                    <h3 className="font-semibold text-foreground">{config.label}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {columnActions.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {columnActions.map((action, index) => (
                      <ActionCard 
                        key={action.id} 
                        action={action} 
                        index={index}
                        onEdit={() => handleEdit(action)}
                        onDelete={() => setDeleteAction(action)}
                      />
                    ))}
                    
                    {columnActions.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Sem ações
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
            <div className="divide-y divide-border/50">
              {filteredActions.map((action, index) => (
                <ActionRow 
                  key={action.id} 
                  action={action} 
                  index={index}
                  onEdit={() => handleEdit(action)}
                  onDelete={() => setDeleteAction(action)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      <ActionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        action={editingAction}
        decisions={decisions}
        administrators={administrators}
        pelouros={pelouros}
        onCreate={createAction.mutateAsync}
        onUpdate={updateAction.mutateAsync}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAction} onOpenChange={(open) => !open && setDeleteAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta ação? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

// Action Form Component with Decision Info
function ActionForm({
  open,
  onOpenChange,
  action,
  decisions,
  administrators,
  pelouros,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Action | null;
  decisions: Decision[];
  administrators: any[];
  pelouros: any[];
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    decision_id: '',
    description: '',
    responsible_name: '',
    pelouro_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    deadline: '',
    status: 'Por iniciar' as ActionStatus,
    progress: 0,
    criticality: 'Normal' as Criticality,
  });
  const [activeTab, setActiveTab] = useState('form');

  // Only show decisions marked for follow-up
  const followUpDecisions = useMemo(() => 
    decisions.filter(d => d.has_followup), 
    [decisions]
  );

  useMemo(() => {
    if (action) {
      setFormData({
        decision_id: action.decision_id,
        description: action.description,
        responsible_name: action.responsible_name || '',
        pelouro_id: action.pelouro_id || '',
        start_date: format(new Date(action.start_date), 'yyyy-MM-dd'),
        deadline: format(new Date(action.deadline), 'yyyy-MM-dd'),
        status: action.status,
        progress: action.progress,
        criticality: action.criticality,
      });
    } else {
      setFormData({
        decision_id: followUpDecisions[0]?.id || '',
        description: '',
        responsible_name: '',
        pelouro_id: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        deadline: '',
        status: 'Por iniciar',
        progress: 0,
        criticality: 'Normal',
      });
    }
  }, [action, open, followUpDecisions]);

  const selectedDecision = decisions.find(d => d.id === formData.decision_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      deadline: new Date(formData.deadline).toISOString(),
      responsible_name: formData.responsible_name || null,
      pelouro_id: formData.pelouro_id || null,
    };
    
    if (action) {
      await onUpdate({ id: action.id, ...data });
    } else {
      await onCreate(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Dados da Ação</TabsTrigger>
            <TabsTrigger value="decision">Decisão/Ponto Associado</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="decision_id">Decisão Associada *</Label>
                {followUpDecisions.length === 0 ? (
                  <div className="p-3 border rounded-md bg-muted/50 text-sm text-muted-foreground">
                    Nenhuma decisão marcada para follow-up. Marque decisões como "Para Follow-up" nos pontos de agenda primeiro.
                  </div>
                ) : (
                  <Select value={formData.decision_id} onValueChange={(v) => setFormData(f => ({ ...f, decision_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a decisão" />
                    </SelectTrigger>
                    <SelectContent>
                      {followUpDecisions.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.text.substring(0, 60)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible_name">Pessoa Responsável *</Label>
                  <Input
                    id="responsible_name"
                    value={formData.responsible_name}
                    onChange={(e) => setFormData(f => ({ ...f, responsible_name: e.target.value }))}
                    placeholder="Nome da pessoa responsável"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departamento *</Label>
                  <Select value={formData.pelouro_id} onValueChange={(v) => setFormData(f => ({ ...f, pelouro_id: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {pelouros.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(f => ({ ...f, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(f => ({ ...f, deadline: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v as ActionStatus }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionStatuses.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Criticidade</Label>
                  <Select value={formData.criticality} onValueChange={(v) => setFormData(f => ({ ...f, criticality: v as Criticality }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {criticalities.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Progresso</Label>
                  <span className="text-sm text-muted-foreground">{formData.progress}%</span>
                </div>
                <Slider
                  value={[formData.progress]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, progress: v }))}
                  max={100}
                  step={5}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {action ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="decision" className="mt-4 space-y-4">
            {selectedDecision ? (
              <>
                {/* Decision Info */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gavel className="w-4 h-4" />
                    <span className="font-medium">Decisão</span>
                  </div>
                  <p className="text-foreground">{selectedDecision.text}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedDecision.type}</Badge>
                    <Badge variant="outline">{selectedDecision.criticality}</Badge>
                    <Badge variant="outline">{selectedDecision.vote_mode}</Badge>
                  </div>
                  {selectedDecision.deliberation && (
                    <p className="text-sm text-muted-foreground">{selectedDecision.deliberation}</p>
                  )}
                </div>

                {/* Agenda Point Info */}
                {selectedDecision.agenda_point && (
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Ponto de Agenda</span>
                    </div>
                    <p className="font-medium text-foreground">{selectedDecision.agenda_point.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedDecision.agenda_point.subject}</p>
                    
                    {selectedDecision.agenda_point.meeting && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {selectedDecision.agenda_point.meeting.type} - {format(new Date(selectedDecision.agenda_point.meeting.date), "dd/MM/yyyy", { locale: pt })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Selecione uma decisão no formulário</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ActionCard({ action, index, onEdit, onDelete }: { action: Action; index: number; onEdit: () => void; onDelete: () => void }) {
  const now = new Date();
  const deadline = new Date(action.deadline);
  const daysUntilDeadline = differenceInDays(deadline, now);
  const isOverdue = daysUntilDeadline < 0 && action.status !== 'Concluída' && action.status !== 'Cancelada';
  const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && action.status !== 'Concluída';

  return (
    <div 
      className={cn("kanban-card animate-slide-up", isOverdue && "border-l-2 border-l-status-critical")}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant="outline" className={cn("text-xs", criticalityStyles[action.criticality])}>
          {action.criticality}
        </Badge>
        {isOverdue && <AlertTriangle className="w-4 h-4 text-status-critical" />}
      </div>
      
      <p className="text-sm font-medium text-foreground line-clamp-2 mb-3">{action.description}</p>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>{action.responsible_name || 'Sem responsável'}</span>
        </div>
        
        <span className={cn("text-xs", isOverdue && "text-status-critical font-medium", isUrgent && "text-status-warning font-medium", !isOverdue && !isUrgent && "text-muted-foreground")}>
          {isOverdue ? `${Math.abs(daysUntilDeadline)} dias em atraso` : `Prazo: ${format(deadline, "dd/MM/yyyy")}`}
        </span>
        
        {action.status !== 'Concluída' && action.status !== 'Cancelada' && (
          <div className="flex items-center gap-2">
            <Progress value={action.progress} className="h-1.5 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">{action.progress}%</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">{action.pelouro?.name || 'Sem departamento'}</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>Atualizar Progresso</DropdownMenuItem>
            <DropdownMenuItem>Ver Decisão</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ActionRow({ action, index, onEdit, onDelete }: { action: Action; index: number; onEdit: () => void; onDelete: () => void }) {
  const now = new Date();
  const deadline = new Date(action.deadline);
  const daysUntilDeadline = differenceInDays(deadline, now);
  const isOverdue = daysUntilDeadline < 0 && action.status !== 'Concluída' && action.status !== 'Cancelada';
  const config = statusConfig[action.status];
  const Icon = config.icon;

  return (
    <div className={cn("p-4 hover:bg-muted/30 transition-colors animate-slide-up", isOverdue && "border-l-2 border-l-status-critical")} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{action.description}</p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{action.responsible_name || 'Sem responsável'}</span>
            <span>•</span>
            <span>{action.pelouro?.name || 'Sem departamento'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <Badge variant="outline" className={cn("text-xs", criticalityStyles[action.criticality])}>{action.criticality}</Badge>
          <div className="w-24"><Progress value={action.progress} className="h-1.5" /></div>
          <span className={cn("text-xs w-24 text-right", isOverdue && "text-status-critical font-medium")}>{format(deadline, "dd/MM/yyyy")}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem>Atualizar Progresso</DropdownMenuItem>
              <DropdownMenuItem>Ver Decisão</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
