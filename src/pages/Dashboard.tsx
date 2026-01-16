import { 
  Calendar, 
  ListChecks, 
  CheckSquare, 
  TrendingUp 
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { UpcomingMeetings } from '@/components/dashboard/UpcomingMeetings';
import { AgendaPipeline } from '@/components/dashboard/AgendaPipeline';
import { RecentActions } from '@/components/dashboard/RecentActions';
import { 
  useDashboardMetrics, 
  useUpcomingMeetings, 
  useAgendaPoints, 
  useActions 
} from '@/hooks/useSupabaseData';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: upcomingMeetings = [], isLoading: meetingsLoading } = useUpcomingMeetings();
  const { data: agendaPoints = [], isLoading: agendaLoading } = useAgendaPoints();
  const { data: actions = [], isLoading: actionsLoading } = useActions();

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral das atividades do Board"
    >
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Reuniões Agendadas"
            value={metricsLoading ? '-' : upcomingMeetings.length}
            subtitle="Próximos 30 dias"
            icon={<Calendar className="w-6 h-6 text-accent" />}
            variant="accent"
          />
          <MetricCard
            title="Pontos Pendentes"
            value={metricsLoading ? '-' : metrics?.pendingAgendaPoints || 0}
            subtitle="Aguardam decisão"
            icon={<ListChecks className="w-6 h-6 text-state-proposed" />}
            variant="warning"
          />
          <MetricCard
            title="Ações Ativas"
            value={metricsLoading ? '-' : metrics?.activeActions || 0}
            subtitle={`${metrics?.overdueActions || 0} em atraso`}
            icon={<CheckSquare className="w-6 h-6 text-status-info" />}
            trend={metrics?.overdueActions && metrics.overdueActions > 0 ? { 
              value: metrics.overdueActions, 
              isPositive: false 
            } : undefined}
          />
          <MetricCard
            title="Taxa de Conclusão"
            value={metricsLoading ? '-' : `${metrics?.completionRate || 0}%`}
            subtitle="Ações concluídas"
            icon={<TrendingUp className="w-6 h-6 text-status-success" />}
            variant="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <AgendaPipeline points={agendaPoints} isLoading={agendaLoading} />
            <RecentActions actions={actions} isLoading={actionsLoading} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <UpcomingMeetings meetings={upcomingMeetings} isLoading={meetingsLoading} />
            
            {/* Quick Stats Card */}
            <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Resumo</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total reuniões</span>
                  <span className="text-sm font-semibold text-foreground">
                    {metrics?.totalMeetings || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pontos de agenda</span>
                  <span className="text-sm font-semibold text-foreground">
                    {agendaPoints.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total ações</span>
                  <span className="text-sm font-semibold text-foreground">
                    {actions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
