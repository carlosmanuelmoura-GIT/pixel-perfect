import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Users2, 
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package
} from 'lucide-react';
import { useGruposTrabalho, useCreateGrupoTrabalho, useUpdateGrupoTrabalho, useDeleteGrupoTrabalho } from '@/hooks/useGruposTrabalho';
import { useEntregaveis, useCreateEntregavel, useUpdateEntregavel, useDeleteEntregavel } from '@/hooks/useEntregaveis';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type WorkGroupStatus = 'aberto' | 'inativo' | 'fechado';
type DeliverableStatus = 'Em trabalho' | 'Entregue';

interface GrupoTrabalho {
  id: string;
  codigo: string;
  status: WorkGroupStatus;
  designacao: string;
  tema: string | null;
  divulgar_existencia: boolean;
  observacoes_secap: string | null;
  created_at: string;
  updated_at: string;
}

interface Entregavel {
  id: string;
  grupo_trabalho_id: string;
  codigo: string | null;
  descricao: string;
  ponto_situacao: string | null;
  decisor: string | null;
  data_entregavel: string | null;
  num_doc_plus: string | null;
  divulgar_entregavel: boolean;
  criacao: boolean;
  encerramento: boolean;
  link_doc: string | null;
  notas_secap: string | null;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<WorkGroupStatus, string> = {
  aberto: 'Aberto',
  inativo: 'Inativo',
  fechado: 'Fechado',
};

const statusColors: Record<WorkGroupStatus, string> = {
  aberto: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inativo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const deliverableStatusColors: Record<DeliverableStatus, string> = {
  'Em trabalho': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Entregue': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const emptyGrupo: Omit<GrupoTrabalho, 'id' | 'created_at' | 'updated_at'> = {
  codigo: '',
  status: 'aberto',
  designacao: '',
  tema: '',
  divulgar_existencia: false,
  observacoes_secap: '',
};

const emptyEntregavel: Omit<Entregavel, 'id' | 'grupo_trabalho_id' | 'created_at' | 'updated_at'> = {
  codigo: '',
  descricao: '',
  ponto_situacao: '',
  decisor: '',
  data_entregavel: null,
  num_doc_plus: '',
  divulgar_entregavel: false,
  criacao: false,
  encerramento: false,
  link_doc: '',
  notas_secap: '',
  status: 'Em trabalho',
};

export default function GruposTrabalho() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkGroupStatus | 'todos'>('todos');
  const [isGrupoDialogOpen, setIsGrupoDialogOpen] = useState(false);
  const [isEntregavelDialogOpen, setIsEntregavelDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoTrabalho | null>(null);
  const [editingEntregavel, setEditingEntregavel] = useState<Entregavel | null>(null);
  const [grupoFormData, setGrupoFormData] = useState(emptyGrupo);
  const [entregavelFormData, setEntregavelFormData] = useState(emptyEntregavel);
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null);
  const [expandedGrupos, setExpandedGrupos] = useState<Set<string>>(new Set());
  const [deleteGrupoId, setDeleteGrupoId] = useState<string | null>(null);
  const [deleteEntregavelId, setDeleteEntregavelId] = useState<string | null>(null);

  const { data: grupos = [], isLoading: loadingGrupos } = useGruposTrabalho();
  const { data: entregaveis = [], isLoading: loadingEntregaveis } = useEntregaveis();
  const createGrupo = useCreateGrupoTrabalho();
  const updateGrupo = useUpdateGrupoTrabalho();
  const deleteGrupo = useDeleteGrupoTrabalho();
  const createEntregavel = useCreateEntregavel();
  const updateEntregavel = useUpdateEntregavel();
  const deleteEntregavel = useDeleteEntregavel();

  const filteredGrupos = grupos.filter((grupo) => {
    const matchesSearch = 
      grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.designacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grupo.tema?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'todos' || grupo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getEntregaveisByGrupo = (grupoId: string) => {
    return entregaveis.filter(e => e.grupo_trabalho_id === grupoId);
  };

  const toggleExpand = (grupoId: string) => {
    const newExpanded = new Set(expandedGrupos);
    if (newExpanded.has(grupoId)) {
      newExpanded.delete(grupoId);
    } else {
      newExpanded.add(grupoId);
    }
    setExpandedGrupos(newExpanded);
  };

  const handleOpenGrupoDialog = (grupo?: GrupoTrabalho) => {
    if (grupo) {
      setEditingGrupo(grupo);
      setGrupoFormData({
        codigo: grupo.codigo,
        status: grupo.status,
        designacao: grupo.designacao,
        tema: grupo.tema || '',
        divulgar_existencia: grupo.divulgar_existencia,
        observacoes_secap: grupo.observacoes_secap || '',
      });
    } else {
      setEditingGrupo(null);
      setGrupoFormData(emptyGrupo);
    }
    setIsGrupoDialogOpen(true);
  };

  const handleOpenEntregavelDialog = (grupoId: string, entregavel?: Entregavel) => {
    setSelectedGrupoId(grupoId);
    if (entregavel) {
      setEditingEntregavel(entregavel);
      setEntregavelFormData({
        codigo: entregavel.codigo || '',
        descricao: entregavel.descricao,
        ponto_situacao: entregavel.ponto_situacao || '',
        decisor: entregavel.decisor || '',
        data_entregavel: entregavel.data_entregavel,
        num_doc_plus: entregavel.num_doc_plus || '',
        divulgar_entregavel: entregavel.divulgar_entregavel,
        criacao: entregavel.criacao,
        encerramento: entregavel.encerramento,
        link_doc: entregavel.link_doc || '',
        notas_secap: entregavel.notas_secap || '',
        status: entregavel.status,
      });
    } else {
      setEditingEntregavel(null);
      setEntregavelFormData(emptyEntregavel);
    }
    setIsEntregavelDialogOpen(true);
  };

  const handleSaveGrupo = async () => {
    const data = {
      codigo: grupoFormData.codigo,
      status: grupoFormData.status,
      designacao: grupoFormData.designacao,
      tema: grupoFormData.tema || null,
      divulgar_existencia: grupoFormData.divulgar_existencia,
      observacoes_secap: grupoFormData.observacoes_secap || null,
    };

    if (editingGrupo) {
      await updateGrupo.mutateAsync({ id: editingGrupo.id, ...data });
    } else {
      await createGrupo.mutateAsync(data);
    }
    setIsGrupoDialogOpen(false);
  };

  const handleSaveEntregavel = async () => {
    if (!selectedGrupoId) return;

    const data = {
      grupo_trabalho_id: selectedGrupoId,
      codigo: entregavelFormData.codigo || null,
      descricao: entregavelFormData.descricao,
      ponto_situacao: entregavelFormData.ponto_situacao || null,
      decisor: entregavelFormData.decisor || null,
      data_entregavel: entregavelFormData.data_entregavel,
      num_doc_plus: entregavelFormData.num_doc_plus || null,
      divulgar_entregavel: entregavelFormData.divulgar_entregavel,
      criacao: entregavelFormData.criacao,
      encerramento: entregavelFormData.encerramento,
      link_doc: entregavelFormData.link_doc || null,
      notas_secap: entregavelFormData.notas_secap || null,
      status: entregavelFormData.status,
    };

    if (editingEntregavel) {
      await updateEntregavel.mutateAsync({ id: editingEntregavel.id, ...data });
    } else {
      await createEntregavel.mutateAsync(data);
    }
    setIsEntregavelDialogOpen(false);
  };

  const handleDeleteGrupo = async () => {
    if (deleteGrupoId) {
      await deleteGrupo.mutateAsync(deleteGrupoId);
      setDeleteGrupoId(null);
    }
  };

  const handleDeleteEntregavel = async () => {
    if (deleteEntregavelId) {
      await deleteEntregavel.mutateAsync(deleteEntregavelId);
      setDeleteEntregavelId(null);
    }
  };

  return (
    <AppLayout title="Grupos de Trabalho" subtitle="Gestão de grupos de trabalho e entregáveis">
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={() => handleOpenGrupoDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por código, designação ou tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WorkGroupStatus | 'todos')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Groups List */}
        <div className="space-y-4">
          {loadingGrupos ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                A carregar grupos de trabalho...
              </CardContent>
            </Card>
          ) : filteredGrupos.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Users2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum grupo de trabalho encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredGrupos.map((grupo) => {
              const grupoEntregaveis = getEntregaveisByGrupo(grupo.id);
              const isExpanded = expandedGrupos.has(grupo.id);

              return (
                <Card key={grupo.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleExpand(grupo.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{grupo.designacao}</CardTitle>
                            <Badge className={statusColors[grupo.status]}>
                              {statusLabels[grupo.status]}
                            </Badge>
                            {grupo.divulgar_existencia && (
                              <Badge variant="outline">Divulgável</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Código: {grupo.codigo}</span>
                            {grupo.tema && <span>• Tema: {grupo.tema}</span>}
                            <span>• {grupoEntregaveis.length} entregáveis</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEntregavelDialog(grupo.id)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Entregável
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenGrupoDialog(grupo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteGrupoId(grupo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      {grupo.observacoes_secap && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Observações SECAP:</p>
                          <p className="text-sm text-muted-foreground">{grupo.observacoes_secap}</p>
                        </div>
                      )}

                      {grupoEntregaveis.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum entregável registado
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">ID</TableHead>
                                <TableHead>Entregável</TableHead>
                                <TableHead>Ponto de Situação</TableHead>
                                <TableHead>Decisor</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="w-24">N.º DOC+</TableHead>
                                <TableHead className="text-center w-16">Div.</TableHead>
                                <TableHead className="text-center w-16">Cria.</TableHead>
                                <TableHead className="text-center w-16">Enc.</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {grupoEntregaveis.map((entregavel) => (
                                <TableRow key={entregavel.id}>
                                  <TableCell className="font-mono text-xs">
                                    {entregavel.codigo || '-'}
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="truncate" title={entregavel.descricao}>
                                      {entregavel.descricao}
                                    </div>
                                    {entregavel.notas_secap && (
                                      <p className="text-xs text-muted-foreground truncate" title={entregavel.notas_secap}>
                                        {entregavel.notas_secap}
                                      </p>
                                    )}
                                  </TableCell>
                                  <TableCell className="max-w-32">
                                    <span className="truncate block" title={entregavel.ponto_situacao || ''}>
                                      {entregavel.ponto_situacao || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>{entregavel.decisor || '-'}</TableCell>
                                  <TableCell>
                                    {entregavel.data_entregavel 
                                      ? format(new Date(entregavel.data_entregavel), 'dd/MM/yyyy', { locale: pt })
                                      : '-'
                                    }
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {entregavel.num_doc_plus || '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {entregavel.divulgar_entregavel ? '✓' : '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {entregavel.criacao ? '✓' : '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {entregavel.encerramento ? '✓' : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={deliverableStatusColors[entregavel.status]}>
                                      {entregavel.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {entregavel.link_doc && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          asChild
                                        >
                                          <a href={entregavel.link_doc} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-4 w-4" />
                                          </a>
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleOpenEntregavelDialog(grupo.id, entregavel)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setDeleteEntregavelId(entregavel.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Grupo Dialog */}
      <Dialog open={isGrupoDialogOpen} onOpenChange={setIsGrupoDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? 'Editar Grupo de Trabalho' : 'Novo Grupo de Trabalho'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Nº/Código *</Label>
                <Input
                  id="codigo"
                  value={grupoFormData.codigo}
                  onChange={(e) => setGrupoFormData({ ...grupoFormData, codigo: e.target.value })}
                  placeholder="Ex: GT-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado *</Label>
                <Select 
                  value={grupoFormData.status} 
                  onValueChange={(value) => setGrupoFormData({ ...grupoFormData, status: value as WorkGroupStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designacao">Designação *</Label>
              <Input
                id="designacao"
                value={grupoFormData.designacao}
                onChange={(e) => setGrupoFormData({ ...grupoFormData, designacao: e.target.value })}
                placeholder="Nome do grupo de trabalho"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema</Label>
              <Input
                id="tema"
                value={grupoFormData.tema || ''}
                onChange={(e) => setGrupoFormData({ ...grupoFormData, tema: e.target.value })}
                placeholder="Tema do grupo"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="divulgar"
                checked={grupoFormData.divulgar_existencia}
                onCheckedChange={(checked) => setGrupoFormData({ ...grupoFormData, divulgar_existencia: checked })}
              />
              <Label htmlFor="divulgar">Divulgar existência</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações SECAP</Label>
              <Textarea
                id="observacoes"
                value={grupoFormData.observacoes_secap || ''}
                onChange={(e) => setGrupoFormData({ ...grupoFormData, observacoes_secap: e.target.value })}
                placeholder="Observações internas..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrupoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGrupo}
              disabled={!grupoFormData.codigo || !grupoFormData.designacao || createGrupo.isPending || updateGrupo.isPending}
            >
              {editingGrupo ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entregavel Dialog */}
      <Dialog open={isEntregavelDialogOpen} onOpenChange={setIsEntregavelDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntregavel ? 'Editar Entregável' : 'Novo Entregável'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ent-codigo">ID/Código</Label>
                <Input
                  id="ent-codigo"
                  value={entregavelFormData.codigo || ''}
                  onChange={(e) => setEntregavelFormData({ ...entregavelFormData, codigo: e.target.value })}
                  placeholder="Ex: E-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent-status">Estado *</Label>
                <Select 
                  value={entregavelFormData.status} 
                  onValueChange={(value) => setEntregavelFormData({ ...entregavelFormData, status: value as DeliverableStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em trabalho">Em trabalho</SelectItem>
                    <SelectItem value="Entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ent-descricao">Entregável *</Label>
              <Textarea
                id="ent-descricao"
                value={entregavelFormData.descricao}
                onChange={(e) => setEntregavelFormData({ ...entregavelFormData, descricao: e.target.value })}
                placeholder="Descrição do entregável"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ent-situacao">Ponto de Situação</Label>
              <Textarea
                id="ent-situacao"
                value={entregavelFormData.ponto_situacao || ''}
                onChange={(e) => setEntregavelFormData({ ...entregavelFormData, ponto_situacao: e.target.value })}
                placeholder="Estado atual do entregável..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ent-decisor">Decisor</Label>
                <Input
                  id="ent-decisor"
                  value={entregavelFormData.decisor || ''}
                  onChange={(e) => setEntregavelFormData({ ...entregavelFormData, decisor: e.target.value })}
                  placeholder="Nome do decisor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent-data">Data do Entregável</Label>
                <Input
                  id="ent-data"
                  type="date"
                  value={entregavelFormData.data_entregavel ? format(new Date(entregavelFormData.data_entregavel), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setEntregavelFormData({ 
                    ...entregavelFormData, 
                    data_entregavel: e.target.value ? new Date(e.target.value).toISOString() : null 
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ent-doc-plus">N.º documento DOC+</Label>
                <Input
                  id="ent-doc-plus"
                  value={entregavelFormData.num_doc_plus || ''}
                  onChange={(e) => setEntregavelFormData({ ...entregavelFormData, num_doc_plus: e.target.value })}
                  placeholder="Número do documento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ent-link">Link DOC</Label>
                <Input
                  id="ent-link"
                  type="url"
                  value={entregavelFormData.link_doc || ''}
                  onChange={(e) => setEntregavelFormData({ ...entregavelFormData, link_doc: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ent-divulgar"
                  checked={entregavelFormData.divulgar_entregavel}
                  onCheckedChange={(checked) => setEntregavelFormData({ ...entregavelFormData, divulgar_entregavel: !!checked })}
                />
                <Label htmlFor="ent-divulgar">Divulgar entregável</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ent-criacao"
                  checked={entregavelFormData.criacao}
                  onCheckedChange={(checked) => setEntregavelFormData({ ...entregavelFormData, criacao: !!checked })}
                />
                <Label htmlFor="ent-criacao">Criação</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ent-encerramento"
                  checked={entregavelFormData.encerramento}
                  onCheckedChange={(checked) => setEntregavelFormData({ ...entregavelFormData, encerramento: !!checked })}
                />
                <Label htmlFor="ent-encerramento">Encerramento</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ent-notas">Notas SECAP</Label>
              <Textarea
                id="ent-notas"
                value={entregavelFormData.notas_secap || ''}
                onChange={(e) => setEntregavelFormData({ ...entregavelFormData, notas_secap: e.target.value })}
                placeholder="Notas internas..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntregavelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEntregavel}
              disabled={!entregavelFormData.descricao || createEntregavel.isPending || updateEntregavel.isPending}
            >
              {editingEntregavel ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Grupo Confirmation */}
      <AlertDialog open={!!deleteGrupoId} onOpenChange={() => setDeleteGrupoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Grupo de Trabalho</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este grupo de trabalho? Esta ação irá também eliminar todos os entregáveis associados e não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGrupo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entregavel Confirmation */}
      <AlertDialog open={!!deleteEntregavelId} onOpenChange={() => setDeleteEntregavelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Entregável</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar este entregável? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntregavel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
