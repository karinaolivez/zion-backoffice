'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  FolderOpen,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuthPermissions } from '@/contexts/permission-context';
import { projectRequestsService } from '@/services/project-requests';
import { PermissionAction, PermissionModule } from '@/types/permissions';
import {
  ChurchArea,
  ProjectRequest,
  ProjectRequestStatus,
  ProjectRequestSummary,
} from '@/types/project-requests';
import { formatDate, ProjectRequestStatusBadge } from './status-badge';
import { formatWhatsapp } from './project-request-form';

type StatusFilter = 'OPEN' | 'ALL' | ProjectRequestStatus;

/**
 * Página de moderação das solicitações (líder de tecnologia + head).
 *
 * - Lista agrupada por área, com cada área expansível
 * - Cada item mostra título + data da solicitação
 * - Ao abrir, a solicitação passa para "Em análise" (feito pela API)
 * - Aprovar cria o card no Backlog do Kanban do time de tecnologia
 *
 * Permissões: SOLICITACAO_PROJETOS_LISTAR (página), _VER (abrir), _EDITAR (aprovar/recusar)
 */
export const ProjectRequestModeration = () => {
  const t = useTranslations('projectRequests');
  const { hasPermission } = useAuthPermissions();
  const canModerate = hasPermission(PermissionModule.SOLICITACAO_PROJETOS, PermissionAction.EDITAR);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN');
  const [requests, setRequests] = useState<ProjectRequestSummary[]>([]);
  const [areas, setAreas] = useState<ChurchArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProjectRequest | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState<ProjectRequestStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectRequestsService.list(statusFilter === 'ALL' ? undefined : statusFilter);
      setRequests(data.requests);
      setAreas(data.areas);
      // Abre automaticamente as áreas que têm solicitações novas
      setExpanded((prev) => {
        const next = new Set(prev);
        data.requests
          .filter((r) => r.status === ProjectRequestStatus.NOVA)
          .forEach((r) => next.add(r.area_id));
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.loadError'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const byArea = new Map<string, ProjectRequestSummary[]>();
    requests.forEach((r) => byArea.set(r.area_id, [...(byArea.get(r.area_id) || []), r]));
    return areas
      .filter((area) => byArea.has(area.id))
      .map((area) => ({
        area,
        items: byArea.get(area.id)!,
        newCount: byArea.get(area.id)!.filter((r) => r.status === ProjectRequestStatus.NOVA).length,
      }));
  }, [areas, requests]);

  const toggleArea = (areaId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });

  const openRequest = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    try {
      const detail = await projectRequestsService.open(id);
      setSelected(detail);
      setNotes(detail.moderator_notes || '');
      // Atualiza o status na lista sem recarregar tudo
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: detail.status, viewed_at: detail.viewed_at } : r))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.openError'));
      setSelectedId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const decide = async (status: ProjectRequestStatus.APROVADA | ProjectRequestStatus.RECUSADA) => {
    if (!selected) return;
    setSaving(status);
    try {
      const { request, warning } = await projectRequestsService.moderate(selected.id, {
        status,
        moderator_notes: notes,
      });
      setSelected(request);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: request.status } : r)));
      if (warning) toast.warning(warning);
      else toast.success(status === ProjectRequestStatus.APROVADA ? t('moderation.approved') : t('moderation.rejected'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('moderation.saveError'));
    } finally {
      setSaving(null);
    }
  };

  const whatsappLink = (digits: string) => {
    const full = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${full}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="glass bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">{t('moderation.filter')}</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">{t('moderation.filterOpen')}</SelectItem>
              <SelectItem value={ProjectRequestStatus.NOVA}>{t('status.NOVA')}</SelectItem>
              <SelectItem value={ProjectRequestStatus.EM_ANALISE}>{t('status.EM_ANALISE')}</SelectItem>
              <SelectItem value={ProjectRequestStatus.APROVADA}>{t('status.APROVADA')}</SelectItem>
              <SelectItem value={ProjectRequestStatus.RECUSADA}>{t('status.RECUSADA')}</SelectItem>
              <SelectItem value="ALL">{t('moderation.filterAll')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">{t('moderation.count', { count: requests.length })}</span>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            {t('moderation.refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Lista agrupada por área */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <Card className="glass bg-white/5 border border-white/10">
              <CardContent className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/60" />
              </CardContent>
            </Card>
          ) : groups.length === 0 ? (
            <Card className="glass bg-white/5 border border-white/10">
              <CardContent className="p-10 text-center">
                <Inbox className="w-10 h-10 text-white/40 mx-auto mb-3" />
                <p className="text-white/60">{t('moderation.empty')}</p>
              </CardContent>
            </Card>
          ) : (
            groups.map(({ area, items, newCount }) => {
              const isOpen = expanded.has(area.id);
              return (
                <div key={area.id} className="glass bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-white font-medium truncate">{area.name}</span>
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {items.length}
                      </Badge>
                      {newCount > 0 && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {t('moderation.newCount', { count: newCount })}
                        </Badge>
                      )}
                    </span>
                    <ChevronDown
                      className={cn('w-4 h-4 text-white/60 transition-transform shrink-0', isOpen && 'rotate-180')}
                    />
                  </button>

                  {isOpen && (
                    <ul className="border-t border-white/10 divide-y divide-white/5">
                      {items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => openRequest(item.id)}
                            className={cn(
                              'w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-start justify-between gap-3',
                              selectedId === item.id && 'bg-white/10'
                            )}
                          >
                            <span className="min-w-0">
                              <span
                                className={cn(
                                  'block text-sm truncate',
                                  item.status === ProjectRequestStatus.NOVA ? 'text-white font-semibold' : 'text-white/80'
                                )}
                              >
                                {item.title}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-white/50 mt-1">
                                <CalendarDays className="w-3 h-3" />
                                {formatDate(item.created_at)} · {item.requester_name}
                              </span>
                            </span>
                            <ProjectRequestStatusBadge status={item.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detalhe */}
        <div className="lg:col-span-3">
          {!selectedId ? (
            <Card className="glass bg-white/5 border border-white/10 h-full min-h-60">
              <CardContent className="p-10 h-full flex flex-col items-center justify-center text-center">
                <Eye className="w-10 h-10 text-white/40 mb-3" />
                <p className="text-white/60">{t('moderation.selectHint')}</p>
              </CardContent>
            </Card>
          ) : loadingDetail || !selected ? (
            <Card className="glass bg-white/5 border border-white/10">
              <CardContent className="p-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/60" />
              </CardContent>
            </Card>
          ) : (
            <Card className="glass bg-white/5 border border-white/10">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">{selected.area?.name}</p>
                    <CardTitle className="text-white text-xl mt-1">{selected.title}</CardTitle>
                  </div>
                  <ProjectRequestStatusBadge status={selected.status} />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {t('moderation.requestedAt', { date: formatDate(selected.created_at, true) })}
                  </span>
                  {selected.viewed_at && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {t('moderation.viewedBy', {
                        name: selected.viewed_by_name || '-',
                        date: formatDate(selected.viewed_at, true),
                      })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Solicitante */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
                  <p className="text-white font-medium">{selected.requester_name}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a
                      href={whatsappLink(selected.requester_whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-400 hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {formatWhatsapp(selected.requester_whatsapp)}
                    </a>
                    {selected.requester_email && (
                      <a
                        href={`mailto:${selected.requester_email}`}
                        className="flex items-center gap-1 text-blue-300 hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        {selected.requester_email}
                      </a>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wide mb-2">{t('form.description')}</p>
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                </div>

                {/* Decisão */}
                <div className="space-y-3 border-t border-white/10 pt-5">
                  <p className="text-white/50 text-xs uppercase tracking-wide">{t('moderation.notes')}</p>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('moderation.notesPlaceholder')}
                    disabled={!canModerate}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                  {selected.decided_at && (
                    <p className="text-xs text-white/50">
                      {t('moderation.decidedBy', {
                        name: selected.decided_by_name || '-',
                        date: formatDate(selected.decided_at, true),
                      })}
                    </p>
                  )}
                  {canModerate && (
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                      <Button
                        variant="outline"
                        className="border-red-500/60 text-red-300 hover:bg-red-500/10"
                        disabled={!!saving || selected.status === ProjectRequestStatus.RECUSADA}
                        onClick={() => decide(ProjectRequestStatus.RECUSADA)}
                      >
                        {saving === ProjectRequestStatus.RECUSADA ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {t('moderation.reject')}
                      </Button>
                      <Button
                        disabled={!!saving || selected.status === ProjectRequestStatus.APROVADA}
                        onClick={() => decide(ProjectRequestStatus.APROVADA)}
                      >
                        {saving === ProjectRequestStatus.APROVADA ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        {t('moderation.approve')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectRequestModeration;
