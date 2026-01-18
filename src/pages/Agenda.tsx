import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Plus, 
  Filter,
  Loader2,
  ChevronRight,
  Lock,
  MoreHorizontal,
  Calendar,
  User,
  FileText,
  Gavel,
  Trash2,
  Pencil
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  useAgendaPoints, 
  useMeetings, 
  useAttributeFamilies, 
  useAdministrators,
  useCreateAgendaPoint,
  useUpdateAgendaPoint,
  useDeleteAgendaPoint,
  useDecisions,
  useCreateDecision,
  useUpdateDecision,
  useDeleteDecision
} from '@/hooks/useSupabaseData';
import { AgendaPointDetail } from '@/components/agenda/AgendaPointDetail';
import type { AgendaPoint, AgendaPointStatus, Priority, PointType, Decision, DecisionType, Criticality, VoteMode } from '@/types/database';
import { cn } from '@/lib/utils';

const statusStyles: Record<AgendaPointStatus, { label: string; color: string }> = {
  'Em agendamento': { label: 'Em Agendamento', color: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
  'Agendado': { label: 'Agendado', color: 'bg-status-info/10 text-status-info border-status-info/20' },
  'Deliberado': { label: 'Deliberado', color: 'bg-status-success/10 text-status-success border-status-success/20' },
};

const priorityStyles: Record<Priority, string> = {
  'Alta': 'bg-status-critical/10 text-status-critical border-status-critical/20',
  'Média': 'bg-status-warning/10 text-status-warning border-status-warning/20',
  'Baixa': 'bg-muted text-muted-foreground border-border',
};

const pointTypeStyles: Record<PointType, { icon: typeof FileText; color: string }> = {
  'Informação': { icon: FileText, color: 'text-status-info' },
  'Para Decisão': { icon: Gavel, color: 'text-status-warning' },
};

const decisionTypes: DecisionType[] = ['Estratégica', 'Táctica', 'Operacional', 'Tomada de Conhecimento'];
const criticalities: Criticality[] = ['Crítica', 'Importante', 'Rotina'];
const voteModes: VoteMode[] = ['Unanimidade', 'Votação', 'Consenso'];

export default function Agenda() {
  const [meetingFilter, setMeetingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPoint, setSelectedPoint] = useState<AgendaPoint | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<AgendaPoint | null>(null);
  const [deletePoint, setDeletePoint] = useState<AgendaPoint | null>(null);
  
  const { data: agendaPoints = [], isLoading } = useAgendaPoints();
  const { data: meetings = [] } = useMeetings();
  const { data: families = [] } = useAttributeFamilies();
  const { data: administrators = [] } = useAdministrators();
  
  const createPoint = useCreateAgendaPoint();
  const updatePoint = useUpdateAgendaPoint();
  const deletePointMutation = useDeleteAgendaPoint();

  const filteredPoints = useMemo(() => {
    return agendaPoints.filter(point => {
      if (meetingFilter !== 'all' && point.meeting_id !== meetingFilter) return false;
      if (statusFilter !== 'all' && point.status !== statusFilter) return false;
      return true;
    });
  }, [agendaPoints, meetingFilter, statusFilter]);

  const pointsByMeeting = useMemo(() => {
    const grouped = new Map<string, { meeting: AgendaPoint['meeting']; points: AgendaPoint[] }>();
    
    filteredPoints.forEach(point => {
      const meetingId = point.meeting_id;
      if (!grouped.has(meetingId)) {
        grouped.set(meetingId, { meeting: point.meeting, points: [] });
      }
      grouped.get(meetingId)!.points.push(point);
    });
    
    return Array.from(grouped.values()).sort((a, b) => {
      const dateA = a.meeting?.date ? new Date(a.meeting.date).getTime() : 0;
      const dateB = b.meeting?.date ? new Date(b.meeting.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredPoints]);

  const handleCreate = () => {
    setEditingPoint(null);
    setIsFormOpen(true);
  };

  const handleEdit = (point: AgendaPoint) => {
    setEditingPoint(point);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletePoint) {
      await deletePointMutation.mutateAsync(deletePoint.id);
      setDeletePoint(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Pontos de Agenda" subtitle="Gestão dos pontos de agenda das reuniões">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pontos de Agenda" subtitle="Gestão dos pontos de agenda das reuniões">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={meetingFilter} onValueChange={setMeetingFilter}>
              <SelectTrigger className="w-[220px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Reunião" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as reuniões</SelectItem>
                {meetings.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.type} - {format(new Date(m.date), "dd/MM/yyyy", { locale: pt })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {Object.entries(statusStyles).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Novo Ponto
          </Button>
        </div>

        <div className="space-y-6">
          {pointsByMeeting.map(({ meeting, points }) => (
            <div key={meeting?.id || 'unknown'} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    {meeting?.type} - {meeting?.date ? format(new Date(meeting.date), "d 'de' MMMM 'de' yyyy", { locale: pt }) : 'Data desconhecida'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{meeting?.location}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">{points.length} pontos</Badge>
              </div>

              <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
                <div className="divide-y divide-border/50">
                  {points.map((point, index) => (
                    <AgendaPointRow 
                      key={point.id} 
                      point={point} 
                      index={index}
                      onClick={() => setSelectedPoint(point)}
                      onEdit={() => handleEdit(point)}
                      onDelete={() => setDeletePoint(point)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {pointsByMeeting.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ponto de agenda encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog with Decisions Tab */}
      <Dialog open={!!selectedPoint} onOpenChange={(open) => !open && setSelectedPoint(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPoint?.is_confidential && <Lock className="w-4 h-4 text-status-warning" />}
              {selectedPoint?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedPoint && (
            <AgendaPointDetailWithDecisions point={selectedPoint} families={families} />
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form */}
      <AgendaPointForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        point={editingPoint}
        meetings={meetings}
        administrators={administrators}
        onCreate={createPoint.mutateAsync}
        onUpdate={updatePoint.mutateAsync}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePoint} onOpenChange={(open) => !open && setDeletePoint(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Ponto de Agenda</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{deletePoint?.title}"? Esta ação não pode ser revertida.
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

// Component for Agenda Point with Decisions Tab
function AgendaPointDetailWithDecisions({ 
  point, 
  families 
}: { 
  point: AgendaPoint; 
  families: any[] 
}) {
  const [activeTab, setActiveTab] = useState('details');
  const { data: decisions = [], isLoading: decisionsLoading } = useDecisions(point.id);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deleteDecision, setDeleteDecision] = useState<Decision | null>(null);

  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const deleteDecisionMutation = useDeleteDecision();

  const handleDeleteDecision = async () => {
    if (deleteDecision) {
      await deleteDecisionMutation.mutateAsync(deleteDecision.id);
      setDeleteDecision(null);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="decisions">Decisões ({decisions.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="mt-4">
        <AgendaPointDetail point={point} families={families} />
      </TabsContent>
      
      <TabsContent value="decisions" className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-foreground">Decisões associadas</h4>
          <Button size="sm" onClick={() => { setEditingDecision(null); setIsDecisionFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Decisão
          </Button>
        </div>

        {decisionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gavel className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma decisão registada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div key={decision.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{decision.text}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{decision.type}</Badge>
                      <Badge variant="outline">{decision.criticality}</Badge>
                      <Badge variant="outline">{decision.vote_mode}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingDecision(decision); setIsDecisionFormOpen(true); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteDecision(decision)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {decision.deliberation && (
                  <p className="text-sm text-muted-foreground">{decision.deliberation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <DecisionForm
          open={isDecisionFormOpen}
          onOpenChange={setIsDecisionFormOpen}
          decision={editingDecision}
          agendaPointId={point.id}
          onCreate={createDecision.mutateAsync}
          onUpdate={updateDecision.mutateAsync}
        />

        <AlertDialog open={!!deleteDecision} onOpenChange={(open) => !open && setDeleteDecision(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Decisão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja eliminar esta decisão? Esta ação não pode ser revertida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDecision} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TabsContent>
    </Tabs>
  );
}

// Agenda Point Form
function AgendaPointForm({
  open,
  onOpenChange,
  point,
  meetings,
  administrators,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  point: AgendaPoint | null;
  meetings: any[];
  administrators: any[];
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    meeting_id: '',
    title: '',
    subject: '',
    description: '',
    background: '',
    proposer_id: '',
    priority: 'Média' as Priority,
    point_type: 'Para Decisão' as PointType,
    status: 'Em agendamento' as AgendaPointStatus,
    is_confidential: false,
  });

  useMemo(() => {
    if (point) {
      setFormData({
        meeting_id: point.meeting_id,
        title: point.title,
        subject: point.subject,
        description: point.description || '',
        background: point.background || '',
        proposer_id: point.proposer_id || '',
        priority: point.priority,
        point_type: point.point_type,
        status: point.status,
        is_confidential: point.is_confidential,
      });
    } else {
      setFormData({
        meeting_id: meetings[0]?.id || '',
        title: '',
        subject: '',
        description: '',
        background: '',
        proposer_id: '',
        priority: 'Média',
        point_type: 'Para Decisão',
        status: 'Em agendamento',
        is_confidential: false,
      });
    }
  }, [point, open, meetings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (point) {
      await onUpdate({ id: point.id, ...formData });
    } else {
      await onCreate(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{point ? 'Editar Ponto de Agenda' : 'Novo Ponto de Agenda'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_id">Reunião *</Label>
              <Select value={formData.meeting_id} onValueChange={(v) => setFormData(f => ({ ...f, meeting_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a reunião" />
                </SelectTrigger>
                <SelectContent>
                  {meetings.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.type} - {format(new Date(m.date), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposer_id">Proponente</Label>
              <Select value={formData.proposer_id} onValueChange={(v) => setFormData(f => ({ ...f, proposer_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o proponente" />
                </SelectTrigger>
                <SelectContent>
                  {administrators.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Textarea
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(f => ({ ...f, subject: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData(f => ({ ...f, priority: v as Priority }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.point_type} onValueChange={(v) => setFormData(f => ({ ...f, point_type: v as PointType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Informação">Informação</SelectItem>
                  <SelectItem value="Para Decisão">Para Decisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v as AgendaPointStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em agendamento">Em Agendamento</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                  <SelectItem value="Deliberado">Deliberado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_confidential"
              checked={formData.is_confidential}
              onCheckedChange={(checked) => setFormData(f => ({ ...f, is_confidential: checked }))}
            />
            <Label htmlFor="is_confidential">Confidencial</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {point ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Decision Form
function DecisionForm({
  open,
  onOpenChange,
  decision,
  agendaPointId,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decision: Decision | null;
  agendaPointId: string;
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    text: '',
    type: 'Operacional' as DecisionType,
    criticality: 'Rotina' as Criticality,
    vote_mode: 'Consenso' as VoteMode,
    deliberation: '',
    background: '',
  });

  useMemo(() => {
    if (decision) {
      setFormData({
        text: decision.text,
        type: decision.type,
        criticality: decision.criticality,
        vote_mode: decision.vote_mode,
        deliberation: decision.deliberation || '',
        background: decision.background || '',
      });
    } else {
      setFormData({
        text: '',
        type: 'Operacional',
        criticality: 'Rotina',
        vote_mode: 'Consenso',
        deliberation: '',
        background: '',
      });
    }
  }, [decision, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision) {
      await onUpdate({ id: decision.id, ...formData });
    } else {
      await onCreate({ agenda_point_id: agendaPointId, ...formData });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{decision ? 'Editar Decisão' : 'Nova Decisão'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Texto da Decisão *</Label>
            <Textarea
              id="text"
              value={formData.text}
              onChange={(e) => setFormData(f => ({ ...f, text: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v as DecisionType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {decisionTypes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
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
            <div className="space-y-2">
              <Label>Votação</Label>
              <Select value={formData.vote_mode} onValueChange={(v) => setFormData(f => ({ ...f, vote_mode: v as VoteMode }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voteModes.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliberation">Deliberação</Label>
            <Textarea
              id="deliberation"
              value={formData.deliberation}
              onChange={(e) => setFormData(f => ({ ...f, deliberation: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {decision ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgendaPointRow({ 
  point, 
  index,
  onClick,
  onEdit,
  onDelete,
}: { 
  point: AgendaPoint; 
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle = statusStyles[point.status];
  const priorityStyle = priorityStyles[point.priority];
  const TypeIcon = pointTypeStyles[point.point_type]?.icon || FileText;

  return (
    <div 
      className={cn(
        "p-4 hover:bg-muted/30 transition-colors cursor-pointer animate-slide-up",
        point.is_confidential && "border-l-2 border-l-status-warning"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted flex-shrink-0">
          <span className="text-sm font-medium text-muted-foreground">{point.order}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {point.is_confidential && <Lock className="w-3.5 h-3.5 text-status-warning" />}
            <h4 className="text-sm font-medium text-foreground truncate">{point.title}</h4>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{point.subject}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {point.proposer?.name || 'Sem proponente'}
            </span>
            <span className="flex items-center gap-1">
              <TypeIcon className={cn("w-3.5 h-3.5", pointTypeStyles[point.point_type]?.color || 'text-muted-foreground')} />
              {point.point_type}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant="outline" className={cn("text-xs", priorityStyle)}>
            {point.priority}
          </Badge>
          <Badge variant="outline" className={cn("text-xs", statusStyle.color)}>
            {statusStyle.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
