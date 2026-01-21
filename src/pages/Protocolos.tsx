import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Plus, 
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Handshake,
  ExternalLink,
  Check,
  X,
  Search
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useProtocols, 
  useCreateProtocol, 
  useUpdateProtocol, 
  useDeleteProtocol,
  usePelouros,
  useMeetings,
  useAgendaPoints,
  useDecisions,
  Protocol 
} from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';

export default function Protocolos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null);
  const [deleteProtocol, setDeleteProtocol] = useState<Protocol | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmVigor, setFilterEmVigor] = useState<string>('all');

  const { data: protocols = [], isLoading } = useProtocols();
  const { data: pelouros = [] } = usePelouros();
  const { data: meetings = [] } = useMeetings();
  const createProtocol = useCreateProtocol();
  const updateProtocol = useUpdateProtocol();
  const deleteProtocolMutation = useDeleteProtocol();

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.objeto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEmVigor === 'all' || 
      (filterEmVigor === 'vigor' && protocol.em_vigor) ||
      (filterEmVigor === 'nao_vigor' && !protocol.em_vigor);

    return matchesSearch && matchesFilter;
  });

  const handleCreate = () => {
    setEditingProtocol(null);
    setIsFormOpen(true);
  };

  const handleEdit = (protocol: Protocol) => {
    setEditingProtocol(protocol);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteProtocol) {
      await deleteProtocolMutation.mutateAsync(deleteProtocol.id);
      setDeleteProtocol(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Protocolos" subtitle="Gestão de protocolos e acordos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Protocolos" subtitle="Gestão de protocolos e acordos">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar protocolos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[250px]"
              />
            </div>
            <Select value={filterEmVigor} onValueChange={setFilterEmVigor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vigor">Em vigor</SelectItem>
                <SelectItem value="nao_vigor">Não em vigor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Novo Protocolo
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Reunião CA</TableHead>
                <TableHead>Data Celebração</TableHead>
                <TableHead>Em Vigor</TableHead>
                <TableHead>Renovação Auto.</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProtocols.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Handshake className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum protocolo encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProtocols.map((protocol) => (
                  <TableRow key={protocol.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleEdit(protocol)}>
                    <TableCell className="font-medium">{protocol.nome}</TableCell>
                    <TableCell>{protocol.versao || '-'}</TableCell>
                    <TableCell>{protocol.tema || '-'}</TableCell>
                    <TableCell>
                      {protocol.meeting ? (
                        <div className="text-sm">
                          <span className="font-medium">{protocol.meeting.type}</span>
                          <span className="text-muted-foreground ml-1">
                            {format(new Date(protocol.meeting.date), "dd/MM/yyyy", { locale: pt })}
                          </span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {protocol.data_celebracao 
                        ? format(new Date(protocol.data_celebracao), "dd/MM/yyyy", { locale: pt })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        protocol.em_vigor 
                          ? "bg-status-success/10 text-status-success border-status-success/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {protocol.em_vigor ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        {protocol.em_vigor ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        protocol.renovacao_automatica 
                          ? "bg-status-info/10 text-status-info border-status-info/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {protocol.renovacao_automatica ? 'Sim' : 'Não'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(protocol); }}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {protocol.link_doc_plus && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(protocol.link_doc_plus!, '_blank'); }}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir DOC+
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteProtocol(protocol); }}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Form */}
      <ProtocolForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        protocol={editingProtocol}
        pelouros={pelouros}
        meetings={meetings}
        onSubmit={async (data) => {
          if (editingProtocol) {
            await updateProtocol.mutateAsync({ id: editingProtocol.id, ...data });
          } else {
            await createProtocol.mutateAsync(data);
          }
          setIsFormOpen(false);
        }}
        isPending={createProtocol.isPending || updateProtocol.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProtocol} onOpenChange={(open) => !open && setDeleteProtocol(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Protocolo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{deleteProtocol?.nome}"? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

interface ProtocolFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: Protocol | null;
  pelouros: { id: string; name: string }[];
  meetings: { id: string; type: string; date: string }[];
  onSubmit: (data: any) => Promise<void>;
  isPending: boolean;
}

interface MeetingOption {
  id: string;
  type: string;
  date: string;
}

function ProtocolForm({ open, onOpenChange, protocol, pelouros, meetings, onSubmit, isPending }: ProtocolFormProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const { data: agendaPoints = [] } = useAgendaPoints(selectedMeetingId || undefined);
  const [selectedAgendaPointId, setSelectedAgendaPointId] = useState<string>('');
  const { data: decisions = [] } = useDecisions(selectedAgendaPointId || undefined);
  const [formData, setFormData] = useState({
    versao: '',
    nome: '',
    divulgacao_existencia: false,
    divulgacao_conteudo: false,
    em_vigor: true,
    data_celebracao: '',
    data_producao_efeitos: '',
    decisor: '',
    data_aprovacao: '',
    tipo_ambito: '',
    tema: '',
    objeto: '',
    data_termo: '',
    renovacao_automatica: false,
    id_doc_plus: '',
    link_doc_plus: '',
    observacoes: '',
    alteracoes: '',
    departamento_responsavel_id: '',
    meeting_id: '',
    agenda_point_id: '',
    decision_id: '',
  });

  // Reset form when dialog opens
  useState(() => {
    if (open) {
      if (protocol) {
        setFormData({
          versao: protocol.versao || '',
          nome: protocol.nome || '',
          divulgacao_existencia: protocol.divulgacao_existencia,
          divulgacao_conteudo: protocol.divulgacao_conteudo,
          em_vigor: protocol.em_vigor,
          data_celebracao: protocol.data_celebracao || '',
          data_producao_efeitos: protocol.data_producao_efeitos || '',
          decisor: protocol.decisor || '',
          data_aprovacao: protocol.data_aprovacao || '',
          tipo_ambito: protocol.tipo_ambito || '',
          tema: protocol.tema || '',
          objeto: protocol.objeto || '',
          data_termo: protocol.data_termo || '',
          renovacao_automatica: protocol.renovacao_automatica,
          id_doc_plus: protocol.id_doc_plus || '',
          link_doc_plus: protocol.link_doc_plus || '',
          observacoes: protocol.observacoes || '',
          alteracoes: protocol.alteracoes || '',
          departamento_responsavel_id: protocol.departamento_responsavel_id || '',
          meeting_id: protocol.meeting_id || '',
          agenda_point_id: protocol.agenda_point_id || '',
          decision_id: protocol.decision_id || '',
        });
        setSelectedMeetingId(protocol.meeting_id || '');
        setSelectedAgendaPointId(protocol.agenda_point_id || '');
      } else {
        setFormData({
          versao: '',
          nome: '',
          divulgacao_existencia: false,
          divulgacao_conteudo: false,
          em_vigor: true,
          data_celebracao: '',
          data_producao_efeitos: '',
          decisor: '',
          data_aprovacao: '',
          tipo_ambito: '',
          tema: '',
          objeto: '',
          data_termo: '',
          renovacao_automatica: false,
          id_doc_plus: '',
          link_doc_plus: '',
          observacoes: '',
          alteracoes: '',
          departamento_responsavel_id: '',
          meeting_id: '',
          agenda_point_id: '',
          decision_id: '',
        });
        setSelectedMeetingId('');
        setSelectedAgendaPointId('');
      }
    }
  });

  // Update form when protocol changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && protocol) {
      setFormData({
        versao: protocol.versao || '',
        nome: protocol.nome || '',
        divulgacao_existencia: protocol.divulgacao_existencia,
        divulgacao_conteudo: protocol.divulgacao_conteudo,
        em_vigor: protocol.em_vigor,
        data_celebracao: protocol.data_celebracao || '',
        data_producao_efeitos: protocol.data_producao_efeitos || '',
        decisor: protocol.decisor || '',
        data_aprovacao: protocol.data_aprovacao || '',
        tipo_ambito: protocol.tipo_ambito || '',
        tema: protocol.tema || '',
        objeto: protocol.objeto || '',
        data_termo: protocol.data_termo || '',
        renovacao_automatica: protocol.renovacao_automatica,
        id_doc_plus: protocol.id_doc_plus || '',
        link_doc_plus: protocol.link_doc_plus || '',
        observacoes: protocol.observacoes || '',
        alteracoes: protocol.alteracoes || '',
        departamento_responsavel_id: protocol.departamento_responsavel_id || '',
        meeting_id: protocol.meeting_id || '',
        agenda_point_id: protocol.agenda_point_id || '',
        decision_id: protocol.decision_id || '',
      });
      setSelectedMeetingId(protocol.meeting_id || '');
      setSelectedAgendaPointId(protocol.agenda_point_id || '');
    } else if (newOpen && !protocol) {
      setFormData({
        versao: '',
        nome: '',
        divulgacao_existencia: false,
        divulgacao_conteudo: false,
        em_vigor: true,
        data_celebracao: '',
        data_producao_efeitos: '',
        decisor: '',
        data_aprovacao: '',
        tipo_ambito: '',
        tema: '',
        objeto: '',
        data_termo: '',
        renovacao_automatica: false,
        id_doc_plus: '',
        link_doc_plus: '',
        observacoes: '',
        alteracoes: '',
        departamento_responsavel_id: '',
        meeting_id: '',
        agenda_point_id: '',
        decision_id: '',
      });
      setSelectedMeetingId('');
      setSelectedAgendaPointId('');
    }
    onOpenChange(newOpen);
  };

  const handleMeetingChange = (meetingId: string) => {
    const actualMeetingId = meetingId === "_none" ? '' : meetingId;
    setSelectedMeetingId(actualMeetingId);
    setSelectedAgendaPointId('');
    setFormData({ 
      ...formData, 
      meeting_id: actualMeetingId, 
      agenda_point_id: '', 
      decision_id: '' 
    });
  };

  const handleAgendaPointChange = (agendaPointId: string) => {
    const actualAgendaPointId = agendaPointId === "_none" ? '' : agendaPointId;
    setSelectedAgendaPointId(actualAgendaPointId);
    setFormData({ 
      ...formData, 
      agenda_point_id: actualAgendaPointId, 
      decision_id: '' 
    });
  };

  const handleDecisionChange = (decisionId: string) => {
    const actualDecisionId = decisionId === "_none" ? '' : decisionId;
    setFormData({ ...formData, decision_id: actualDecisionId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      data_celebracao: formData.data_celebracao || null,
      data_producao_efeitos: formData.data_producao_efeitos || null,
      data_aprovacao: formData.data_aprovacao || null,
      data_termo: formData.data_termo || null,
      departamento_responsavel_id: formData.departamento_responsavel_id || null,
      meeting_id: formData.meeting_id || null,
      agenda_point_id: formData.agenda_point_id || null,
      decision_id: formData.decision_id || null,
    };

    await onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {protocol ? 'Editar Protocolo' : 'Novo Protocolo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="versao">Versão</Label>
              <Input
                id="versao"
                value={formData.versao}
                onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_ambito">Tipo e Âmbito</Label>
              <Input
                id="tipo_ambito"
                value={formData.tipo_ambito}
                onChange={(e) => setFormData({ ...formData, tipo_ambito: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tema">Tema</Label>
              <Input
                id="tema"
                value={formData.tema}
                onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objeto">Objeto</Label>
            <Textarea
              id="objeto"
              value={formData.objeto}
              onChange={(e) => setFormData({ ...formData, objeto: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          {/* Associação com Reunião CA */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h4 className="font-medium text-sm">Associação com Reunião CA</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting">Reunião CA</Label>
                <Select 
                  value={formData.meeting_id || "_none"} 
                  onValueChange={handleMeetingChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar reunião..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhuma</SelectItem>
                    {meetings.map((meeting) => (
                      <SelectItem key={meeting.id} value={meeting.id}>
                        {meeting.type} - {format(new Date(meeting.date), "dd/MM/yyyy", { locale: pt })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda_point">Ponto de Agenda</Label>
                <Select 
                  value={formData.agenda_point_id || "_none"} 
                  onValueChange={handleAgendaPointChange}
                  disabled={!selectedMeetingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedMeetingId ? "Selecionar ponto..." : "Selecione uma reunião primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {agendaPoints.map((point) => (
                      <SelectItem key={point.id} value={point.id}>
                        {point.order}. {point.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decision">Decisão</Label>
                <Select 
                  value={formData.decision_id || "_none"} 
                  onValueChange={handleDecisionChange}
                  disabled={!selectedAgendaPointId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedAgendaPointId ? "Selecionar decisão..." : "Selecione um ponto primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhuma</SelectItem>
                    {decisions.map((decision) => (
                      <SelectItem key={decision.id} value={decision.id}>
                        {decision.text.length > 50 ? decision.text.substring(0, 50) + '...' : decision.text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="divulgacao_existencia" className="text-sm">Divulg. Existência</Label>
              <Switch
                id="divulgacao_existencia"
                checked={formData.divulgacao_existencia}
                onCheckedChange={(checked) => setFormData({ ...formData, divulgacao_existencia: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="divulgacao_conteudo" className="text-sm">Divulg. Conteúdo</Label>
              <Switch
                id="divulgacao_conteudo"
                checked={formData.divulgacao_conteudo}
                onCheckedChange={(checked) => setFormData({ ...formData, divulgacao_conteudo: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="em_vigor" className="text-sm">Em Vigor</Label>
              <Switch
                id="em_vigor"
                checked={formData.em_vigor}
                onCheckedChange={(checked) => setFormData({ ...formData, em_vigor: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="renovacao_automatica" className="text-sm">Renovação Auto.</Label>
              <Switch
                id="renovacao_automatica"
                checked={formData.renovacao_automatica}
                onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked })}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_celebracao">Data de Celebração</Label>
              <Input
                id="data_celebracao"
                type="date"
                value={formData.data_celebracao}
                onChange={(e) => setFormData({ ...formData, data_celebracao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_producao_efeitos">Data Prod. Efeitos</Label>
              <Input
                id="data_producao_efeitos"
                type="date"
                value={formData.data_producao_efeitos}
                onChange={(e) => setFormData({ ...formData, data_producao_efeitos: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_aprovacao">Data de Aprovação</Label>
              <Input
                id="data_aprovacao"
                type="date"
                value={formData.data_aprovacao}
                onChange={(e) => setFormData({ ...formData, data_aprovacao: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_termo">Data de Termo</Label>
              <Input
                id="data_termo"
                type="date"
                value={formData.data_termo}
                onChange={(e) => setFormData({ ...formData, data_termo: e.target.value })}
              />
            </div>
          </div>

          {/* Decisor and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decisor">Decisor</Label>
              <Input
                id="decisor"
                value={formData.decisor}
                onChange={(e) => setFormData({ ...formData, decisor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento Responsável</Label>
              <Select 
                value={formData.departamento_responsavel_id || "_none"} 
                onValueChange={(value) => setFormData({ ...formData, departamento_responsavel_id: value === "_none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar departamento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {pelouros.map((pelouro) => (
                    <SelectItem key={pelouro.id} value={pelouro.id}>
                      {pelouro.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DOC+ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id_doc_plus">ID DOC+</Label>
              <Input
                id="id_doc_plus"
                value={formData.id_doc_plus}
                onChange={(e) => setFormData({ ...formData, id_doc_plus: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_doc_plus">Link DOC+</Label>
              <Input
                id="link_doc_plus"
                type="url"
                value={formData.link_doc_plus}
                onChange={(e) => setFormData({ ...formData, link_doc_plus: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Observations and Changes */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alteracoes">Alterações</Label>
            <Textarea
              id="alteracoes"
              value={formData.alteracoes}
              onChange={(e) => setFormData({ ...formData, alteracoes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.nome}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {protocol ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
