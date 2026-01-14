import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  CheckSquare, 
  Plus, 
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  Pause,
  XCircle,
  MoreHorizontal,
  User
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { actions, pelouros } from '@/data/mockData';
import { Action, ActionStatus, Criticality } from '@/types';
import { cn } from '@/lib/utils';

const statusConfig: Record<ActionStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  'Por iniciar': { 
    label: 'Por Iniciar', 
    icon: Clock, 
    color: 'text-status-neutral',
    bgColor: 'bg-muted' 
  },
  'Em curso': { 
    label: 'Em Curso', 
    icon: Clock, 
    color: 'text-status-info',
    bgColor: 'bg-status-info/10' 
  },
  'Concluída': { 
    label: 'Concluída', 
    icon: CheckCircle, 
    color: 'text-status-success',
    bgColor: 'bg-status-success/10' 
  },
  'Bloqueada': { 
    label: 'Bloqueada', 
    icon: Pause, 
    color: 'text-status-warning',
    bgColor: 'bg-status-warning/10' 
  },
  'Cancelada': { 
    label: 'Cancelada', 
    icon: XCircle, 
    color: 'text-status-neutral',
    bgColor: 'bg-muted' 
  },
};

const criticalityStyles: Record<Criticality, string> = {
  'Crítica': 'bg-status-critical/10 text-status-critical border-status-critical/20',
  'Importante': 'bg-status-warning/10 text-status-warning border-status-warning/20',
  'Rotina': 'bg-muted text-muted-foreground border-border',
};

const kanbanColumns: ActionStatus[] = ['Por iniciar', 'Em curso', 'Concluída'];

export default function Acoes() {
  const [pelouroFilter, setPelouroFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredActions = actions.filter(action => {
    if (pelouroFilter !== 'all' && action.pelouro !== pelouroFilter) return false;
    return true;
  });

  const getActionsByStatus = (status: ActionStatus) => 
    filteredActions.filter(a => a.status === status);

  return (
    <AppLayout 
      title="Ações de Follow-up" 
      subtitle="Acompanhamento das ações resultantes das decisões"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <Select value={pelouroFilter} onValueChange={setPelouroFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pelouro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pelouros</SelectItem>
                {pelouros.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button 
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-none"
              >
                Kanban
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                Lista
              </Button>
            </div>
          </div>

          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Ação
          </Button>
        </div>

        {/* Kanban Board */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kanbanColumns.map(status => {
              const config = statusConfig[status];
              const columnActions = getActionsByStatus(status);
              
              return (
                <div key={status} className="kanban-column">
                  <div className="flex items-center gap-2 mb-4 px-2">
                    <config.icon className={cn("w-5 h-5", config.color)} />
                    <h3 className="font-semibold text-foreground">{config.label}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {columnActions.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {columnActions.map((action, index) => (
                      <ActionCard key={action.id} action={action} index={index} />
                    ))}
                    
                    {columnActions.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Sem ações
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
            <div className="divide-y divide-border/50">
              {filteredActions.map((action, index) => (
                <ActionRow key={action.id} action={action} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface ActionCardProps {
  action: Action;
  index: number;
}

function ActionCard({ action, index }: ActionCardProps) {
  const now = new Date();
  const daysUntilDeadline = differenceInDays(action.deadline, now);
  const isOverdue = daysUntilDeadline < 0 && action.status !== 'Concluída' && action.status !== 'Cancelada';
  const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0 && action.status !== 'Concluída';

  return (
    <div 
      className={cn(
        "kanban-card animate-slide-up",
        isOverdue && "border-l-2 border-l-status-critical"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant="outline" className={cn("text-xs", criticalityStyles[action.criticality])}>
          {action.criticality}
        </Badge>
        {isOverdue && (
          <AlertTriangle className="w-4 h-4 text-status-critical" />
        )}
      </div>
      
      <p className="text-sm font-medium text-foreground line-clamp-2 mb-3">
        {action.description}
      </p>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span>{action.responsible}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs",
            isOverdue && "text-status-critical font-medium",
            isUrgent && "text-status-warning font-medium",
            !isOverdue && !isUrgent && "text-muted-foreground"
          )}>
            {isOverdue 
              ? `${Math.abs(daysUntilDeadline)} dias em atraso`
              : `Prazo: ${format(action.deadline, "dd/MM/yyyy")}`
            }
          </span>
        </div>
        
        {action.status !== 'Concluída' && action.status !== 'Cancelada' && (
          <div className="flex items-center gap-2">
            <Progress value={action.progress} className="h-1.5 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">
              {action.progress}%
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          {action.pelouro}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Atualizar Progresso</DropdownMenuItem>
            <DropdownMenuItem>Ver Decisão</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface ActionRowProps {
  action: Action;
  index: number;
}

function ActionRow({ action, index }: ActionRowProps) {
  const now = new Date();
  const daysUntilDeadline = differenceInDays(action.deadline, now);
  const isOverdue = daysUntilDeadline < 0 && action.status !== 'Concluída' && action.status !== 'Cancelada';
  const config = statusConfig[action.status];
  const Icon = config.icon;

  return (
    <div 
      className={cn(
        "p-4 hover:bg-muted/30 transition-colors animate-slide-up",
        isOverdue && "border-l-2 border-l-status-critical"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-lg flex-shrink-0", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {action.description}
          </p>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span>{action.responsible}</span>
            <span>•</span>
            <span>{action.pelouro}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <Badge variant="outline" className={cn("text-xs", criticalityStyles[action.criticality])}>
            {action.criticality}
          </Badge>
          
          <div className="w-24">
            <Progress value={action.progress} className="h-1.5" />
          </div>
          
          <span className={cn(
            "text-xs w-24 text-right",
            isOverdue && "text-status-critical font-medium"
          )}>
            {format(action.deadline, "dd/MM/yyyy")}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Atualizar Progresso</DropdownMenuItem>
              <DropdownMenuItem>Ver Decisão</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
