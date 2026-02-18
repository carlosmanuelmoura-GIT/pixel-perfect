import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  BarChart3, 
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
  Cell
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
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const navigate = useNavigate();
  const { data: meetings = [], isLoading: meetingsLoading } = useMeetings();
  const { data: agendaPoints = [], isLoading: agendaLoading } = useAgendaPoints();
  const { data: actions = [], isLoading: actionsLoading } = useActions();
  const { data: decisions = [], isLoading: decisionsLoading } = useDecisions();

  const isLoading = meetingsLoading || agendaLoading || actionsLoading || decisionsLoading;

  // Filter data by selected year
  const yearStart = new Date(parseInt(year), 0, 1);
  const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
  
  const filteredMeetings = meetings.filter(m => {
    const d = new Date(m.date);
    return d >= yearStart && d <= yearEnd;
  });

  const filteredAgendaPoints = agendaPoints.filter(p => {
    const d = new Date(p.created_at);
    return d >= yearStart && d <= yearEnd;
  });

  const filteredActions = actions.filter(a => {
    const d = new Date(a.created_at);
    return d >= yearStart && d <= yearEnd;
  });

  const filteredDecisions = decisions.filter(d => {
    const dd = new Date(d.created_at);
    return dd >= yearStart && dd <= yearEnd;
  });

  // Meetings per month data
  const meetingsPerMonth = (() => {
    const months: { month: string; count: number }[] = [];
    const periodMonths = parseInt(period);
    
    for (let i = periodMonths - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const count = filteredMeetings.filter(m => {
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

  // Agenda points by meeting type
  const agendaPointsByMeetingType = (() => {
    const meetingTypeLabels: Record<string, string> = {
      'CA': 'CA',
      'CEAAP': 'Assuntos Administrativos',
      'RT': 'RT',
    };
    
    const typeCounts: Record<string, number> = { 'CA': 0, 'CEAAP': 0, 'RT': 0 };
    
    filteredMeetings.forEach(meeting => {
      typeCounts[meeting.type] = (typeCounts[meeting.type] || 0) + meeting.agenda_points_count;
    });
    
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: meetingTypeLabels[type] || type,
      type,
      pontos: count,
    }));
  })();

  // KPIs
  const completedActions = filteredActions.filter(a => a.status === 'Concluída').length;
  const totalActiveActions = filteredActions.filter(a => a.status !== 'Cancelada').length;
  const completionRate = totalActiveActions > 0 ? Math.round((completedActions / totalActiveActions) * 100) : 0;
  
  const avgPointsPerMeeting = filteredMeetings.length > 0 
    ? Math.round(filteredMeetings.reduce((acc, m) => acc + m.agenda_points_count, 0) / filteredMeetings.length)
    : 0;

  const decisionsWithFollowup = filteredDecisions.filter(d => d.has_followup).length;
  const followupRate = filteredDecisions.length > 0 ? Math.round((decisionsWithFollowup / filteredDecisions.length) * 100) : 0;

  // Available years from meetings data
  const availableYears = (() => {
    const years = new Set<number>();
    meetings.forEach(m => years.add(new Date(m.date).getFullYear()));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  })();

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
        {/* Filters */}
        <div className="flex justify-end gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/acoes?filter=Concluída')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão de Follow-ups</CardTitle>
              <CheckCircle className="h-4 w-4 text-status-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {completedActions} de {totalActiveActions} ações
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/agenda')}>
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

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/acoes')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decisões c/ Follow-up</CardTitle>
              <Percent className="h-4 w-4 text-status-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{followupRate}%</div>
              <p className="text-xs text-muted-foreground">
                {decisionsWithFollowup} de {filteredDecisions.length} decisões
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reunioes')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reuniões</CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredMeetings.length}</div>
              <p className="text-xs text-muted-foreground">
                no ano {year}
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
                  <BarChart data={meetingsPerMonth} className="cursor-pointer">
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
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      cursor="pointer"
                      onClick={() => navigate('/reunioes')}
                    />
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
                      cursor="pointer"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      onClick={(data) => navigate(`/acoes?filter=${encodeURIComponent(data.name)}`)}
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

          {/* Agenda Points by Meeting Type */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Pontos de Agenda por Tipo de Reunião
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agendaPointsByMeetingType} className="cursor-pointer">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="pontos" 
                      name="Pontos de Agenda"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      cursor="pointer"
                      onClick={(data) => navigate(`/reunioes?type=${encodeURIComponent(data.type)}`)}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
