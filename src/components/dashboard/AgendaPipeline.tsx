import { AgendaPoint, AgendaPointStatus } from '@/types';
import { cn } from '@/lib/utils';
import { 
  FileQuestion, 
  CheckCircle2, 
  MessageSquare, 
  FileCheck, 
  Clock, 
  CheckCheck 
} from 'lucide-react';

interface AgendaPipelineProps {
  points: AgendaPoint[];
}

const statusConfig: Record<AgendaPointStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'Proposto': { 
    label: 'Proposto', 
    icon: FileQuestion, 
    color: 'text-state-proposed',
    bgColor: 'bg-state-proposed/10' 
  },
  'Aprovado': { 
    label: 'Aprovado', 
    icon: CheckCircle2, 
    color: 'text-state-approved',
    bgColor: 'bg-state-approved/10' 
  },
  'Em discussão': { 
    label: 'Em Discussão', 
    icon: MessageSquare, 
    color: 'text-state-discussion',
    bgColor: 'bg-state-discussion/10' 
  },
  'Fechado': { 
    label: 'Fechado', 
    icon: FileCheck, 
    color: 'text-state-closed',
    bgColor: 'bg-state-closed/10' 
  },
  'Acompanhamento': { 
    label: 'Acompanhamento', 
    icon: Clock, 
    color: 'text-state-followUp',
    bgColor: 'bg-state-followUp/10' 
  },
  'Encerrado': { 
    label: 'Encerrado', 
    icon: CheckCheck, 
    color: 'text-state-completed',
    bgColor: 'bg-state-completed/10' 
  },
};

export function AgendaPipeline({ points }: AgendaPipelineProps) {
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(statusConfig).map(([status, config], index) => {
            const count = statusCounts[status as AgendaPointStatus];
            const Icon = config.icon;
            
            return (
              <div 
                key={status}
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
