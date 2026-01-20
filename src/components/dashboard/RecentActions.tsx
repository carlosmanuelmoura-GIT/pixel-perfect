import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Action, ActionStatus } from '@/types/database';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, Pause, XCircle, Building2 } from 'lucide-react';

interface RecentActionsProps {
  actions: Action[];
  isLoading?: boolean;
  onActionClick?: (actionId: string) => void;
}

const statusConfig: Record<ActionStatus, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'Por iniciar': { icon: Clock, color: 'text-status-neutral', bgColor: 'bg-muted' },
  'Em curso': { icon: Clock, color: 'text-status-info', bgColor: 'bg-status-info/10' },
  'Concluída': { icon: CheckCircle, color: 'text-status-success', bgColor: 'bg-status-success/10' },
  'Bloqueada': { icon: Pause, color: 'text-status-warning', bgColor: 'bg-status-warning/10' },
  'Cancelada': { icon: XCircle, color: 'text-status-neutral', bgColor: 'bg-muted' },
};

export function RecentActions({ actions, isLoading, onActionClick }: RecentActionsProps) {
  const now = new Date();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Ações em Curso</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Follow-ups das decisões recentes
          </p>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Ações em Curso</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Follow-ups das decisões recentes
        </p>
      </div>
      
      <div className="divide-y divide-border/50">
        {actions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Nenhuma ação em curso
          </div>
        ) : (
          actions.slice(0, 5).map((action, index) => {
            const config = statusConfig[action.status];
            const Icon = config.icon;
            const deadline = new Date(action.deadline);
            const daysUntilDeadline = differenceInDays(deadline, now);
            const isOverdue = daysUntilDeadline < 0 && action.status !== 'Concluída' && action.status !== 'Cancelada';
            const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && action.status !== 'Concluída';
            
            return (
              <div 
                key={action.id}
                onClick={() => onActionClick?.(action.id)}
                className={cn(
                  "p-4 hover:bg-muted/30 transition-colors cursor-pointer",
                  "animate-slide-up"
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {action.description}
                      </p>
                      {isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-status-critical flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {action.responsible_name || 'Sem responsável'}
                      </span>
                      {action.pelouro && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {action.pelouro.name}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className={cn(
                        isOverdue && "text-status-critical font-medium",
                        isUrgent && "text-status-warning font-medium"
                      )}>
                        {isOverdue 
                          ? `${Math.abs(daysUntilDeadline)} dias em atraso`
                          : `Prazo: ${format(deadline, "dd MMM", { locale: pt })}`
                        }
                      </span>
                    </div>
                    
                    {action.status !== 'Concluída' && action.status !== 'Cancelada' && (
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={action.progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {action.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
