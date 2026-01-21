import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Meeting, MeetingType } from '@/types/database';

const meetingTypeStyles: Record<MeetingType, string> = {
  CA: 'bg-primary text-primary-foreground',
  CEAAP: 'bg-state-proposed text-white',
  RT: 'bg-state-approved text-white',
};

interface MonthlyCalendarProps {
  meetings: Meeting[];
  onMeetingClick: (meeting: Meeting) => void;
  onDateClick?: (date: Date) => void;
}

export function MonthlyCalendar({ meetings, onMeetingClick, onDateClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get the start of the week containing the first day of month (Monday = 1)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    meetings.forEach(meeting => {
      const dateKey = format(new Date(meeting.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(meeting);
    });
    return map;
  }, [meetings]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: pt })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/20">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayMeetings = meetingsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-1 border-r border-b border-border last:border-r-0",
                !isCurrentMonth && "bg-muted/30",
                isToday && "bg-primary/5",
                "hover:bg-muted/50 transition-colors cursor-pointer"
              )}
              onClick={() => onDateClick?.(day)}
            >
              <div className={cn(
                "text-sm font-medium p-1 w-7 h-7 flex items-center justify-center rounded-full",
                isToday && "bg-primary text-primary-foreground",
                !isCurrentMonth && "text-muted-foreground/50"
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1 mt-1">
                {dayMeetings.slice(0, 3).map(meeting => (
                  <div
                    key={meeting.id}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded truncate cursor-pointer",
                      "hover:opacity-80 transition-opacity",
                      meetingTypeStyles[meeting.type]
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMeetingClick(meeting);
                    }}
                    title={`${meeting.type} - ${format(new Date(meeting.date), 'HH:mm')}`}
                  >
                    {format(new Date(meeting.date), 'HH:mm')} {meeting.type}
                  </div>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1.5">
                    +{dayMeetings.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-border bg-muted/20 flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Legenda:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-xs">CA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-state-proposed" />
            <span className="text-xs">CEAAP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-state-approved" />
            <span className="text-xs">RT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
