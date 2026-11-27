'use client';

import { useTranslations } from 'next-intl';
import { MapPin, Building2 } from 'lucide-react';
import { RouteGuard } from '@/components/auth';
import { PageHeader } from '@/components/ui/page-header';
import { CampusList } from '@/components/campus/campus-list';
import { PermissionAction, PermissionModule } from '@/types/permissions';

const CampusPage = () => {
  const t = useTranslations();

  return (
    <RouteGuard
      module={PermissionModule.CAMPUS}
      action={PermissionAction.VER}
      redirectTo="/"
    >
      <div className="space-y-8">
        {/* Header */}
        <PageHeader
          title={t('common.campus')}
          description={t('campus.manageCampusDescription')}
        />

        {/* Campus List Component */}
        <div className="space-y-6">
          <CampusList />
        </div>
      </div>
    </RouteGuard>
  );
};

export default CampusPage;