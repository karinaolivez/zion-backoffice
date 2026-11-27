'use client';

import { useTranslations } from 'next-intl';
import { RouteGuard } from '@/components/auth';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectRequestModeration } from '@/components/project-requests/project-request-moderation';
import { PermissionAction, PermissionModule } from '@/types/permissions';

/**
 * Moderação das solicitações de projetos.
 * Permissão: SOLICITACAO_PROJETOS_LISTAR (líder do time de tecnologia e o head dele).
 */
const ModeracaoProjetosPage = () => {
  const t = useTranslations('projectRequests');

  return (
    <RouteGuard module={PermissionModule.SOLICITACAO_PROJETOS} action={PermissionAction.LISTAR} redirectTo="/">
      <div className="space-y-2">
        <PageHeader title={t('moderation.pageTitle')} description={t('moderation.pageDescription')} />
        <ProjectRequestModeration />
      </div>
    </RouteGuard>
  );
};

export default ModeracaoProjetosPage;
