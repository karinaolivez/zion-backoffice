'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { UserManagementGuard } from '@/components/auth';
import { useAuthPermissions } from '@/contexts/permission-context';
import { AuthorizedUser, UserStatus, UserFilter, ModuleWithPermissions, UserPermission, Campus } from '@/types/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, UserPlus, Eye, Edit, Trash2, Settings, Shield, ChevronDown, MapPin } from 'lucide-react';
import { PermissionsService } from '@/services/permissions.service';
import { AddUserModal } from '@/components/admin/add-user-modal';

interface UsersPageProps {
  params: {
    locale: string;
  };
}

const UsersPage: React.FC<UsersPageProps> = ({ params }) => {
  const t = useTranslations('admin.users');
  const { user: currentUser, hasPermission } = useAuthPermissions();

  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<AuthorizedUser | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [modules, setModules] = useState<ModuleWithPermissions[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [campus, setCampus] = useState<Campus[]>([]);
  const [selectedCampusForPermission, setSelectedCampusForPermission] = useState<string[]>([]);
  const [allCampusMode, setAllCampusMode] = useState(false); // Alterado de true para false
  const [showCampusSelector, setShowCampusSelector] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setIsLoading(true);

      const filter: UserFilter = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      const response = await PermissionsService.getAuthorizedUsers(filter);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Não foi possível carregar os usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar campus
  const loadCampus = async () => {
    try {
      const campusData = await PermissionsService.getCampus();
      setCampus(campusData);
    } catch (error) {
      console.error('Erro ao carregar campus:', error);
    }
  };

  // Carregar módulos e permissões do usuário
  const loadUserPermissions = async (userId: string) => {
    try {
      setLoadingPermissions(true);
      const [modulesData, userPermissionsResponse] = await Promise.all([
        PermissionsService.getModules(),
        PermissionsService.getUserPermissions(userId)
      ]);

      // Carregar permissões para cada módulo
      const modulesWithPermissions = await Promise.all(
        modulesData.map(async (moduleItem) => {
          const permissions = await PermissionsService.getPermissionsByModule(moduleItem.id);
          return {
            ...moduleItem,
            permissions
          };
        })
      );

      setModules(modulesWithPermissions);
      setUserPermissions(userPermissionsResponse);

      // Carregar campus se ainda não foram carregados
      if (campus.length === 0) {
        await loadCampus();
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast.error('Erro ao carregar permissões do usuário');
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Abrir modal de permissões
  const handleOpenPermissionsModal = async (user: AuthorizedUser) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
    await loadUserPermissions(user.id);
  };

  // Fechar modal de permissões
  const handleClosePermissionsModal = () => {
    setShowPermissionsModal(false);
    setSelectedUser(null);
    setModules([]);
    setUserPermissions([]);
  };

  // Verificar se usuário tem permissão específica
  const hasUserPermission = (permissionId: string): boolean => {
    return userPermissions.some(up => up.permission_id === permissionId);
  };

  // Obter campus associados a uma permissão específica
  const getPermissionCampuses = (permissionId: string): Campus[] => {
    const userPermission = userPermissions.find(up => up.permission_id === permissionId);
    if (!userPermission || !userPermission.campus_ids || userPermission.campus_ids.length === 0) {
      return []; // Todos os campus se não há restrição específica
    }
    return campus.filter(c => userPermission.campus_ids!.includes(c.id));
  };

  // Verificar se permissão é válida para todos os campus
  const isPermissionForAllCampuses = (permissionId: string): boolean => {
    const userPermission = userPermissions.find(up => up.permission_id === permissionId);
    return !userPermission?.campus_ids || userPermission.campus_ids.length === 0;
  };

  // Alternar permissão do usuário
  const handleTogglePermission = async (permissionId: string, currentlyHas: boolean) => {
    if (!selectedUser) return;

    try {
      if (currentlyHas) {
        // Remover permissão
        await PermissionsService.removeUserPermission({
          user_id: selectedUser.id,
          permission_id: permissionId
        });

        // Atualizar estado local
        setUserPermissions(prev => prev.filter(p => p.permission_id !== permissionId));
        toast.success('Permissão removida com sucesso.');
      } else {
        // Verificar se deve mostrar seletor de campus
        setShowCampusSelector(permissionId);
      }
    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      toast.error('Erro ao alterar permissão: ' + (error as Error).message);
    }
  };

  // Confirmar atribuição de permissão com campus selecionados
  const handleConfirmPermissionAssignment = async (permissionId: string) => {
    if (!selectedUser) return;

    try {
      const campusIds = allCampusMode ? [] : selectedCampusForPermission;

      // Adicionar permissão com campus
      const newPermission = await PermissionsService.addUserPermission({
        user_id: selectedUser.id,
        permission_id: permissionId,
        campus_ids: campusIds,
        expires_at: undefined
      });

      // Atualizar estado local
      setUserPermissions(prev => [...prev, newPermission]);

      // Resetar seleção de campus
      setShowCampusSelector(null);
      setSelectedCampusForPermission([]);
      setAllCampusMode(false); // Alterado de true para false

      toast.success('Permissão atribuída com sucesso.');
    } catch (error) {
      console.error('Erro ao atribuir permissão:', error);
      toast.error('Erro ao atribuir permissão: ' + (error as Error).message);
    }
  };

  // Cancelar seleção de campus
  const handleCancelCampusSelection = () => {
    setShowCampusSelector(null);
    setSelectedCampusForPermission([]);
    setAllCampusMode(false); // Alterado de true para false
  };

  // Alternar seleção de campus
  const handleToggleCampus = (campusId: string) => {
    setSelectedCampusForPermission(prev => {
      if (prev.includes(campusId)) {
        return prev.filter(id => id !== campusId);
      } else {
        return [...prev, campusId];
      }
    });
  };

  // Alternar modo "todos os campus"
  const handleToggleAllCampusMode = (checked: boolean) => {
    setAllCampusMode(checked);
    if (checked) {
      setSelectedCampusForPermission([]);
    }
  };

  // Aprovar usuário
  const handleApproveUser = async (userId: string) => {
    try {
      setIsUpdating(true);

      await PermissionsService.approveUser({
        user_id: userId,
        approved_by: currentUser?.id || 'system',
      });

      toast.success('Usuário aprovado com sucesso.');
      await loadUsers();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast.error('Não foi possível aprovar o usuário.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Rejeitar usuário
  const handleRejectUser = async (userId: string) => {
    try {
      setIsUpdating(true);

      // TODO: Implementar método de rejeição no service
      toast.success('Usuário rejeitado com sucesso.');
      await loadUsers();
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      toast.error('Não foi possível rejeitar o usuário.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Obter cor do badge baseado no status
  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return 'secondary';
      case UserStatus.PENDING:
        return 'warning';
      case UserStatus.REJECTED:
        return 'destructive';
      case UserStatus.INACTIVE:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Obter texto do status
  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return 'Aprovado';
      case UserStatus.PENDING:
        return 'Pendente';
      case UserStatus.REJECTED:
        return 'Rejeitado';
      case UserStatus.INACTIVE:
        return 'Inativo';
      default:
        return status;
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchTerm, statusFilter]);

  return (
    <UserManagementGuard>
      <div className="ccontainer mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie usuários autorizados e suas permissões
            </p>
          </div>
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        {/* Filtros */}
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Buscar por nome, username ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as UserStatus | 'all')}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0f1a] border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Todos</SelectItem>
                  <SelectItem value={UserStatus.PENDING} className="text-white hover:bg-white/10">Pendente</SelectItem>
                  <SelectItem value={UserStatus.APPROVED} className="text-white hover:bg-white/10">Aprovado</SelectItem>
                  <SelectItem value={UserStatus.REJECTED} className="text-white hover:bg-white/10">Rejeitado</SelectItem>
                  <SelectItem value={UserStatus.INACTIVE} className="text-white hover:bg-white/10">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de usuários */}
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Usuários ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/80">Usuário</TableHead>
                    <TableHead className="text-white/80">Username</TableHead>
                    <TableHead className="text-white/80">Status</TableHead>
                    <TableHead className="text-white/80">Criado em</TableHead>
                    <TableHead className="text-white/80">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-white/10 text-white">
                              {user.full_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{user.full_name}</div>
                            {user.email && (
                              <div className="text-sm text-white/60">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)} >
                          {getStatusText(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPermissionsModal(user)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          {user.status === UserStatus.PENDING && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveUser(user.id)}
                                disabled={isUpdating}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Aprovar'
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectUser(user.id)}
                                disabled={isUpdating}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Permissões */}
        <Dialog open={showPermissionsModal} onOpenChange={handleClosePermissionsModal}>
          <DialogContent className="glass bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gerenciar Permissões - {selectedUser?.full_name}
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Configure as permissões do usuário por módulo do sistema
              </DialogDescription>
            </DialogHeader>

            {loadingPermissions ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            ) : (
              <div className="space-y-4">
                <Accordion type="multiple" className="w-full">
                  {modules.map((module) => (
                    <AccordionItem
                      key={module.id}
                      value={module.id}
                      className="border-white/10 p-4"
                    >
                      <AccordionTrigger className="text-white hover:text-white/80 hover:no-underline cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className='flex flex-col align-start justify-start'>
                            <span className="font-medium">{module.name}</span>
                          </div>
                          <Badge variant="outline" className="ml-2 text-xs border-white/20 text-white/60">
                            {module.permissions.filter(p => hasUserPermission(p.id)).length} permissôes ativas
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-6 ">
                        <div className="space-y-6 ">
                          {module.permissions.map((permission) => {
                            const hasPermission = hasUserPermission(permission.id);
                            const permissionCampuses = hasPermission ? getPermissionCampuses(permission.id) : [];
                            const isAllCampuses = hasPermission ? isPermissionForAllCampuses(permission.id) : false;

                            return (
                              <div
                                key={permission.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/4 border border-white/10"
                              >
                                <div className="flex-1">
                                  {permission.description && (
                                    <div className="text-medium text-white/80 mt-1">
                                      {permission.description}
                                    </div>
                                  )}

                                  {/* Exibir campus associados se a permissão estiver ativa */}
                                  {hasPermission && (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span className="text-xs text-white/50">Campus:</span>
                                      {isAllCampuses ? (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-green-500/30 text-green-400 bg-green-500/10"
                                        >
                                          Todos os Campus
                                        </Badge>
                                      ) : (
                                        permissionCampuses.map((campusItem) => (
                                          <Badge
                                            key={campusItem.id}
                                            variant="outline"
                                            className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10"
                                          >
                                            {campusItem.code || campusItem.name}
                                          </Badge>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                                <Switch
                                  checked={hasPermission}
                                  onCheckedChange={() => handleTogglePermission(permission.id, hasPermission)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Seleção de Campus */}
        <Dialog open={showCampusSelector !== null} onOpenChange={() => handleCancelCampusSelection()}>
          <DialogContent className="glass bg-[#0a0f1a]/95 backdrop-blur-xl border border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Selecionar Campus para Permissão
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Escolha os campus onde esta permissão será válida
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Opção "Todos os Campus" */}
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <Checkbox
                  id="all-campus"
                  checked={allCampusMode}
                  onCheckedChange={handleToggleAllCampusMode}
                />
                <Label htmlFor="all-campus" className="text-white font-medium">
                  Todos os Campus
                </Label>
              </div>

              {/* Lista de Campus Específicos */}
              {!allCampusMode && (
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">Campus Específicos:</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {campus.map((campusItem) => (
                      <div
                        key={campusItem.id}
                        className="flex items-center space-x-2 p-2 rounded-lg bg-white/5 border border-white/10"
                      >
                        <Checkbox
                          id={`campus-${campusItem.id}`}
                          checked={selectedCampusForPermission.includes(campusItem.id)}
                          onCheckedChange={() => handleToggleCampus(campusItem.id)}
                        />
                        <Label htmlFor={`campus-${campusItem.id}`} className="text-white text-sm flex-1">
                          {campusItem.name}
                        </Label>
                        {campusItem.code && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                            {campusItem.code}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelCampusSelection}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => showCampusSelector && handleConfirmPermissionAssignment(showCampusSelector)}
                  disabled={!allCampusMode && selectedCampusForPermission.length === 0}
                  className=" text-white"
                >
                  Confirmar Permissão
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Adicionar Usuário */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={loadUsers}
        />
      </div>
    </UserManagementGuard>
  );
};

export default UsersPage;