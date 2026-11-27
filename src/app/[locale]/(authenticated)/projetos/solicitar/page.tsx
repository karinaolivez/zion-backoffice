'use client';

import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/auth';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectRequestForm } from '@/components/project-requests/project-request-form';
import { PermissionAction, PermissionModule } from '@/types/permissions';

/**
 * Solicitar projeto ao time de tecnologia.
 * Permissão: SOLICITACAO_PROJETOS_CRIAR (líderes de área, heads e pastores).
 */
const SolicitarProjetoPage = () => {
  const t = useTranslations('projectRequests');

  return (
    <RouteGuard module={PermissionModule.SOLICITACAO_PROJETOS} action={PermissionAction.CRIAR} redirectTo="/">
      <div className="space-y-2">
        <PageHeader title={t('form.pageTitle')} description={t('form.pageDescription')} />
        <ProjectRequestForm />
      </div>
    </RouteGuard>
  );
};

export default SolicitarProjetoPage;
