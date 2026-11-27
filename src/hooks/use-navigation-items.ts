'use client';

import { useTranslations } from 'next-intl';
import {
  Home,
  Settings,
  Link,
  Shield,
  Users,
  Key,
  MapPin,
  Lightbulb,
  ClipboardList
} from 'lucide-react';
import { PermissionModule, PermissionAction } from '@/types/permissions';

export interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  active: boolean;
  submenu?: SubMenuItem[];
  permission?: {
    module: PermissionModule;
    action: PermissionAction;
  };
}

export interface SubMenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  active: boolean;
  permission?: {
    module: PermissionModule;
    action: PermissionAction;
  };
}

export interface NavigationSection {
  section: string;
  items: MenuItem[];
}

interface UseNavigationItemsProps {
  currentPath?: string;
  hasAdminAccess: boolean;
}

export const useNavigationItems = ({ currentPath, hasAdminAccess }: UseNavigationItemsProps) => {
  const t = useTranslations();

  const navigationItems: NavigationSection[] = [
    {
      section: t('navigation.explore'),
      items: [
        {
          icon: Home,
          label: t('navigation.home'),
          path: '/',
          active: currentPath === '/'
        },
        {
          icon: Link,
          label: t('navigation.analytics'),
          path: '/zion-links',
          active: currentPath === '/zion-links'
        },
        // Módulo de Solicitação de Projetos
        {
          icon: Lightbulb,
          label: t('navigation.requestProject'),
          path: '/projetos/solicitar',
          active: currentPath === '/projetos/solicitar',
          permission: {
            module: PermissionModule.SOLICITACAO_PROJETOS,
            action: PermissionAction.CRIAR
          }
        },
        {
          icon: ClipboardList,
          label: t('navigation.projectModeration'),
          path: '/projetos/moderacao',
          active: currentPath === '/projetos/moderacao',
          permission: {
            module: PermissionModule.SOLICITACAO_PROJETOS,
            action: PermissionAction.LISTAR
          }
        }
      ]
    },
    // Seção administrativa - só aparece se o usuário tiver permissões
    ...(hasAdminAccess ? [{
      section: t('navigation.administration'),
      items: [
        {
          icon: Shield,
          label: t('navigation.accessControl'),
          path: '/admin',
          active: currentPath?.startsWith('/admin') || false,
          submenu: [
            {
              label: t('navigation.users'),
              path: '/admin/users',
              active: currentPath === '/admin/users',
              permission: {
                module: PermissionModule.USUARIOS,
                action: PermissionAction.VER
              }
            },
            {
              label: t('navigation.modulePermissions'),
              path: '/admin/module-permissions',
              active: currentPath === '/admin/module-permissions',
              permission: {
                module: PermissionModule.PERMISSOES,
                action: PermissionAction.VER
              }
            }
          ],
        },
        {
          icon: MapPin,
          label: t('common.campus'),
          path: '/admin/campus',
          active: currentPath === '/admin/campus',
          permission: {
            module: PermissionModule.CAMPUS,
            action: PermissionAction.VER
          }
        },
      ]
    }] : []),
  ];

  return {
    navigationItems
  };
};