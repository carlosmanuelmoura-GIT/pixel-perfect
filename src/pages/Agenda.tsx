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
  FileText
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgendaPoints, useMeetings, useAttributeFamilies, useAgendaPointAttributes } from '@/hooks/useSupabaseData';
import { AgendaPointDetail } from '@/components/agenda/AgendaPointDetail';
import type { AgendaPoint, AgendaPointStatus, Priority, PointType } from '@/types/database';
import { cn } from '@/lib/utils';

const statusStyles: Record<AgendaPointStatus, { label: string; color: string }> = {
  'Proposto': { label: 'Proposto', color: 'bg-muted text-muted-foreground border-border' },
  'Aprovado': { label: 'Aprovado', color: 'bg-status-success/10 text-status-success border-status-success/20' },
  'Em discussão': { label: 'Em discussão', color: 'bg-status-info/10 text-status-info border-status-info/20' },
  'Fechado': { label: 'Fechado', color: 'bg-muted text-muted-foreground border-border' },
  'Acompanhamento': { label: 'Acompanhamento', color: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
  'Encerrado': { label: 'Encerrado', color: 'bg-muted text-muted-foreground border-border' },
};

const priorityStyles: Record<Priority, string> = {
  'Alta': 'bg-status-critical/10 text-status-critical border-status-critical/20',
  'Média': 'bg-status-warning/10 text-status-warning border-status-warning/20',
  'Baixa': 'bg-muted text-muted-foreground border-border',
};

const pointTypeStyles: Record<PointType, { icon: typeof FileText; color: string }> = {
  'Informação': { icon: FileText, color: 'text-status-info' },
  'Decisão': { icon: FileText, color: 'text-status-success' },
  'Discussão': { icon: FileText, color: 'text-status-warning' },
};

export default function Agenda() {
  const [meetingFilter, setMeetingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPoint, setSelectedPoint] = useState<AgendaPoint | null>(null);
  
  const { data: agendaPoints = [], isLoading } = useAgendaPoints();
  const { data: meetings = [] } = useMeetings();
  const { data: families = [] } = useAttributeFamilies();

  const filteredPoints = useMemo(() => {
    return agendaPoints.filter(point => {
      if (meetingFilter !== 'all' && point.meeting_id !== meetingFilter) return false;
      if (statusFilter !== 'all' && point.status !== statusFilter) return false;
      return true;
    });
  }, [agendaPoints, meetingFilter, statusFilter]);

  // Group by meeting
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
        {/* Filters */}
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

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Ponto
          </Button>
        </div>

        {/* Points grouped by meeting */}
        <div className="space-y-6">
          {pointsByMeeting.map(({ meeting, points }) => (
            <div key={meeting?.id || 'unknown'} className="space-y-3">
              {/* Meeting header */}
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

              {/* Points list */}
              <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
                <div className="divide-y divide-border/50">
                  {points.map((point, index) => (
                    <AgendaPointRow 
                      key={point.id} 
                      point={point} 
                      index={index}
                      onClick={() => setSelectedPoint(point)}
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedPoint} onOpenChange={(open) => !open && setSelectedPoint(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPoint?.is_confidential && <Lock className="w-4 h-4 text-status-warning" />}
              {selectedPoint?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedPoint && (
            <AgendaPointDetail point={selectedPoint} families={families} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function AgendaPointRow({ 
  point, 
  index,
  onClick 
}: { 
  point: AgendaPoint; 
  index: number;
  onClick: () => void;
}) {
  const statusStyle = statusStyles[point.status];
  const priorityStyle = priorityStyles[point.priority];
  const TypeIcon = pointTypeStyles[point.point_type].icon;

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
              <TypeIcon className={cn("w-3.5 h-3.5", pointTypeStyles[point.point_type].color)} />
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
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Ver Decisões</DropdownMenuItem>
              <DropdownMenuItem>Ver Ações</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
