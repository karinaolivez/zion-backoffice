'use client';

import { useTranslations } from 'next-intl';
import { Users, Key, UserCheck, Layers, Shield, BarChart3 } from 'lucide-react';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';
import { useRouter, useParams } from 'next/navigation';

const AdminDashboard = () => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { hasPermission } = useAuthPermissions();

  const adminCards = [
    {
      title: t('navigation.users'),
      description: 'Gerenciar usuários do sistema',
      icon: Users,
      path: '/admin/users',
      permission: { module: PermissionModule.USUARIOS, action: PermissionAction.VER },
      color: 'from-blue-500 to-blue-600',
      stats: '1,234 usuários'
    },
    {
      title: t('navigation.permissions'),
      description: 'Configurar permissões do sistema',
      icon: Key,
      path: '/admin/permissions',
      permission: { module: PermissionModule.PERMISSOES, action: PermissionAction.VER },
      color: 'from-emerald-500 to-emerald-600',
      stats: '45 permissões'
    },
    {
      title: t('navigation.userPermissions'),
      description: 'Atribuir permissões aos usuários',
      icon: UserCheck,
      path: '/admin/user-permissions',
      permission: { module: PermissionModule.USUARIOS, action: PermissionAction.VER },
      color: 'from-purple-500 to-purple-600',
      stats: '892 atribuições'
    },
    {
      title: t('navigation.modules'),
      description: 'Gerenciar módulos do sistema',
      icon: Layers,
      path: '/admin/modules',
      permission: { module: PermissionModule.PERMISSOES, action: PermissionAction.VER },
      color: 'from-orange-500 to-orange-600',
      stats: '12 módulos'
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  return (
    <AdminGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {t('navigation.accessControl')}
            </h1>
            <p className="text-white/60 mt-1">
              Gerencie usuários, permissões e controle de acesso do sistema
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const hasCardPermission = hasPermission(card.permission.module, card.permission.action);
            
            if (!hasCardPermission) return null;

            return (
              <div
                key={card.path}
                onClick={() => handleNavigation(card.path)}
                className="glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <BarChart3 className="w-5 h-5 text-white/40" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {card.title}
                </h3>
                
                <p className="text-white/60 text-sm mb-4">
                  {card.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium">
                    {card.stats}
                  </span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emerald-500" />
            Ações Rápidas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-white font-medium">Criar Usuário</div>
                <div className="text-white/60 text-sm">Adicionar novo usuário ao sistema</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
              <Key className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-white font-medium">Configurar Permissões</div>
                <div className="text-white/60 text-sm">Definir novas permissões</div>
              </div>
            </button>
            
            <button className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
              <UserCheck className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-white font-medium">Atribuir Acesso</div>
                <div className="text-white/60 text-sm">Conceder permissões a usuários</div>
              </div>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
            Status do Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">99.9%</div>
              <div className="text-white/60 text-sm">Disponibilidade</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">1,234</div>
              <div className="text-white/60 text-sm">Usuários Ativos</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">45</div>
              <div className="text-white/60 text-sm">Permissões Ativas</div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
};

export default AdminDashboard;