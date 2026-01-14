import { useState } from 'react';
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
  MoreHorizontal 
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
import { meetings, administrators } from '@/data/mockData';
import { Meeting, MeetingStatus, MeetingType } from '@/types';
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
  CEAAP: 'Comissão de Auditoria',
  RT: 'Reunião de Trabalho',
};

export default function Reunioes() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredMeetings = meetings.filter(meeting => {
    if (typeFilter !== 'all' && meeting.type !== typeFilter) return false;
    if (statusFilter !== 'all' && meeting.status !== statusFilter) return false;
    return true;
  });

  const getParticipantNames = (participantIds: string[]) => {
    return participantIds
      .map(id => administrators.find(a => a.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <AppLayout 
      title="Reuniões" 
      subtitle="Gestão de reuniões do Board"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
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
                <SelectItem value="CEAAP">CEAAP - Comissão de Auditoria</SelectItem>
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
          </div>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Reunião
          </Button>
        </div>

        {/* Meetings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.map((meeting, index) => (
            <MeetingCard 
              key={meeting.id} 
              meeting={meeting}
              participantNames={getParticipantNames(meeting.participants)}
              index={index}
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
    </AppLayout>
  );
}

interface MeetingCardProps {
  meeting: Meeting;
  participantNames: string;
  index: number;
}

function MeetingCard({ meeting, participantNames, index }: MeetingCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border/50 shadow-card overflow-hidden",
        "hover:shadow-medium transition-all duration-200 cursor-pointer group",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
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
                  {format(meeting.date, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: pt })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{meeting.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="truncate">{participantNames}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="bg-muted/50 rounded-lg p-3 text-center mb-2">
              <div className="text-2xl font-bold text-foreground">
                {format(meeting.date, "dd")}
              </div>
              <div className="text-xs text-muted-foreground uppercase">
                {format(meeting.date, "MMM", { locale: pt })}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {meeting.agendaPointsCount} pontos
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-muted/30 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {meeting.agendaPointsCount} pontos de agenda
        </span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Duplicar</DropdownMenuItem>
              <DropdownMenuItem>Exportar Ata</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
}
