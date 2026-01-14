import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Meeting } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UpcomingMeetingsProps {
  meetings: Meeting[];
}

const meetingTypeStyles: Record<string, string> = {
  CA: 'bg-primary/10 text-primary',
  CEAAP: 'bg-state-proposed/10 text-state-proposed',
  RT: 'bg-state-approved/10 text-state-approved',
};

const meetingTypeLabels: Record<string, string> = {
  CA: 'Conselho de Administração',
  CEAAP: 'Comissão de Auditoria',
  RT: 'Reunião de Trabalho',
};

export function UpcomingMeetings({ meetings }: UpcomingMeetingsProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          Próximas Reuniões
        </h3>
      </div>
      
      <div className="divide-y divide-border/50">
        {meetings.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma reunião agendada
          </div>
        ) : (
          meetings.map((meeting, index) => (
            <div 
              key={meeting.id}
              className={cn(
                "p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={cn("font-medium", meetingTypeStyles[meeting.type])}
                    >
                      {meeting.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {meetingTypeLabels[meeting.type]}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(meeting.date, "dd MMM, HH:mm", { locale: pt })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {meeting.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {meeting.participants.length} participantes
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {format(meeting.date, "dd")}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {format(meeting.date, "MMM", { locale: pt })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
