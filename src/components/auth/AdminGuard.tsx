'use client';

import React, { ReactNode } from 'react';
import { RouteGuard } from './RouteGuard';
import { PermissionModule, PermissionAction } from '@/types/permissions';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <RouteGuard
      permissions={[
        { module: PermissionModule.USUARIOS, action: PermissionAction.VER },
        { module: PermissionModule.PERMISSOES, action: PermissionAction.VER },
      ]}
      requireAll={false} // Usuário precisa ter pelo menos uma dessas permissões
      redirectTo={redirectTo}
      showFallback={true}
      module={PermissionModule.USUARIOS} // Fallback para compatibilidade
      action={PermissionAction.VER}
    >
      {children}
    </RouteGuard>
  );
};

// Guard específico para gerenciamento de usuários
export const UserManagementGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <>{children}</>
  );
};

// Guard específico para gerenciamento de permissões
export const PermissionManagementGuard: React.FC<AdminGuardProps> = ({
  children,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <RouteGuard
      module={PermissionModule.PERMISSOES}
      action={PermissionAction.VER}
      redirectTo={redirectTo}
      showFallback={true}
    >
      {children}
    </RouteGuard>
  );
};

// Guard para operações de criação
export const CreateGuard: React.FC<AdminGuardProps & { module: PermissionModule }> = ({
  children,
  module,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <RouteGuard
      module={module}
      action={PermissionAction.CRIAR}
      redirectTo={redirectTo}
      showFallback={false} // Para operações específicas, não mostra fallback completo
    >
      {children}
    </RouteGuard>
  );
};

// Guard para operações de edição
export const EditGuard: React.FC<AdminGuardProps & { module: PermissionModule }> = ({
  children,
  module,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <RouteGuard
      module={module}
      action={PermissionAction.EDITAR}
      redirectTo={redirectTo}
      showFallback={false}
    >
      {children}
    </RouteGuard>
  );
};

// Guard para operações de remoção
export const DeleteGuard: React.FC<AdminGuardProps & { module: PermissionModule }> = ({
  children,
  module,
  fallback,
  redirectTo = '/login',
}) => {
  return (
    <RouteGuard
      module={module}
      action={PermissionAction.REMOVER}
      redirectTo={redirectTo}
      showFallback={false}
    >
      {children}
    </RouteGuard>
  );
};