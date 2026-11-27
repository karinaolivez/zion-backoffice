'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectRequestStatus } from '@/types/project-requests';

const STATUS_STYLES: Record<ProjectRequestStatus, string> = {
  [ProjectRequestStatus.NOVA]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  [ProjectRequestStatus.EM_ANALISE]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  [ProjectRequestStatus.APROVADA]: 'bg-green-500/20 text-green-300 border-green-500/30',
  [ProjectRequestStatus.RECUSADA]: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export const ProjectRequestStatusBadge = ({
  status,
  className,
}: {
  status: ProjectRequestStatus;
  className?: string;
}) => {
  const t = useTranslations('projectRequests.status');
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap', STATUS_STYLES[status], className)}>
      {t(status)}
    </Badge>
  );
};

export const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return '';
  const date = new Date(value);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const base = `${dd}/${mm}/${date.getFullYear()}`;
  if (!withTime) return base;
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${base} ${hh}:${min}`;
};
