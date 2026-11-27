'use client';

import React, { ReactNode } from 'react';
import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  module: PermissionModule | string;
  action: PermissionAction | string;
  campus_id?: string;
  fallback?: ReactNode;
  requireAll?: boolean; // Para múltiplas permissões
  permissions?: Array<{
    module: PermissionModule | string;
    action: PermissionAction | string;
    campus_id?: string;
  }>;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  campus_id,
  fallback = null,
  requireAll = false,
  permissions = [],
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = useAuthPermissions();

  // Se ainda está carregando, não renderiza nada ou mostra loading
  if (isLoading) {
    return null;
  }

  let hasAccess = false;

  if (permissions.length > 0) {
    // Verificar múltiplas permissões
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    // Verificar permissão única
    hasAccess = hasPermission(module, action, campus_id);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Hook para verificação de permissões em componentes
export const usePermissionCheck = () => {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = useAuthPermissions();

  const checkPermission = (
    module: PermissionModule | string,
    action: PermissionAction | string,
    campus_id?: string
  ) => {
    return hasPermission(module, action, campus_id);
  };

  const checkMultiplePermissions = (
    permissions: Array<{
      module: PermissionModule | string;
      action: PermissionAction | string;
      campus_id?: string;
    }>,
    requireAll = false
  ) => {
    return requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  };

  return {
    checkPermission,
    checkMultiplePermissions,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  };
};