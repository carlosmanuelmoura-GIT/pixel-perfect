import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, getWeek } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, FileText, Lock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgendaPoints } from '@/hooks/useSupabaseData';
import type { Meeting, MeetingType, MeetingStatus } from '@/types/database';

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

interface WeeklyViewProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
}

function MeetingAgendaPoints({ meetingId }: { meetingId: string }) {
  const { data: agendaPoints = [], isLoading } = useAgendaPoints(meetingId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 pl-6 text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">A carregar pontos...</span>
      </div>
    );
  }

  if (agendaPoints.length === 0) {
    return (
      <div className="py-2 pl-6 text-xs text-muted-foreground italic">
        Nenhum ponto de agenda
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2 pl-6">
      {agendaPoints.map((point) => (
        <div
          key={point.id}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm",
            "bg-muted/40 hover:bg-muted/60 transition-colors",
            point.is_confidential && "border-l-2 border-l-status-warning"
          )}
        >
          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">{point.order}</span>
          {point.is_confidential && <Lock className="w-3 h-3 text-status-warning shrink-0" />}
          <span className="text-foreground truncate flex-1">{point.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{point.status}</Badge>
          <Badge variant="outline" className="text-[10px] shrink-0">{point.point_type}</Badge>
        </div>
      ))}
    </div>
  );
}

function MeetingRow({ meeting, onMeetingClick }: { meeting: Meeting; onMeetingClick: (m: Meeting) => void }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(meeting.date);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        <Badge variant="outline" className={cn("font-semibold shrink-0", meetingTypeStyles[meeting.type])}>
          {meeting.type}
        </Badge>

        {meeting.reference_id && (
          <Badge variant="secondary" className="font-mono text-xs shrink-0">
            {meeting.reference_id}
          </Badge>
        )}

        <span className="font-medium text-foreground truncate">
          {meetingTypeLabels[meeting.type]}
        </span>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0 ml-auto">
          <Clock className="w-3.5 h-3.5" />
          {format(date, 'HH:mm')}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <MapPin className="w-3.5 h-3.5" />
          <span className="max-w-[120px] truncate">{meeting.location}</span>
        </div>

        <span className={cn("status-badge shrink-0", meetingStatusStyles[meeting.status])}>
          {meeting.status}
        </span>

        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <FileText className="w-3.5 h-3.5" />
          {meeting.agenda_points_count}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={(e) => { e.stopPropagation(); onMeetingClick(meeting); }}
        >
          Abrir
        </Button>
      </div>

      {expanded && <MeetingAgendaPoints meetingId={meeting.id} />}
    </div>
  );
}

export function WeeklyView({ meetings, onMeetingClick }: WeeklyViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      map.set(key, []);
    });
    meetings.forEach(meeting => {
      const mDate = new Date(meeting.date);
      const key = format(mDate, 'yyyy-MM-dd');
      if (map.has(key)) {
        map.get(key)!.push(meeting);
      }
    });
    // Sort meetings within each day
    map.forEach((dayMeetings) => {
      dayMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return map;
  }, [meetings, currentWeekStart]);

  const totalMeetingsInWeek = useMemo(() => {
    let count = 0;
    meetingsByDay.forEach(m => count += m.length);
    return count;
  }, [meetingsByDay]);

  const goToPrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const isToday = (day: Date) => isSameDay(day, new Date());

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Semana {weekNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(currentWeekStart, "dd 'de' MMMM", { locale: pt })} — {format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: pt })}
              <span className="ml-2 text-xs">({totalMeetingsInWeek} {totalMeetingsInWeek === 1 ? 'reunião' : 'reuniões'})</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="divide-y divide-border">
        {weekDays.filter(day => {
          const key = format(day, 'yyyy-MM-dd');
          return (meetingsByDay.get(key) || []).length > 0;
        }).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Sem reuniões nesta semana</p>
          </div>
        ) : (
          weekDays.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dayMeetings = meetingsByDay.get(key) || [];
            if (dayMeetings.length === 0) return null;
            const today = isToday(day);

            return (
              <div key={key} className={cn("flex", today && "bg-primary/5")}>
                <div className={cn(
                  "w-32 shrink-0 p-3 border-r border-border flex flex-col items-center justify-start",
                  today && "bg-primary/10"
                )}>
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE', { locale: pt })}
                  </span>
                  <span className={cn(
                    "text-xl font-bold mt-0.5",
                    today ? "text-primary" : "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {format(day, 'MMM', { locale: pt })}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-2 min-h-[60px]">
                  {dayMeetings.map(meeting => (
                    <MeetingRow
                      key={meeting.id}
                      meeting={meeting}
                      onMeetingClick={onMeetingClick}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
