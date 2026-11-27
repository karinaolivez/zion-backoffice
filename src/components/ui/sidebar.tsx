'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { useNavigationItems } from '@/hooks/use-navigation-items';
import { usePermissionFilter } from '@/hooks/use-permission-filter';
import { useSearchFilter } from '@/hooks/use-search-filter';
import { SidebarLayout } from './sidebar-layout';
import { NavigationSection } from './navigation-section';
import { EmptySearchState } from './empty-search-state';

interface SidebarProps {
  currentPath?: string;
}

export const Sidebar = ({ currentPath }: SidebarProps) => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { user, logout } = useAuth();
  const { profile } = useProfile();

  // Estado da busca
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks modulares
  const { hasAdminAccess, filterMenuItems, filterSubMenuItems } = usePermissionFilter();
  const { navigationItems } = useNavigationItems({ currentPath, hasAdminAccess });
  const { filteredSections, hasResults, isFiltering } = useSearchFilter(navigationItems, searchTerm);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('auth.logoutSuccess'));
      router.push(`/${locale}/login`);
    } catch {
      toast.error(t('errors.logoutFailed'));
    }
  };

  const handleNavigation = (path: string) => {
    router.push(`/${locale}${path}`);
  };

  const userProfile = {
    name: profile?.name || user?.name || undefined,
    email: profile?.email || user?.email || undefined,
    avatar: profile?.avatar
  };

  return (
    <SidebarLayout
      userProfile={userProfile}
      onLogout={handleLogout}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      {/* Feedback visual para resultados vazios */}
      {isFiltering && !hasResults && (
        <EmptySearchState searchTerm={searchTerm} />
      )}

      {/* Seções de navegação */}
      {filteredSections.map((result) => (
        <NavigationSection
          key={result.section.section}
          title={result.section.section}
          items={result.matchedItems}
          onNavigate={handleNavigation}
          filterMenuItems={filterMenuItems}
          filterSubMenuItems={filterSubMenuItems}
          isFiltered={isFiltering}
        />
      ))}
    </SidebarLayout>
  );
};