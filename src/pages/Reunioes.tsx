import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Calendar, 
  Plus, 
  Filter, 
  Clock, 
  MapPin, 
  Users, 
  ChevronRight,
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  useMeetings, 
  useCreateMeeting, 
  useUpdateMeeting, 
  useDeleteMeeting,
  useDuplicateMeeting,
  useAgendaPoints,
  useAdministrators 
} from '@/hooks/useSupabaseData';
import type { Meeting, MeetingStatus, MeetingType, AgendaPoint } from '@/types/database';
import { cn } from '@/lib/utils';

const meetingTypeStyles: Record<MeetingType, string> = {
  CA: 'bg-primary/10 text-primary border-primary/20',
  CEAAP: 'bg-state-proposed/10 text-state-proposed border-state-proposed/20',
  RT: 'bg-state-approved/10 text-state-approved border-state-approved/20',
};

const meetingStatusStyles: Record<MeetingStatus, string> = {
  'Preparação': 'status-warning',
  'Em Curso': 'status-info',
  'Concluída': 'status-success',
  'Publicada': 'status-neutral',
};

const meetingTypeLabels: Record<MeetingType, string> = {
  CA: 'Conselho de Administração',
  CEAAP: 'Assuntos Administrativos',
  RT: 'Reunião de Trabalho',
};

const meetingTypes: MeetingType[] = ['CA', 'CEAAP', 'RT'];
const meetingStatuses: MeetingStatus[] = ['Preparação', 'Em Curso', 'Concluída', 'Publicada'];

export default function Reunioes() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [duplicateMeetingData, setDuplicateMeetingData] = useState<{ meeting: Meeting; newDate: string } | null>(null);
  
  const { data: meetings = [], isLoading } = useMeetings();
  const createMeeting = useCreateMeeting();
  const updateMeeting = useUpdateMeeting();
  const deleteMeetingMutation = useDeleteMeeting();
  const duplicateMeetingMutation = useDuplicateMeeting();

  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter(meeting => {
      if (typeFilter !== 'all' && meeting.type !== typeFilter) return false;
      if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;
      return true;
    });
    
    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [meetings, typeFilter, statusFilter, sortOrder]);

  const getParticipantNames = (participants?: Meeting['participants']) => {
    if (!participants) return '';
    return participants
      .map(p => p.administrator?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleCreate = () => {
    setEditingMeeting(null);
    setIsFormOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteMeeting) {
      await deleteMeetingMutation.mutateAsync(deleteMeeting.id);
      setDeleteMeeting(null);
    }
  };

  const handleDuplicate = async () => {
    if (duplicateMeetingData) {
      await duplicateMeetingMutation.mutateAsync({
        meetingId: duplicateMeetingData.meeting.id,
        newDate: new Date(duplicateMeetingData.newDate).toISOString()
      });
      setDuplicateMeetingData(null);
    }
  };

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  if (isLoading) {
    return (
      <AppLayout title="Reuniões" subtitle="Gestão de reuniões do Board">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reuniões" subtitle="Gestão de reuniões do Board">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo de reunião" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="CA">CA - Conselho de Administração</SelectItem>
                <SelectItem value="CEAAP">CEAAP - Assuntos Administrativos</SelectItem>
                <SelectItem value="RT">RT - Reunião de Trabalho</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="Preparação">Preparação</SelectItem>
                <SelectItem value="Em Curso">Em Curso</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Publicada">Publicada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Ordenar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4" />
                    Mais recentes primeiro
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4" />
                    Mais antigas primeiro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Nova Reunião
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting, index) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting}
              participantNames={getParticipantNames(meeting.participants)}
              index={index}
              onClick={() => handleMeetingClick(meeting)}
              onEdit={() => handleEdit(meeting)}
              onDelete={() => setDeleteMeeting(meeting)}
              onDuplicate={() => setDuplicateMeetingData({ meeting, newDate: format(new Date(), 'yyyy-MM-dd') })}
            />
          ))}
        </div>

        {filteredMeetings.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">Nenhuma reunião encontrada</h3>
            <p className="text-muted-foreground mt-1">
              Ajuste os filtros ou crie uma nova reunião
            </p>
          </div>
        )}
      </div>

      {/* Meeting Detail Dialog with Agenda Points */}
      <MeetingDetailDialog 
        meeting={selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
      />

      {/* Create/Edit Form */}
      <MeetingForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        meeting={editingMeeting}
        onCreate={createMeeting.mutateAsync}
        onUpdate={updateMeeting.mutateAsync}
      />

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateMeetingData} onOpenChange={(open) => !open && setDuplicateMeetingData(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Duplicar Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione a nova data para a reunião duplicada. Os pontos de agenda serão copiados.
            </p>
            <div className="space-y-2">
              <Label>Nova Data</Label>
              <Input
                type="date"
                value={duplicateMeetingData?.newDate || ''}
                onChange={(e) => setDuplicateMeetingData(d => d ? { ...d, newDate: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateMeetingData(null)}>Cancelar</Button>
            <Button onClick={handleDuplicate} disabled={duplicateMeetingMutation.isPending}>
              {duplicateMeetingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMeeting} onOpenChange={(open) => !open && setDeleteMeeting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar esta reunião? Esta ação não pode ser revertida e irá eliminar todos os pontos de agenda associados.
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

// Meeting Detail Dialog with Tabs
function MeetingDetailDialog({ meeting, onClose }: { meeting: Meeting | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { data: agendaPoints = [], isLoading } = useAgendaPoints(meeting?.id);
  const [activeTab, setActiveTab] = useState('dados');

  const handleAgendaPointClick = (pointId: string) => {
    onClose();
    navigate(`/agenda?point=${pointId}`);
  };

  if (!meeting) return null;

  const date = new Date(meeting.date);

  return (
    <Dialog open={!!meeting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className={cn("font-semibold", meetingTypeStyles[meeting.type])}>
              {meeting.type}
            </Badge>
            {meetingTypeLabels[meeting.type]}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados da Reunião</TabsTrigger>
            <TabsTrigger value="pontos">Pontos de Agenda ({agendaPoints.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  Data e Hora
                </div>
                <p className="font-medium">{format(date, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Local
                </div>
                <p className="font-medium">{meeting.location}</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Estado</div>
              <span className={cn("status-badge", meetingStatusStyles[meeting.status])}>{meeting.status}</span>
            </div>
          </TabsContent>

          <TabsContent value="pontos" className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : agendaPoints.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum ponto de agenda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agendaPoints.map((point) => (
                  <div 
                    key={point.id} 
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                      point.is_confidential && "border-l-2 border-l-status-warning"
                    )}
                    onClick={() => handleAgendaPointClick(point.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-6">{point.order}</span>
                      {point.is_confidential && <Lock className="w-3.5 h-3.5 text-status-warning" />}
                      <span className="font-medium text-foreground">{point.title}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      <Badge variant="outline" className="text-xs">{point.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6 mt-1">{point.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Meeting Form Component
function MeetingForm({
  open,
  onOpenChange,
  meeting,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'CA' as MeetingType,
    location: '',
    status: 'Preparação' as MeetingStatus,
  });

  useMemo(() => {
    if (meeting) {
      const meetingDate = new Date(meeting.date);
      setFormData({
        date: format(meetingDate, 'yyyy-MM-dd'),
        time: format(meetingDate, 'HH:mm'),
        type: meeting.type,
        location: meeting.location,
        status: meeting.status,
      });
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        type: 'CA',
        location: '',
        status: 'Preparação',
      });
    }
  }, [meeting, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = new Date(`${formData.date}T${formData.time}`).toISOString();
    
    if (meeting) {
      await onUpdate({ 
        id: meeting.id, 
        date: dateTime,
        type: formData.type,
        location: formData.location,
        status: formData.status,
      });
    } else {
      await onCreate({ 
        date: dateTime,
        type: formData.type,
        location: formData.location,
        status: formData.status,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(f => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(f => ({ ...f, type: v as MeetingType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingTypes.map(t => (
                    <SelectItem key={t} value={t}>{t} - {meetingTypeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(f => ({ ...f, status: v as MeetingStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meetingStatuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Local *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
              placeholder="Ex: Sala de Reuniões Principal"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {meeting ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  participantNames: string;
  index: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function MeetingCard({ meeting, participantNames, index, onClick, onEdit, onDelete, onDuplicate }: MeetingCardProps) {
  const date = new Date(meeting.date);
  
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border/50 shadow-card overflow-hidden",
        "hover:shadow-medium transition-all duration-200 cursor-pointer group",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant="outline" 
                className={cn("font-semibold", meetingTypeStyles[meeting.type])}
              >
                {meeting.type}
              </Badge>
              <span className={cn("status-badge", meetingStatusStyles[meeting.status])}>
                {meeting.status}
              </span>
            </div>
            
            <h3 className="font-semibold text-foreground mb-1">
              {meetingTypeLabels[meeting.type]}
            </h3>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  {format(date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: pt })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{meeting.location}</span>
              </div>
              {participantNames && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="truncate">{participantNames}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="bg-muted/50 rounded-lg p-3 text-center mb-2">
              <div className="text-2xl font-bold text-foreground">
                {format(date, "dd")}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                {format(date, "MMM", { locale: pt })}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {meeting.agenda_points_count} pontos
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {meeting.agenda_points_count} pontos de agenda
        </span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
}
