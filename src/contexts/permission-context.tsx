'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  AuthorizedUser,
  UserPermissionSummary,
  PermissionModule,
  PermissionAction,
  UserStatus,
  AccessRequestData
} from '@/types/permissions';
import { PermissionsService } from '@/services/permissions.service';
import { useAuth } from '@/contexts/auth-context';

interface AuthPermissionsContextType {
  // Estado do usuário
  user: AuthorizedUser | null;
  permissions: UserPermissionSummary | null;
  isLoading: boolean;
  error: string | null;

  // Estado de acesso
  hasAccess: boolean;
  needsApproval: boolean;

  // Métodos de autenticação
  checkUserAccess: (external_id: string) => Promise<boolean>;
  requestAccess: (userData: AccessRequestData) => Promise<void>;
  loadUserPermissions: (external_id: string) => Promise<void>;
  clearPermissions: () => void;

  // Métodos de verificação de permissões
  hasPermission: (module: PermissionModule | string, action: PermissionAction | string, campus_id?: string) => boolean;
  hasAnyPermission: (permissions: Array<{ module: PermissionModule | string; action: PermissionAction | string; campus_id?: string }>) => boolean;
  hasAllPermissions: (permissions: Array<{ module: PermissionModule | string; action: PermissionAction | string; campus_id?: string }>) => boolean;

  // Métodos de verificação por campus
  hasPermissionForCampuses: (module: PermissionModule | string, action: PermissionAction | string, campus_ids: string[]) => boolean;
  getUserCampusForPermission: (module: PermissionModule | string, action: PermissionAction | string) => string[];

  // Métodos utilitários
  getUserModules: () => string[];
  getUserActions: () => string[];
  getUserCampus: () => string[];
  refreshPermissions: () => Promise<void>;
}

const AuthPermissionsContext = createContext<AuthPermissionsContextType | undefined>(undefined);

interface AuthPermissionsProviderProps {
  children: ReactNode;
}

export const AuthPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, isAuthenticated, isLoading: authLoading, registerPermissionsClearCallback } = useAuth();
  const pathname = usePathname();
  
  // Páginas públicas onde não devemos carregar permissões
  const isPublicPage = pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/forgot-password');
  
  const [user, setUser] = useState<AuthorizedUser | null>(null);
  const [permissions, setPermissions] = useState<UserPermissionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Registrar callback de limpeza de permissões no AuthContext
  useEffect(() => {
    if (registerPermissionsClearCallback) {
      registerPermissionsClearCallback(clearPermissions);
    }
  }, []); // Executar apenas uma vez na montagem

  // Inicializar permissões automaticamente quando o usuário está autenticado
  useEffect(() => {
    const initializePermissions = async () => {
      // Não carregar permissões em páginas públicas
      if (isPublicPage) {
        console.log('🚫 AuthPermissions: Página pública detectada, não carregando permissões');
        return;
      }

      // Só inicializar se não temos usuário de permissões ainda e o auth está completo
      if (isAuthenticated && authUser?.id && !user && !authLoading && !isLoading) {
        console.log('🔄 AuthPermissions: Inicializando permissões para usuário:', authUser.id);
        try {
          await checkUserAccess(authUser.id);
        } catch (error) {
          console.error('❌ AuthPermissions: Erro ao inicializar permissões:', error);
        }
      }
    };

    initializePermissions();
  }, [isAuthenticated, authUser?.id, isPublicPage, authLoading]); // Removido user?.id para evitar loop infinito

  // Verificar acesso do usuário
  const checkUserAccess = async (external_id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se usuário existe e tem acesso
      const hasValidAccess = await PermissionsService.validateUserAccess(external_id);

      if (hasValidAccess) {
        // Carregar permissões do usuário
        await loadUserPermissions(external_id);
        setHasAccess(true);
        setNeedsApproval(false);
        return true;
      } else {
        // Verificar se usuário existe mas não foi aprovado
        const existingUser = await PermissionsService.getAuthorizedUser(external_id);

        if (existingUser) {
          setUser(existingUser);
          setHasAccess(false);
          setNeedsApproval(existingUser.status === UserStatus.PENDING);
        } else {
          setHasAccess(false);
          setNeedsApproval(false);
        }

        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar acesso do usuário';
      setError(errorMessage);
      setHasAccess(false);
      setNeedsApproval(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Solicitar acesso
  const requestAccess = async (userData: AccessRequestData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await PermissionsService.createAuthorizedUser(userData);
      setUser(newUser);
      setNeedsApproval(true);
      setHasAccess(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao solicitar acesso';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar permissões do usuário
  const loadUserPermissions = async (external_id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const userPermissions = await PermissionsService.getUserPermissionSummary(external_id);

      if (userPermissions) {
        setUser(userPermissions.user);
        setPermissions(userPermissions);
        setHasAccess(true);
        setNeedsApproval(false);
      } else {
        setUser(null);
        setPermissions(null);
        setHasAccess(false);
        setNeedsApproval(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar permissões';
      setError(errorMessage);
      setUser(null);
      setPermissions(null);
      setHasAccess(false);
      setNeedsApproval(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar permissões
  const clearPermissions = (): void => {
    setUser(null);
    setPermissions(null);
    setHasAccess(false);
    setNeedsApproval(false);
    setError(null);
  };

  // Verificar se usuário tem permissão específica
  const hasPermission = (
    module: PermissionModule | string,
    action: PermissionAction | string,
    campus_id?: string
  ): boolean => {
    if (!permissions || !hasAccess) return false;

    return permissions.permissions.some(p => {
      const moduleMatch = p.permission.module.name === module;
      const actionMatch = p.permission.action.name === action;
      const campusMatch = !campus_id || p.campus_ids.includes(campus_id) || p.campus_ids.length === 0;
      const isActive = p.is_active && p.permission.is_active;
      const notExpired = !p.expires_at || new Date(p.expires_at) > new Date();

      return moduleMatch && actionMatch && campusMatch && isActive && notExpired;
    });
  };

  // Verificar se usuário tem pelo menos uma das permissões
  const hasAnyPermission = (
    permissionsList: Array<{ module: PermissionModule | string; action: PermissionAction | string; campus_id?: string }>
  ): boolean => {
    return permissionsList.some(p => hasPermission(p.module, p.action, p.campus_id));
  };

  // Verificar se usuário tem todas as permissões
  const hasAllPermissions = (
    permissionsList: Array<{ module: PermissionModule | string; action: PermissionAction | string; campus_id?: string }>
  ): boolean => {
    return permissionsList.every(p => hasPermission(p.module, p.action, p.campus_id));
  };

  // Obter módulos do usuário
  const getUserModules = (): string[] => {
    return permissions?.modules || [];
  };

  // Obter ações do usuário
  const getUserActions = (): string[] => {
    return permissions?.actions || [];
  };

  // Obter campus do usuário
  const getUserCampus = (): string[] => {
    return permissions?.campus_ids || [];
  };

  // Verificar se usuário tem permissão para múltiplos campus
  const hasPermissionForCampuses = (
    module: PermissionModule | string,
    action: PermissionAction | string,
    campus_ids: string[]
  ): boolean => {
    if (!permissions?.permissions || campus_ids.length === 0) return false;

    return campus_ids.every(campus_id => hasPermission(module, action, campus_id));
  };

  // Obter campus onde o usuário tem uma permissão específica
  const getUserCampusForPermission = (
    module: PermissionModule | string,
    action: PermissionAction | string
  ): string[] => {
    if (!permissions?.permissions) return [];

    const matchingPermissions = permissions.permissions.filter(p => {
      const moduleMatch = typeof module === 'string' ? p.permission.module.name === module : p.permission.module === module;
      const actionMatch = typeof action === 'string' ? p.permission.action.name === action : p.permission.action === action;
      const isActive = p.is_active;
      const notExpired = !p.expires_at || new Date(p.expires_at) > new Date();

      return moduleMatch && actionMatch && isActive && notExpired;
    });

    // Extrair campus_ids únicos
    const campusIds = new Set<string>();
    matchingPermissions.forEach(p => {
      if (p.campus_ids && p.campus_ids.length > 0) {
        p.campus_ids.forEach(id => campusIds.add(id));
      }
    });

    return Array.from(campusIds);
  };

  // Atualizar permissões
  const refreshPermissions = async (): Promise<void> => {
    if (user?.external_id) {
      await loadUserPermissions(user.external_id);
    }
  };

  const contextValue: AuthPermissionsContextType = {
    // Estado
    user,
    permissions,
    isLoading,
    error,
    hasAccess,
    needsApproval,

    // Métodos de autenticação
    checkUserAccess,
    requestAccess,
    loadUserPermissions,
    clearPermissions,

    // Métodos de verificação
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Métodos de verificação por campus
    hasPermissionForCampuses,
    getUserCampusForPermission,

    // Métodos utilitários
    getUserModules,
    getUserActions,
    getUserCampus,
    refreshPermissions
  };

  return (
    <AuthPermissionsContext.Provider value={contextValue}>
      {children}
    </AuthPermissionsContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuthPermissions = (): AuthPermissionsContextType => {
  const context = useContext(AuthPermissionsContext);

  if (context === undefined) {
    throw new Error('useAuthPermissions deve ser usado dentro de um AuthPermissionsProvider');
  }

  return context;
};

// Hook para verificação rápida de permissões
export const usePermissionCheck = () => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPermissionForCampuses,
    getUserCampusForPermission,
    hasAccess
  } = useAuthPermissions();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPermissionForCampuses,
    getUserCampusForPermission,
    hasAccess,
    // Helpers para permissões comuns
    canView: (module: string, campus_id?: string) => hasPermission(module, PermissionAction.VER, campus_id),
    canCreate: (module: string, campus_id?: string) => hasPermission(module, PermissionAction.CRIAR, campus_id),
    canEdit: (module: string, campus_id?: string) => hasPermission(module, PermissionAction.EDITAR, campus_id),
    canDelete: (module: string, campus_id?: string) => hasPermission(module, PermissionAction.REMOVER, campus_id),
    canList: (module: string, campus_id?: string) => hasPermission(module, PermissionAction.LISTAR, campus_id),
    // Helpers para múltiplos campus
    canViewInCampuses: (module: string, campus_ids: string[]) => hasPermissionForCampuses(module, PermissionAction.VER, campus_ids),
    canCreateInCampuses: (module: string, campus_ids: string[]) => hasPermissionForCampuses(module, PermissionAction.CRIAR, campus_ids),
    canEditInCampuses: (module: string, campus_ids: string[]) => hasPermissionForCampuses(module, PermissionAction.EDITAR, campus_ids),
    canDeleteInCampuses: (module: string, campus_ids: string[]) => hasPermissionForCampuses(module, PermissionAction.REMOVER, campus_ids),
    canListInCampuses: (module: string, campus_ids: string[]) => hasPermissionForCampuses(module, PermissionAction.LISTAR, campus_ids),
    // Helpers para obter campus por permissão
    getViewCampuses: (module: string) => getUserCampusForPermission(module, PermissionAction.VER),
    getCreateCampuses: (module: string) => getUserCampusForPermission(module, PermissionAction.CRIAR),
    getEditCampuses: (module: string) => getUserCampusForPermission(module, PermissionAction.EDITAR),
    getDeleteCampuses: (module: string) => getUserCampusForPermission(module, PermissionAction.REMOVER),
    getListCampuses: (module: string) => getUserCampusForPermission(module, PermissionAction.LISTAR)
  };
};