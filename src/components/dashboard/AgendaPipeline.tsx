import type { AgendaPoint, AgendaPointStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { 
  FileQuestion, 
  CheckCircle2, 
  CheckCheck 
} from 'lucide-react';

interface AgendaPipelineProps {
  points: AgendaPoint[];
  isLoading?: boolean;
  onStatusClick?: (status: AgendaPointStatus) => void;
}

const statusConfig: Record<AgendaPointStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'Em agendamento': { 
    label: 'Em Agendamento', 
    icon: FileQuestion, 
    color: 'text-state-proposed',
    bgColor: 'bg-state-proposed/10' 
  },
  'Agendado': { 
    label: 'Agendado', 
    icon: CheckCircle2, 
    color: 'text-state-approved',
    bgColor: 'bg-state-approved/10' 
  },
  'Deliberado': { 
    label: 'Deliberado', 
    icon: CheckCheck, 
    color: 'text-state-completed',
    bgColor: 'bg-state-completed/10' 
  },
};

export function AgendaPipeline({ points, isLoading, onStatusClick }: AgendaPipelineProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <div className="h-5 bg-muted rounded w-40 animate-pulse" />
          <div className="h-4 bg-muted rounded w-32 mt-1 animate-pulse" />
        </div>
        <div className="p-6">
          <div className="h-2 bg-muted rounded-full mb-6 animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status as AgendaPointStatus] = points.filter(p => p.status === status).length;
    return acc;
  }, {} as Record<AgendaPointStatus, number>);

  const totalPoints = points.length;

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Pipeline de Agenda</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalPoints} pontos em {Object.values(statusCounts).filter(c => c > 0).length} estados
        </p>
      </div>
      
      <div className="p-6">
        {/* Progress Bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-muted/50 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = statusCounts[status as AgendaPointStatus];
            const percentage = totalPoints > 0 ? (count / totalPoints) * 100 : 0;
            if (percentage === 0) return null;
            
            return (
              <div 
                key={status}
                className={cn("transition-all duration-500", config.bgColor.replace('/10', ''))}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(statusConfig).map(([status, config], index) => {
            const count = statusCounts[status as AgendaPointStatus];
            const Icon = config.icon;
            
            return (
              <div 
                key={status}
                onClick={() => onStatusClick?.(status as AgendaPointStatus)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer",
                  config.bgColor,
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Icon className={cn("w-5 h-5", config.color)} />
                <div>
                  <p className="text-lg font-semibold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
