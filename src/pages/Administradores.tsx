import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  Loader2, 
  Pencil, 
  Trash2,
  Shield,
  Mail,
  Settings,
  Briefcase
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  useAdministrators,
  useCreateAdministrator,
  useUpdateAdministrator,
  useDeleteAdministrator,
  usePelouros,
  useCreatePelouro,
  useUpdatePelouro,
  useDeletePelouro,
  useUserRoles,
  useProfiles,
  useUpdateUserRole,
  useSetAdministratorPelouros
} from '@/hooks/useSupabaseData';
import type { Administrator, Pelouro, UserRole, AppRole, Profile } from '@/types/database';
import { cn } from '@/lib/utils';

const roleLabels: Record<AppRole, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-status-critical/10 text-status-critical' },
  sec: { label: 'Secretariado', color: 'bg-status-warning/10 text-status-warning' },
  gestao: { label: 'Gestão', color: 'bg-status-info/10 text-status-info' },
  leitor: { label: 'Leitor', color: 'bg-muted text-muted-foreground' },
};

const appRoles: AppRole[] = ['admin', 'sec', 'gestao', 'leitor'];

export default function Administradores() {
  const [activeTab, setActiveTab] = useState('administrators');

  return (
    <AppLayout title="Administradores e Configurações" subtitle="Gestão de utilizadores, roles e configurações">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="administrators" className="gap-2">
            <Users className="w-4 h-4" />
            Administradores
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="w-4 h-4" />
            Utilizadores & Roles
          </TabsTrigger>
          <TabsTrigger value="pelouros" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Departamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="administrators">
          <AdministratorsTab />
        </TabsContent>

        <TabsContent value="roles">
          <UserRolesTab />
        </TabsContent>

        <TabsContent value="pelouros">
          <PelourosTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

// Administrators Tab
function AdministratorsTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<Administrator | null>(null);
  
  const { data: administrators = [], isLoading } = useAdministrators();
  const createAdmin = useCreateAdministrator();
  const updateAdmin = useUpdateAdministrator();
  const deleteAdminMutation = useDeleteAdministrator();

  const handleCreate = () => {
    setEditingAdmin(null);
    setIsFormOpen(true);
  };

  const handleEdit = (admin: Administrator) => {
    setEditingAdmin(admin);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteAdmin) {
      await deleteAdminMutation.mutateAsync(deleteAdmin.id);
      setDeleteAdmin(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Administradores</h3>
          <p className="text-sm text-muted-foreground">Gestão dos administradores do Conselho de Administração</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Administrador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {administrators.map((admin, index) => {
          const adminPelouros = (admin as any).administrator_pelouros?.map((ap: any) => ap.pelouro?.name).filter(Boolean);
          return (
            <div 
              key={admin.id}
              className={cn(
                "bg-card rounded-xl border border-border/50 p-5 shadow-card",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {admin.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{admin.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {admin.email}
                    </p>
                    {adminPelouros && adminPelouros.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {adminPelouros.map((name: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(admin)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAdmin(admin)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {administrators.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum administrador encontrado</p>
        </div>
      )}

      {/* Form */}
      <AdministratorForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        administrator={editingAdmin}
        onCreate={createAdmin.mutateAsync}
        onUpdate={updateAdmin.mutateAsync}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAdmin} onOpenChange={(open) => !open && setDeleteAdmin(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Administrador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{deleteAdmin?.name}"? Esta ação não pode ser revertida.
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
    </div>
  );
}

function AdministratorForm({
  open,
  onOpenChange,
  administrator,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  administrator: Administrator | null;
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const { data: pelouros = [] } = usePelouros();
  const setAdminPelouros = useSetAdministratorPelouros();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [selectedPelouros, setSelectedPelouros] = useState<string[]>([]);

  useEffect(() => {
    if (administrator) {
      setFormData({
        name: administrator.name,
        email: administrator.email,
      });
      const adminPelouros = (administrator as any).administrator_pelouros?.map((ap: any) => ap.pelouro_id) || [];
      setSelectedPelouros(adminPelouros);
    } else {
      setFormData({
        name: '',
        email: '',
      });
      setSelectedPelouros([]);
    }
  }, [administrator, open]);

  const handleTogglePelouro = (pelouroId: string) => {
    setSelectedPelouros(prev => 
      prev.includes(pelouroId) 
        ? prev.filter(id => id !== pelouroId)
        : [...prev, pelouroId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let adminId = administrator?.id;
    
    if (administrator) {
      await onUpdate({ id: administrator.id, ...formData });
    } else {
      const result = await onCreate(formData);
      adminId = result?.id;
    }
    
    // Save pelouros relationship
    if (adminId) {
      await setAdminPelouros.mutateAsync({ administratorId: adminId, pelouroIds: selectedPelouros });
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{administrator ? 'Editar Administrador' : 'Novo Administrador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Pelouro(s)</Label>
            <p className="text-xs text-muted-foreground mb-2">Selecione os pelouros associados a este administrador</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {pelouros.map((pelouro) => {
                const isSelected = selectedPelouros.includes(pelouro.id);
                return (
                  <label 
                    key={pelouro.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => handleTogglePelouro(pelouro.id)}
                    />
                    <span className="text-sm">{pelouro.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {administrator ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// User Roles Tab
function UserRolesTab() {
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const updateRole = useUpdateUserRole();

  const usersWithRoles = useMemo(() => {
    return profiles.map(profile => {
      const role = userRoles.find(r => r.user_id === profile.user_id);
      return { ...profile, role: role?.role || 'leitor', roleId: role?.id };
    });
  }, [profiles, userRoles]);

  const handleRoleChange = async (roleId: string | undefined, newRole: AppRole, userId: string) => {
    if (roleId) {
      await updateRole.mutateAsync({ id: roleId, role: newRole });
    }
  };

  if (rolesLoading || profilesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Utilizadores & Roles</h3>
        <p className="text-sm text-muted-foreground">Gestão de permissões dos utilizadores do sistema</p>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="divide-y divide-border/50">
          {usersWithRoles.map((user, index) => (
            <div 
              key={user.id}
              className={cn(
                "p-4 flex items-center justify-between gap-4",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.full_name || 'Sem nome'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              
              <Select 
                value={user.role} 
                onValueChange={(v) => handleRoleChange(user.roleId, v as AppRole, user.user_id)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {appRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", roleLabels[role].color)}>
                          {roleLabels[role].label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {usersWithRoles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum utilizador encontrado</p>
        </div>
      )}
    </div>
  );
}

// Pelouros Tab
function PelourosTab() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPelouro, setEditingPelouro] = useState<Pelouro | null>(null);
  const [deletePelouro, setDeletePelouro] = useState<Pelouro | null>(null);
  
  const { data: pelouros = [], isLoading } = usePelouros();
  const createPelouro = useCreatePelouro();
  const updatePelouro = useUpdatePelouro();
  const deletePelouroMutation = useDeletePelouro();

  const handleCreate = () => {
    setEditingPelouro(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pelouro: Pelouro) => {
    setEditingPelouro(pelouro);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletePelouro) {
      await deletePelouroMutation.mutateAsync(deletePelouro.id);
      setDeletePelouro(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Departamentos</h3>
          <p className="text-sm text-muted-foreground">Gestão dos departamentos da organização</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Departamento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pelouros.map((pelouro, index) => (
          <div 
            key={pelouro.id}
            className={cn(
              "bg-card rounded-xl border border-border/50 p-5 shadow-card",
              "animate-slide-up"
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-foreground">{pelouro.name}</h4>
                {pelouro.description && (
                  <p className="text-sm text-muted-foreground mt-1">{pelouro.description}</p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(pelouro)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeletePelouro(pelouro)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {pelouros.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum departamento encontrado</p>
        </div>
      )}

      {/* Form */}
      <PelouroForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        pelouro={editingPelouro}
        onCreate={createPelouro.mutateAsync}
        onUpdate={updatePelouro.mutateAsync}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePelouro} onOpenChange={(open) => !open && setDeletePelouro(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Departamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar "{deletePelouro?.name}"? Esta ação não pode ser revertida.
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
    </div>
  );
}

function PelouroForm({
  open,
  onOpenChange,
  pelouro,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pelouro: Pelouro | null;
  onCreate: (data: any) => Promise<any>;
  onUpdate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (pelouro) {
      setFormData({
        name: pelouro.name,
        description: pelouro.description || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
      });
    }
  }, [pelouro, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pelouro) {
      await onUpdate({ id: pelouro.id, ...formData });
    } else {
      await onCreate(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pelouro ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {pelouro ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
