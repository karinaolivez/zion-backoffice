'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Search, Settings, Shield, Eye, Loader2, Save, X, ChevronDown } from 'lucide-react';
import { PermissionModule, PermissionAction, ModuleWithPermissions, Action } from '@/types/permissions';
import { PermissionsService } from '@/services/permissions.service';

export default function ModulePermissionsPage() {
  const [modules, setModules] = useState<ModuleWithPermissions[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModuleDialog, setShowCreateModuleDialog] = useState(false);
  const [isCreatingPermission, setIsCreatingPermission] = useState<string | null>(null);
  const [isSubmittingModule, setIsSubmittingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDisplayName, setNewModuleDisplayName] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [newPermissionName, setNewPermissionName] = useState('');
  const [newPermissionDescription, setNewPermissionDescription] = useState('');
  const [selectedActionId, setSelectedActionId] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    displayName?: string;
  }>({});

  const loadModulesAndPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const [modulesData, actionsData] = await Promise.all([
        PermissionsService.getModules(),
        PermissionsService.getActions()
      ]);

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
      setActions(actionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar módulos e permissões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModulesAndPermissions();
  }, [loadModulesAndPermissions]);

  const validateModuleForm = () => {
    const errors: { name?: string; displayName?: string } = {};

    if (!newModuleName.trim()) {
      errors.name = 'Nome do módulo é obrigatório';
    } else if (newModuleName.length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    } else if (!/^[A-Z_]+$/.test(newModuleName)) {
      errors.name = 'Nome deve conter apenas letras maiúsculas e underscore';
    }

    if (!newModuleDisplayName.trim()) {
      errors.displayName = 'Nome de exibição é obrigatório';
    } else if (newModuleDisplayName.length < 2) {
      errors.displayName = 'Nome de exibição deve ter pelo menos 2 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetModuleForm = () => {
    setNewModuleName('');
    setNewModuleDisplayName('');
    setNewModuleDescription('');
    setFormErrors({});
  };

  const handleCreateModule = async () => {
    if (!validateModuleForm()) {
      return;
    }

    // Check for duplicates
    const isDuplicate = modules.some(
      (moduleItem) => moduleItem.name.toLowerCase() === newModuleName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('Já existe um módulo com este nome');
      return;
    }

    try {
      setIsSubmittingModule(true);
      await PermissionsService.createModule({
        name: newModuleName,
        description: newModuleDescription,
        is_active: true
      });

      toast.success('Módulo criado com sucesso');
      resetModuleForm();
      setShowCreateModuleDialog(false);
      loadModulesAndPermissions();
    } catch (error) {
      console.error('Error creating module:', error);
      toast.error('Erro ao criar módulo');
    } finally {
      setIsSubmittingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await PermissionsService.deleteModule(moduleId);
      toast.success('Módulo removido com sucesso');
      loadModulesAndPermissions();
    } catch (error) {
      console.error('Error deleting module:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage.includes('possui permissões associadas')) {
        toast.error('Não é possível excluir um módulo que possui permissões associadas');
      } else {
        toast.error('Erro ao remover módulo');
      }
    }
  };

  const handleCreatePermission = async (moduleId: string) => {
    if (!newPermissionName.trim() || !selectedActionId) {
      toast.error('Nome da permissão e ação são obrigatórios');
      return;
    }

    // Check for duplicates within the module
    const moduleItem = modules.find(m => m.id === moduleId);
    const isDuplicate = moduleItem?.permissions.some(
      (permission) => permission.name.toLowerCase() === newPermissionName.toLowerCase()
    );

    if (isDuplicate) {
      toast.error('Já existe uma permissão com este nome neste módulo');
      return;
    }

    try {
      await PermissionsService.createPermission({
        module_id: moduleId,
        action_id: selectedActionId,
        name: newPermissionName,
        description: newPermissionDescription,
        is_active: true
      });

      toast.success('Permissão criada com sucesso');

      setNewPermissionName('');
      setNewPermissionDescription('');
      setSelectedActionId('');
      setIsCreatingPermission(null);
      loadModulesAndPermissions();
    } catch (error) {
      console.error('Error creating permission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage.includes('duplicate key value violates unique constraint') ||
        errorMessage.includes('permissions_module_id_action_id_key')) {
        toast.error('Não é possível criar uma permissão com uma ação que já está criada para este módulo');
      } else {
        toast.error('Erro ao criar permissão');
      }
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      await PermissionsService.deletePermission(permissionId);
      toast.success('Permissão removida com sucesso');
      loadModulesAndPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (errorMessage.includes('possui permissões associadas') ||
        errorMessage.includes('associated') ||
        errorMessage.includes('constraint')) {
        // Show confirmation dialog for inactivation
        const shouldInactivate = window.confirm(
          'Não é possível excluir uma permissão que possui usuários associados. Deseja inativar esta permissão? Isso impedirá que seja atribuída a novos usuários, mas manterá para quem já possui.'
        );

        if (shouldInactivate) {
          try {
            await PermissionsService.inactivatePermission(permissionId);
            toast.success('Permissão inativada com sucesso');
            loadModulesAndPermissions();
          } catch (inactivateError) {
            console.error('Error inactivating permission:', inactivateError);
            toast.error('Erro ao inativar permissão');
          }
        }
      } else {
        toast.error('Erro ao remover permissão');
      }
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const filteredModules = modules.filter(moduleItem =>
    moduleItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    moduleItem.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Módulos e Permissões</h1>
            <p className="text-white/60 mt-1">
              Gerencie módulos e suas permissões no sistema
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModuleDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Módulo
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                  <Input
                    placeholder="Buscar módulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Module Modal */}
        <Dialog open={showCreateModuleDialog} onOpenChange={setShowCreateModuleDialog}>
          <DialogContent className="glass bg-slate-900/95 backdrop-blur-xl border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Settings className="h-5 w-5" />
                Criar Novo Módulo
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Adicione um novo módulo ao sistema com suas configurações
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="module-name" className="text-white">
                  Nome do Módulo *
                </Label>
                <Input
                  id="module-name"
                  value={newModuleName}
                  onChange={(e) => {
                    setNewModuleName(e.target.value.toUpperCase());
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  placeholder="Ex: USUARIOS, FINANCEIRO"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                {formErrors.name && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="module-display-name" className="text-white">
                  Nome de Exibição *
                </Label>
                <Input
                  id="module-display-name"
                  value={newModuleDisplayName}
                  onChange={(e) => {
                    setNewModuleDisplayName(e.target.value);
                    if (formErrors.displayName) {
                      setFormErrors(prev => ({ ...prev, displayName: undefined }));
                    }
                  }}
                  placeholder="Ex: Usuários, Financeiro"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                {formErrors.displayName && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.displayName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="module-description" className="text-white">
                  Descrição
                </Label>
                <Textarea
                  id="module-description"
                  value={newModuleDescription}
                  onChange={(e) => setNewModuleDescription(e.target.value)}
                  placeholder="Descreva a finalidade deste módulo..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetModuleForm();
                  setShowCreateModuleDialog(false);
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateModule}
                disabled={isSubmittingModule}
              >
                {isSubmittingModule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Módulo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modules List */}
        <div className="space-y-4">
          {filteredModules.map((moduleItem) => (
            <Card key={moduleItem.id} className="overflow-hidden glass bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader
                className="cursor-pointer hover:bg-[#101f2e] transition-colors"
                onClick={() => toggleModule(moduleItem.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">{moduleItem.display_name}</CardTitle>
                      <p className="text-sm text-white/60">
                        {moduleItem.description} • {moduleItem.permissions.length} permissões
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(moduleItem.id);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform text-white/60 ${expandedModules.has(moduleItem.id) ? 'rotate-180' : ''
                        }`}
                    />
                  </div>
                </div>
              </CardHeader>

              {expandedModules.has(moduleItem.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Add Permission Button */}
                    <div className="flex justify-end pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreatingPermission(moduleItem.id)}
                        className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className="h-4 w-4" />
                        Nova Permissão
                      </Button>
                    </div>

                    {/* Create Permission Form */}
                    {isCreatingPermission === moduleItem.id && (
                      <Card className="glass bg-white/5 backdrop-blur-xl border border-white/10">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`permission-name-${moduleItem.id}`} className="text-white">Nome da Permissão</Label>
                                <Input
                                  id={`permission-name-${moduleItem.id}`}
                                  value={newPermissionName}
                                  onChange={(e) => setNewPermissionName(e.target.value)}
                                  placeholder="Ex: Visualizar Usuários"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`permission-action-${moduleItem.id}`} className="text-white">Ação</Label>
                                <Select value={selectedActionId} onValueChange={setSelectedActionId}>
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Selecione uma ação" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-white/20">
                                    {actions.map((action) => (
                                      <SelectItem key={action.id} value={action.id} className="text-white hover:bg-white/10">
                                        {action.display_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`permission-description-${moduleItem.id}`} className="text-white">Descrição</Label>
                              <Textarea
                                id={`permission-description-${moduleItem.id}`}
                                value={newPermissionDescription}
                                onChange={(e) => setNewPermissionDescription(e.target.value)}
                                placeholder="Descrição da permissão..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleCreatePermission(moduleItem.id)}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Save className="h-4 w-4" />
                                Salvar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsCreatingPermission(null);
                                  setNewPermissionName('');
                                  setNewPermissionDescription('');
                                  setSelectedActionId('');
                                }}
                                className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                              >
                                <X className="h-4 w-4" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Permissions List */}
                    <div className="space-y-2">
                      {moduleItem.permissions.length === 0 ? (
                        <div className="text-center py-8 text-white/60">
                          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma permissão encontrada</p>
                          <p className="text-sm">Adicione uma nova permissão para começar</p>
                        </div>
                      ) : (
                        moduleItem.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-500/30">
                                <Eye className="h-4 w-4 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{permission.name}</h4>
                                <p className="text-sm text-white/60">
                                  {permission.description || 'Sem descrição'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={permission.is_active ? 'default' : 'secondary'} className={permission.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                                {permission.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePermission(permission.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <Settings className="h-16 w-16 mx-auto mb-4 text-white/40" />
              <h3 className="text-lg font-medium text-white mb-2">
                Nenhum módulo encontrado
              </h3>
              <p className="text-white/60 mb-4">
                {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando um novo módulo'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModuleDialog(true)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Módulo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}