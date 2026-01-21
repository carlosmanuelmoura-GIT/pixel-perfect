import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
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
  Pencil,
  History,
  Users,
  MessageSquare,
  FolderOpen,
  Flag,
  Save,
  Upload,
  FileUp,
  Download,
  Trash2 as TrashIcon,
  File,
  Briefcase
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
import { Checkbox } from '@/components/ui/checkbox';
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
  useDeleteDecision,
  useAgendaPointExtraData,
  useUpsertAgendaPointExtraData,
  usePelouros,
  useAgendaPointPelouros,
  useSetAgendaPointPelouros,
  useAgendaPointAttributes,
  useUpsertAgendaPointAttribute,
  useDeleteAgendaPointAttribute
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
const criticalities: Criticality[] = ['Crítica', 'Importante', 'Normal'];
const voteModes: VoteMode[] = ['Unanimidade', 'Votação', 'Consenso'];

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Handle URL query parameter for direct point navigation
  useEffect(() => {
    const pointId = searchParams.get('point');
    if (pointId && agendaPoints.length > 0) {
      const point = agendaPoints.find(p => p.id === pointId);
      if (point) {
        setSelectedPoint(point);
        // Clear the URL param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, agendaPoints, setSearchParams]);

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

// Component for Agenda Point with all Tabs including Extra Data
function AgendaPointDetailWithDecisions({ 
  point, 
  families 
}: { 
  point: AgendaPoint; 
  families: any[] 
}) {
  const [activeTab, setActiveTab] = useState('details');
  const { data: decisions = [], isLoading: decisionsLoading } = useDecisions(point.id);
  const { data: extraData } = useAgendaPointExtraData(point.id);
  const { data: pelouros = [] } = usePelouros();
  const { data: pointPelouros = [] } = useAgendaPointPelouros(point.id);
  const { data: pointAttributes = [] } = useAgendaPointAttributes(point.id);
  const [isDecisionFormOpen, setIsDecisionFormOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [deleteDecision, setDeleteDecision] = useState<Decision | null>(null);

  const createDecision = useCreateDecision();
  const updateDecision = useUpdateDecision();
  const deleteDecisionMutation = useDeleteDecision();
  const upsertExtraData = useUpsertAgendaPointExtraData();
  const setPointPelouros = useSetAgendaPointPelouros();
  const upsertAttribute = useUpsertAgendaPointAttribute();

  // Local state for extra data form
  const [precedentes, setPrecedentes] = useState(extraData?.precedentes || '');
  const [observacoes, setObservacoes] = useState(extraData?.observacoes || '');
  
  // Selected pelouros for attendance
  const [selectedPelouros, setSelectedPelouros] = useState<string[]>([]);

  // Update local state when extra data loads
  useEffect(() => {
    if (extraData) {
      setPrecedentes(extraData.precedentes || '');
      setObservacoes(extraData.observacoes || '');
    }
  }, [extraData]);

  // Update selected pelouros when point pelouros loads
  useEffect(() => {
    if (pointPelouros) {
      setSelectedPelouros(pointPelouros.map((pp: any) => pp.pelouro_id));
    }
  }, [pointPelouros]);

  const handleDeleteDecision = async () => {
    if (deleteDecision) {
      await deleteDecisionMutation.mutateAsync(deleteDecision.id);
      setDeleteDecision(null);
    }
  };

  const handleToggleFollowup = async (decision: Decision) => {
    await updateDecision.mutateAsync({
      id: decision.id,
      has_followup: !decision.has_followup
    });
  };

  const handleSavePrecedentes = async () => {
    await upsertExtraData.mutateAsync({
      agenda_point_id: point.id,
      precedentes
    });
  };

  const handleSaveObservacoes = async () => {
    await upsertExtraData.mutateAsync({
      agenda_point_id: point.id,
      observacoes
    });
  };

  const handleSavePresencas = async () => {
    await setPointPelouros.mutateAsync({
      agendaPointId: point.id,
      pelouroIds: selectedPelouros
    });
  };

  const handleTogglePelouro = (pelouroId: string) => {
    setSelectedPelouros(prev => 
      prev.includes(pelouroId) 
        ? prev.filter(id => id !== pelouroId)
        : [...prev, pelouroId]
    );
  };

  // Filter families for DOC+ tab
  const docFamilies = families.filter(f => 
    f.name.toLowerCase().includes('doc') || 
    f.name.toLowerCase().includes('documentação')
  );

  // Other families for Detalhes tab (excluding DOC+)
  const detailFamilies = families.filter(f => 
    !f.name.toLowerCase().includes('doc') && 
    !f.name.toLowerCase().includes('documentação')
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-7 h-auto">
        <TabsTrigger value="details" className="text-xs px-2 py-2">
          <FileText className="w-3 h-3 mr-1" />
          Detalhes
        </TabsTrigger>
        <TabsTrigger value="ficha" className="text-xs px-2 py-2">
          <File className="w-3 h-3 mr-1" />
          Ficha
        </TabsTrigger>
        <TabsTrigger value="precedentes" className="text-xs px-2 py-2">
          <History className="w-3 h-3 mr-1" />
          Precedentes
        </TabsTrigger>
        <TabsTrigger value="presencas" className="text-xs px-2 py-2">
          <Users className="w-3 h-3 mr-1" />
          Presenças
        </TabsTrigger>
        <TabsTrigger value="observacoes" className="text-xs px-2 py-2">
          <MessageSquare className="w-3 h-3 mr-1" />
          Observações
        </TabsTrigger>
        <TabsTrigger value="documentacao" className="text-xs px-2 py-2">
          <FolderOpen className="w-3 h-3 mr-1" />
          DOC+
        </TabsTrigger>
        <TabsTrigger value="decisions" className="text-xs px-2 py-2">
          <Gavel className="w-3 h-3 mr-1" />
          Decisões ({decisions.length})
        </TabsTrigger>
      </TabsList>
      
      {/* Tab: Detalhes - with CRUD */}
      <TabsContent value="details" className="mt-4">
        <EditableAttributesTab 
          point={point} 
          families={detailFamilies} 
          attributes={pointAttributes}
          upsertAttribute={upsertAttribute}
        />
      </TabsContent>

      {/* Tab: Ficha do Ponto de Agenda */}
      <TabsContent value="ficha" className="mt-4">
        <FichaTab 
          point={point} 
          extraData={extraData}
          upsertExtraData={upsertExtraData}
        />
      </TabsContent>

      {/* Tab: Precedentes */}
      <TabsContent value="precedentes" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>Histórico e Precedentes</Label>
          <p className="text-sm text-muted-foreground">
            Registe informação relevante sobre precedentes e histórico deste ponto.
          </p>
          <Textarea
            value={precedentes}
            onChange={(e) => setPrecedentes(e.target.value)}
            placeholder="Descreva os precedentes relevantes..."
            className="min-h-[200px]"
          />
          <Button onClick={handleSavePrecedentes} disabled={upsertExtraData.isPending}>
            {upsertExtraData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Precedentes
          </Button>
        </div>
      </TabsContent>

      {/* Tab: Presenças - Multi-select Departamentos */}
      <TabsContent value="presencas" className="mt-4 space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Departamento(s)</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione os departamentos que participam neste ponto de agenda.
            </p>
          </div>
          
          {pelouros.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum departamento configurado</p>
              <p className="text-sm mt-1">Configure departamentos no backoffice (Administradores → Pelouros).</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {pelouros.map((pelouro) => (
                <div 
                  key={pelouro.id} 
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedPelouros.includes(pelouro.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleTogglePelouro(pelouro.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedPelouros.includes(pelouro.id)}
                      onCheckedChange={() => handleTogglePelouro(pelouro.id)}
                    />
                    <div>
                      <p className="font-medium">{pelouro.name}</p>
                      {pelouro.description && (
                        <p className="text-sm text-muted-foreground">{pelouro.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleSavePresencas} disabled={setPointPelouros.isPending}>
            {setPointPelouros.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Presenças
          </Button>
        </div>
      </TabsContent>

      {/* Tab: Observações */}
      <TabsContent value="observacoes" className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label>Observações</Label>
          <p className="text-sm text-muted-foreground">
            Notas e observações adicionais sobre este ponto de agenda.
          </p>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Adicione observações..."
            className="min-h-[200px]"
          />
          <Button onClick={handleSaveObservacoes} disabled={upsertExtraData.isPending}>
            {upsertExtraData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Observações
          </Button>
        </div>
      </TabsContent>

      {/* Tab: Documentação DOC+ - with CRUD */}
      <TabsContent value="documentacao" className="mt-4 space-y-4">
        <EditableAttributesTab 
          point={point} 
          families={docFamilies} 
          attributes={pointAttributes}
          upsertAttribute={upsertAttribute}
          emptyMessage="Nenhuma família de atributos de documentação configurada. Configure famílias com 'DOC' ou 'Documentação' no nome."
        />
      </TabsContent>
      
      {/* Tab: Decisões */}
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
              <div key={decision.id} className={cn(
                "border rounded-lg p-4 space-y-2",
                decision.has_followup && "border-l-4 border-l-primary"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-foreground">{decision.text}</p>
                      {decision.has_followup && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Flag className="w-3 h-3 mr-1" />
                          Follow-up
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{decision.type}</Badge>
                      <Badge variant="outline">{decision.criticality}</Badge>
                      <Badge variant="outline">{decision.vote_mode}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-2">
                      <Checkbox
                        id={`followup-${decision.id}`}
                        checked={decision.has_followup || false}
                        onCheckedChange={() => handleToggleFollowup(decision)}
                      />
                      <Label htmlFor={`followup-${decision.id}`} className="text-xs text-muted-foreground cursor-pointer">
                        Para Follow-up
                      </Label>
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

// Editable Attributes Tab Component for CRUD - Single Save button per tab
function EditableAttributesTab({
  point,
  families,
  attributes,
  upsertAttribute,
  emptyMessage
}: {
  point: AgendaPoint;
  families: any[];
  attributes: any[];
  upsertAttribute: any;
  emptyMessage?: string;
}) {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize local values from attributes
  useEffect(() => {
    const values: Record<string, any> = {};
    attributes.forEach((attr: any) => {
      const def = attr.attribute_definition;
      if (def) {
        if (def.attribute_type === 'boolean') {
          values[def.id] = attr.value_boolean;
        } else if (def.attribute_type === 'number' || def.attribute_type === 'currency') {
          values[def.id] = attr.value_number;
        } else if (def.attribute_type === 'date' || def.attribute_type === 'datetime') {
          values[def.id] = attr.value_date;
        } else {
          values[def.id] = attr.value_text;
        }
      }
    });
    setLocalValues(values);
  }, [attributes]);

  // Get all active definitions from all families
  const allDefinitions = families.flatMap((family: any) => 
    (family.definitions || []).filter((d: any) => d.is_active)
  );

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Save all attributes with values
      for (const def of allDefinitions) {
        const value = localValues[def.id];
        if (value === undefined || value === null || value === '') continue;
        
        const existingAttr = attributes.find((a: any) => a.attribute_definition_id === def.id);
        
        await upsertAttribute.mutateAsync({
          id: existingAttr?.id,
          agenda_point_id: point.id,
          attribute_definition_id: def.id,
          value_text: ['text', 'textarea', 'url', 'email', 'select'].includes(def.attribute_type) ? value : null,
          value_number: ['number', 'currency'].includes(def.attribute_type) ? Number(value) : null,
          value_boolean: def.attribute_type === 'boolean' ? Boolean(value) : null,
          value_date: ['date', 'datetime'].includes(def.attribute_type) ? value : null,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (families.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>{emptyMessage || 'Nenhuma família de atributos configurada'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {families.map((family: any) => {
        const definitions = family.definitions || [];
        if (definitions.length === 0) return null;
        
        return (
          <div key={family.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">{family.name}</h4>
              {family.description && (
                <span className="text-sm text-muted-foreground">- {family.description}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {definitions.filter((d: any) => d.is_active).map((def: any) => (
                <div key={def.id} className="space-y-2">
                  <Label htmlFor={def.id} className="flex items-center gap-1">
                    {def.label}
                    {def.is_required && <span className="text-destructive">*</span>}
                  </Label>
                  {def.description && (
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  )}
                  
                  {/* Render field based on type */}
                  {def.attribute_type === 'textarea' ? (
                    <Textarea
                      id={def.id}
                      value={localValues[def.id] || ''}
                      onChange={(e) => setLocalValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                      placeholder={def.description || `Digite ${def.label}...`}
                      className="min-h-[80px]"
                    />
                  ) : def.attribute_type === 'boolean' ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={def.id}
                        checked={localValues[def.id] || false}
                        onCheckedChange={(checked) => setLocalValues(prev => ({ ...prev, [def.id]: checked }))}
                      />
                      <Label htmlFor={def.id} className="text-sm cursor-pointer">
                        {def.label}
                      </Label>
                    </div>
                  ) : def.attribute_type === 'select' && def.options?.options ? (
                    <Select
                      value={localValues[def.id] || ''}
                      onValueChange={(v) => setLocalValues(prev => ({ ...prev, [def.id]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${def.label}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {def.options.options.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : def.attribute_type === 'number' || def.attribute_type === 'currency' ? (
                    <Input
                      id={def.id}
                      type="number"
                      value={localValues[def.id] || ''}
                      onChange={(e) => setLocalValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                      placeholder={def.description || `Digite ${def.label}...`}
                    />
                  ) : def.attribute_type === 'date' || def.attribute_type === 'datetime' ? (
                    <Input
                      id={def.id}
                      type={def.attribute_type === 'datetime' ? 'datetime-local' : 'date'}
                      value={localValues[def.id] || ''}
                      onChange={(e) => setLocalValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      id={def.id}
                      type={def.attribute_type === 'email' ? 'email' : def.attribute_type === 'url' ? 'url' : 'text'}
                      value={localValues[def.id] || ''}
                      onChange={(e) => setLocalValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                      placeholder={def.description || `Digite ${def.label}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {/* Single Save button at the bottom of the tab */}
      <div className="pt-4 border-t">
        <Button onClick={handleSaveAll} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}

// Ficha Tab Component - For uploading Word documents
function FichaTab({
  point,
  extraData,
  upsertExtraData
}: {
  point: AgendaPoint;
  extraData: any;
  upsertExtraData: any;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentFilePath = extraData?.ficha_file_path;
  const hasFile = !!currentFilePath;
  
  const getFileName = (path: string) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only Word documents
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor selecione um documento Word (.doc ou .docx)');
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${point.id}/${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('agenda-point-files')
        .upload(filePath, file, { upsert: true });
      
      if (error) throw error;

      // Save file path to extra data
      await upsertExtraData.mutateAsync({
        agenda_point_id: point.id,
        ficha_file_path: data.path
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erro ao carregar ficheiro');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (!currentFilePath) return;
    
    const { data, error } = await supabase.storage
      .from('agenda-point-files')
      .download(currentFilePath);
    
    if (error) {
      console.error('Download error:', error);
      alert('Erro ao descarregar ficheiro');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(currentFilePath);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!currentFilePath) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.storage
        .from('agenda-point-files')
        .remove([currentFilePath]);
      
      if (error) throw error;

      // Clear file path from extra data
      await upsertExtraData.mutateAsync({
        agenda_point_id: point.id,
        ficha_file_path: null
      });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro ao eliminar ficheiro');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Ficha do Ponto de Agenda</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Carregue o documento Word preparado pela equipa do secretariado.
        </p>
      </div>

      {hasFile ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <File className="w-10 h-10 text-primary" />
            <div className="flex-1">
              <p className="font-medium">{getFileName(currentFilePath)}</p>
              <p className="text-sm text-muted-foreground">Documento Word</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Descarregar
            </Button>
            <Button 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TrashIcon className="w-4 h-4 mr-2" />}
              Eliminar
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <Label className="text-sm text-muted-foreground">Substituir ficheiro</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleUpload}
              className="mt-2 block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                file:cursor-pointer cursor-pointer"
              disabled={isUploading}
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <FileUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Arraste um documento Word ou clique para selecionar
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleUpload}
            className="hidden"
            id="ficha-upload"
            disabled={isUploading}
          />
          <Button asChild disabled={isUploading}>
            <label htmlFor="ficha-upload" className="cursor-pointer">
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? 'A carregar...' : 'Selecionar Ficheiro'}
            </label>
          </Button>
        </div>
      )}
    </div>
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
    criticality: 'Normal' as Criticality,
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
        criticality: 'Normal',
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
