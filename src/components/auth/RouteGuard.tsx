'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: ReactNode;
  module: PermissionModule | string;
  action: PermissionAction | string;
  campus_id?: string;
  redirectTo?: string;
  showFallback?: boolean;
  requireAll?: boolean;
  permissions?: Array<{
    module: PermissionModule | string;
    action: PermissionAction | string;
    campus_id?: string;
  }>;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  module,
  action,
  campus_id,
  redirectTo = '/login',
  showFallback = true,
  requireAll = false,
  permissions = [],
}) => {
  const router = useRouter();
  const { validateSession } = useAuth();
  const {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isLoading,
    hasAccess,
    user
  } = useAuthPermissions();
  
  const [sessionValidated, setSessionValidated] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const isValid = await validateSession();
        setSessionValid(isValid);
        
        if (!isValid) {
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setSessionValid(false);
        router.push(redirectTo);
      } finally {
        setSessionValidated(true);
      }
    };

    checkSession();
  }, [validateSession, router, redirectTo]);

  useEffect(() => {
    // Se não tem acesso ao sistema, redireciona para login
    if (sessionValidated && sessionValid && !isLoading && !hasAccess) {
      router.push(redirectTo);
    }
  }, [sessionValidated, sessionValid, isLoading, hasAccess, router, redirectTo]);

  // Loading state - session validation or permissions loading
  if (!sessionValidated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600 text-center">
              {!sessionValidated ? 'Validando sessão...' : 'Verificando permissões...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se a sessão não é válida ou não tem acesso ao sistema
  if (!sessionValid || !hasAccess) {
    return null; // O useEffect já redirecionou
  }

  // Verificar permissões específicas
  let hasRequiredPermission = false;

  if (permissions.length > 0) {
    hasRequiredPermission = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    hasRequiredPermission = hasPermission(module, action, campus_id);
  }

  // Se tem a permissão necessária, renderiza o conteúdo
  if (hasRequiredPermission) {
    return <>{children}</>;
  }

  // Se não tem permissão e deve mostrar fallback
  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-gray-900">
              Acesso Negado
            </CardTitle>
            <CardDescription className="text-gray-600">
              Você não possui permissão para acessar esta página
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">
                    Permissão Necessária
                  </p>
                  <p className="text-yellow-700">
                    {permissions.length > 0
                      ? `${permissions.length} permissões específicas`
                      : `${module} - ${action}`
                    }
                    {campus_id && ` (Campus: ${campus_id})`}
                  </p>
                </div>
              </div>
            </div>

            {user && (
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Usuário:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Status:</strong> {user.status}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Ir para Home
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Entre em contato com o administrador do sistema para solicitar as permissões necessárias.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não deve mostrar fallback, não renderiza nada
  return null;
};