import { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Percent,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeetings, useAgendaPoints, useActions, useDecisions } from '@/hooks/useSupabaseData';
import type { ActionStatus } from '@/types/database';

const actionStatusColors: Record<ActionStatus, string> = {
  'Por iniciar': 'hsl(var(--muted-foreground))',
  'Em curso': 'hsl(var(--status-info))',
  'Concluída': 'hsl(var(--status-success))',
  'Bloqueada': 'hsl(var(--status-warning))',
  'Cancelada': 'hsl(var(--status-neutral))',
};

export default function Indicadores() {
  const [period, setPeriod] = useState('6');
  
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: agendaPoints = [], isLoading: agendaLoading } = useAgendaPoints();
  const { data: actions = [], isLoading: actionsLoading } = useActions();
  const { data: decisions = [], isLoading: decisionsLoading } = useDecisions();

  const isLoading = meetingsLoading || agendaLoading || actionsLoading || decisionsLoading;

  // Meetings per month data
  const meetingsPerMonth = (() => {
    const months: { month: string; count: number }[] = [];
    const periodMonths = parseInt(period);
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const count = meetings.filter(m => {
        const meetingDate = new Date(m.date);
        return meetingDate >= monthStart && meetingDate <= monthEnd;
      }).length;
      
      months.push({
        month: format(date, 'MMM yyyy', { locale: pt }),
        count,
      });
    }
    
    return months;
  })();

  // Actions by status for pie chart
  const actionsByStatus = (() => {
    const statusCounts: Record<string, number> = {};
    actions.forEach(action => {
      statusCounts[action.status] = (statusCounts[action.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  })();

  // Agenda points trend over time
  const agendaPointsTrend = (() => {
    const months: { month: string; total: number; deliberados: number }[] = [];
    const periodMonths = parseInt(period);
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthPoints = agendaPoints.filter(p => {
        const pointDate = new Date(p.created_at);
        return pointDate >= monthStart && pointDate <= monthEnd;
      });
      
      months.push({
        month: format(date, 'MMM', { locale: pt }),
        total: monthPoints.length,
        deliberados: monthPoints.filter(p => p.status === 'Deliberado').length,
      });
    }
    
    return months;
  })();

  // KPIs
  const completedActions = actions.filter(a => a.status === 'Concluída').length;
  const totalActiveActions = actions.filter(a => a.status !== 'Cancelada').length;
  const completionRate = totalActiveActions > 0 ? Math.round((completedActions / totalActiveActions) * 100) : 0;
  
  const avgPointsPerMeeting = meetings.length > 0 
    ? Math.round(meetings.reduce((acc, m) => acc + m.agenda_points_count, 0) / meetings.length)
    : 0;

  const decisionsWithFollowup = decisions.filter(d => d.has_followup).length;
  const followupRate = decisions.length > 0 ? Math.round((decisionsWithFollowup / decisions.length) * 100) : 0;

  if (isLoading) {
    return (
      <AppLayout title="Indicadores" subtitle="Métricas e análises do Board">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Indicadores" subtitle="Métricas e análises do Board">
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex justify-end">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <CheckCircle className="h-4 w-4 text-status-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {completedActions} de {totalActiveActions} ações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Pontos/Reunião</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPointsPerMeeting}</div>
              <p className="text-xs text-muted-foreground">
                pontos por reunião
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decisões c/ Follow-up</CardTitle>
              <Percent className="h-4 w-4 text-status-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followupRate}%</div>
              <p className="text-xs text-muted-foreground">
                {decisionsWithFollowup} de {decisions.length} decisões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reuniões</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-muted-foreground">
                no período selecionado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meetings per Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Reuniões por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={meetingsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Actions by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ações por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {actionsByStatus.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={actionStatusColors[entry.name as ActionStatus] || 'hsl(var(--muted))'}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Agenda Points Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Evolução de Pontos de Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={agendaPointsTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      name="Total Criados"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="deliberados" 
                      name="Deliberados"
                      stroke="hsl(var(--status-success))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--status-success))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
