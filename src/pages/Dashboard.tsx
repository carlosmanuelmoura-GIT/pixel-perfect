import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Percent 
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: upcomingMeetings = [], isLoading: meetingsLoading } = useUpcomingMeetings();
  const { data: agendaPoints = [], isLoading: agendaLoading } = useAgendaPoints();
  const { data: actions = [], isLoading: actionsLoading } = useActions();

  const years = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const dateRange = useMemo(() => {
    const year = parseInt(selectedYear);
    if (selectedMonth === 'all') {
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59) };
    }
    const month = parseInt(selectedMonth);
    return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0, 23, 59, 59) };
  }, [selectedMonth, selectedYear]);

  const filteredMeetings = useMemo(() => 
    upcomingMeetings.filter(m => {
      const d = new Date(m.date);
      return d >= dateRange.start && d <= dateRange.end;
    }), [upcomingMeetings, dateRange]);

  const filteredAgendaPoints = useMemo(() => 
    agendaPoints.filter(ap => {
      const d = new Date(ap.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    }), [agendaPoints, dateRange]);

  const filteredActions = useMemo(() => 
    actions.filter(a => {
      const d = new Date(a.start_date);
      return d >= dateRange.start && d <= dateRange.end;
    }), [actions, dateRange]);

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral das atividades do Board"
    >
      <div className="space-y-6">
        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {months.map((month, i) => (
                <SelectItem key={i} value={String(i)}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div onClick={() => navigate('/reunioes')} className="cursor-pointer">
            <MetricCard
              title="Reuniões Agendadas"
              value={metricsLoading ? '-' : metrics?.scheduledMeetings || 0}
              subtitle="Futuras"
              icon={<Calendar className="w-6 h-6 text-accent" />}
              variant="accent"
            />
          </div>
          <div onClick={() => navigate('/acoes?filter=expired')} className="cursor-pointer">
            <MetricCard
              title="Ações Expiradas"
              value={metricsLoading ? '-' : metrics?.expiredActions || 0}
              subtitle="Follow-up em atraso"
              icon={<AlertTriangle className="w-6 h-6 text-status-critical" />}
              variant="warning"
              trend={metrics?.expiredActions && metrics.expiredActions > 0 ? { 
                value: metrics.expiredActions, 
                isPositive: false 
              } : undefined}
            />
          </div>
          <div onClick={() => navigate('/agenda?status=Em agendamento')} className="cursor-pointer">
            <MetricCard
              title="Em Agendamento"
              value={metricsLoading ? '-' : metrics?.agendaPointsInScheduling || 0}
              subtitle="Pontos de agenda"
              icon={<FileText className="w-6 h-6 text-state-proposed" />}
              variant="warning"
            />
          </div>
          <div onClick={() => navigate('/indicadores')} className="cursor-pointer">
            <MetricCard
              title="Decisões c/ Follow-up"
              value={metricsLoading ? '-' : `${metrics?.decisionsWithFollowUpPercent || 0}%`}
              subtitle="Com ações associadas"
              icon={<Percent className="w-6 h-6 text-status-success" />}
              variant="success"
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <AgendaPipeline 
              points={filteredAgendaPoints} 
              isLoading={agendaLoading} 
              onStatusClick={(status) => navigate(`/agenda?status=${status}`)}
            />
            <RecentActions 
              actions={filteredActions} 
              isLoading={actionsLoading} 
              onActionClick={() => navigate('/acoes?filter=Em curso')}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <UpcomingMeetings 
              meetings={filteredMeetings} 
              isLoading={meetingsLoading}
              onMeetingClick={(meetingId) => navigate(`/reunioes`)}
            />
            
            {/* Quick Stats Card */}
            <div className="bg-card rounded-xl border border-border/50 shadow-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Resumo</h3>
              <div className="space-y-4">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded p-2 -m-2 transition-colors"
                  onClick={() => navigate('/reunioes')}
                >
                  <span className="text-sm text-muted-foreground">Reuniões futuras</span>
                  <span className="text-sm font-semibold text-foreground">
                    {filteredMeetings.length}
                  </span>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded p-2 -m-2 transition-colors"
                  onClick={() => navigate('/agenda')}
                >
                  <span className="text-sm text-muted-foreground">Pontos de agenda</span>
                  <span className="text-sm font-semibold text-foreground">
                    {filteredAgendaPoints.length}
                  </span>
                </div>
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded p-2 -m-2 transition-colors"
                  onClick={() => navigate('/acoes?filter=Em curso')}
                >
                  <span className="text-sm text-muted-foreground">Total ações em curso</span>
                  <span className="text-sm font-semibold text-foreground">
                    {filteredActions.filter(a => a.status === 'Em curso').length}
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
