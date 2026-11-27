'use client';

import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';
import { MenuItem, SubMenuItem } from './use-navigation-items';

export const usePermissionFilter = () => {
  const { hasPermission, hasAnyPermission } = useAuthPermissions();

  /**
   * Verifica se o usuário tem acesso administrativo
   */
  const hasAdminAccess = hasAnyPermission([
    { module: PermissionModule.USUARIOS, action: PermissionAction.VER },
    { module: PermissionModule.PERMISSOES, action: PermissionAction.VER }
  ]);

  /**
   * Filtra itens de menu baseado nas permissões do usuário
   */
  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) =>
      !item.permission || hasPermission(item.permission.module, item.permission.action)
    );
  };

  /**
   * Filtra itens de submenu baseado nas permissões do usuário
   */
  const filterSubMenuItems = (subItems: SubMenuItem[]): SubMenuItem[] => {
    return subItems.filter((subItem) =>
      !subItem.permission || hasPermission(subItem.permission.module, subItem.permission.action)
    );
  };

  /**
   * Verifica se o usuário tem permissão específica
   */
  const checkPermission = (module: PermissionModule, action: PermissionAction): boolean => {
    return hasPermission(module, action);
  };

  /**
   * Verifica se o usuário tem qualquer uma das permissões especificadas
   */
  const checkAnyPermission = (permissions: Array<{ module: PermissionModule; action: PermissionAction }>): boolean => {
    return hasAnyPermission(permissions);
  };

  return {
    hasAdminAccess,
    filterMenuItems,
    filterSubMenuItems,
    checkPermission,
    checkAnyPermission
  };
};