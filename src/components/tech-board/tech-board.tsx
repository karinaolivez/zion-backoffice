'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Hand,
  History,
  KanbanSquare,
  MessageSquare,
  PlayCircle,
  Send,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { techBoardService, TechBoardUnauthorizedError } from '@/services/project-requests';
import {
  getDueState,
  TECH_BOARD_COLUMNS,
  TechBoardCard,
  TechBoardCardEvent,
  TechBoardColumn,
  UpdateTechBoardCardData,
} from '@/types/project-requests';

const COLUMN_ACCENT: Record<TechBoardColumn, string> = {
  BACKLOG: 'bg-slate-400',
  A_FAZER: 'bg-blue-400',
  EM_ANDAMENTO: 'bg-yellow-400',
  EM_REVISAO: 'bg-purple-400',
  CONCLUIDO: 'bg-green-400',
};

const MY_NAME_KEY = 'tech-board-my-name';
const ALL = '__all__';
const NONE = '__none__';

const readMyName = () => {
  try {
    return localStorage.getItem(MY_NAME_KEY) || '';
  } catch {
    return '';
  }
};

const saveMyName = (name: string) => {
  try {
    localStorage.setItem(MY_NAME_KEY, name);
  } catch {
    // sem storage: segue sem lembrar o nome
  }
};

/** 'YYYY-MM-DD' -> 'dd/mm' (sem fuso: a data é local) */
const shortDate = (value?: string | null) => {
  if (!value) return '';
  const [, m, d] = value.slice(0, 10).split('-');
  return `${d}/${m}`;
};

/** ISO -> 'dd/mm/aaaa hh:mm' no horário local */
const dateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
};

/** Selo de prazo do card: Em atraso / Vence hoje / Vence dd/mm / Concluído em dd/mm */
const DueBadge = ({ card }: { card: TechBoardCard }) => {
  const t = useTranslations('techBoard.due');
  const state = getDueState(card);

  if (state === 'done') {
    if (!card.completed_at) return null;
    return (
      <span className="flex items-center gap-1 text-[11px] text-green-300">
        <CheckCircle2 className="w-3 h-3" />
        {t('doneOn', { date: shortDate(card.completed_at.slice(0, 10)) })}
      </span>
    );
  }
  if (state === 'none') return null;

  const styles = {
    overdue: 'bg-red-500/20 text-red-300 border-red-500/40',
    today: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    soon: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
    ok: 'bg-white/5 text-white/60 border-white/15',
  }[state];
  const label = {
    overdue: t('overdue', { date: shortDate(card.due_date) }),
    today: t('today'),
    soon: t('dueOn', { date: shortDate(card.due_date) }),
    ok: t('dueOn', { date: shortDate(card.due_date) }),
  }[state];
  const Icon = state === 'overdue' ? AlertTriangle : CalendarClock;

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', styles)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

/**
 * Kanban do time de tecnologia.
 *
 * - Solicitações aprovadas na moderação entram sozinhas no Backlog
 * - O time também pode criar cards manuais
 * - Arrastar e soltar entre colunas (ou usar o seletor de coluna no card)
 * - "Pegar pra mim" define o responsável com o nome salvo neste navegador
 * - Prazo por card com selo automático "Em atraso"
 * - Histórico com data/hora de cada movimentação + comentários do time
 */
export const TechBoard = () => {
  const t = useTranslations('techBoard');

  const [authState, setAuthState] = useState<'checking' | 'out' | 'in'>('checking');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [cards, setCards] = useState<TechBoardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState(ALL);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [myName, setMyName] = useState('');

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TechBoardColumn | null>(null);

  const [editing, setEditing] = useState<TechBoardCard | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setMyName(readMyName());
    techBoardService
      .checkSession()
      .then((ok) => setAuthState(ok ? 'in' : 'out'))
      .catch((error: Error) => {
        toast.error(error.message);
        setAuthState('out');
      });
  }, []);

  const handleUnauthorized = (error: unknown) => {
    if (error instanceof TechBoardUnauthorizedError) {
      setAuthState('out');
      return true;
    }
    return false;
  };

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await techBoardService.getCards());
    } catch (error) {
      if (!handleUnauthorized(error)) toast.error(error instanceof Error ? error.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authState === 'in') loadCards();
  }, [authState, loadCards]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoggingIn(true);
    try {
      await techBoardService.login(password);
      setPassword('');
      setAuthState('in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('loginError'));
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = async () => {
    await techBoardService.logout().catch(() => undefined);
    setCards([]);
    setAuthState('out');
  };

  const assignees = useMemo(
    () => [...new Set(cards.map((c) => c.assignee).filter(Boolean) as string[])].sort(),
    [cards]
  );

  const overdueCount = useMemo(() => cards.filter((c) => getDueState(c) === 'overdue').length, [cards]);

  const columns = useMemo(() => {
    let visible =
      assigneeFilter === ALL
        ? cards
        : cards.filter((c) => (assigneeFilter === NONE ? !c.assignee : c.assignee === assigneeFilter));
    if (onlyOverdue) visible = visible.filter((c) => getDueState(c) === 'overdue');
    return TECH_BOARD_COLUMNS.map((key) => ({
      key,
      cards: visible.filter((c) => c.column_key === key).sort((a, b) => a.position - b.position),
    }));
  }, [cards, assigneeFilter, onlyOverdue]);

  /** Nome de quem está usando (fica salvo no navegador e vai para o histórico) */
  const ensureName = (): string | null => {
    if (myName) return myName;
    const name = (window.prompt(t('askName')) || '').trim();
    if (!name) return null;
    setMyName(name);
    saveMyName(name);
    return name;
  };

  /** Atualiza otimista e volta atrás se a API falhar */
  const updateCard = async (id: string, changes: UpdateTechBoardCardData) => {
    const previous = cards;
    const { actor: _actor, ...visibleChanges } = changes;
    void _actor;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...visibleChanges } : c)));
    try {
      const saved = await techBoardService.updateCard(id, { ...changes, actor: changes.actor || myName || undefined });
      setCards((prev) => prev.map((c) => (c.id === id ? { ...saved, comment_count: c.comment_count } : c)));
      return saved;
    } catch (error) {
      setCards(previous);
      if (!handleUnauthorized(error)) toast.error(error instanceof Error ? error.message : t('saveError'));
      return null;
    }
  };

  /** Posição para soltar no fim da coluna ou antes de um card */
  const positionFor = (column: TechBoardColumn, beforeId?: string) => {
    const list = cards
      .filter((c) => c.column_key === column && c.id !== dragId)
      .sort((a, b) => a.position - b.position);
    if (!beforeId) return list.length ? list[list.length - 1].position + 1000 : 1000;
    const index = list.findIndex((c) => c.id === beforeId);
    if (index <= 0) return (list[0]?.position ?? 1000) - 1000;
    return (list[index - 1].position + list[index].position) / 2;
  };

  const drop = (column: TechBoardColumn, beforeId?: string) => {
    if (!dragId) return;
    const card = cards.find((c) => c.id === dragId);
    setDropTarget(null);
    setDragId(null);
    if (!card || beforeId === card.id) return;
    updateCard(card.id, { column_key: column, position: positionFor(column, beforeId) });
  };

  const takeCard = (card: TechBoardCard) => {
    const name = ensureName();
    if (!name) return;
    updateCard(card.id, { assignee: name, actor: name });
  };

  // ---------------------------------------------------------------------------

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-[#09101C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (authState === 'out') {
    return (
      <div className="min-h-screen bg-[#09101C] flex items-center justify-center p-4">
        <Card className="glass w-full max-w-sm border border-white/10">
          <CardHeader className="text-center">
            <KanbanSquare className="w-10 h-10 text-[#008980] mx-auto mb-2" />
            <CardTitle className="text-white">{t('title')}</CardTitle>
            <CardDescription className="text-white/60">{t('loginHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="space-y-4">
              <Input
                type="password"
                autoFocus
                autoComplete="current-password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Button type="submit" className="w-full" disabled={loggingIn || !password}>
                {loggingIn && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('enter')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09101C] text-white flex flex-col">
      {/* Topo */}
      <header className="border-b border-white/10 px-4 md:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <KanbanSquare className="w-7 h-7 text-[#008980]" />
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-white/50 text-sm">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-56 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('allAssignees')}</SelectItem>
              <SelectItem value={NONE}>{t('unassigned')}</SelectItem>
              {assignees.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOnlyOverdue((v) => !v)}
            className={cn(
              onlyOverdue
                ? 'border-red-500 bg-red-500/20 text-red-200 hover:bg-red-500/30'
                : 'border-red-500/50 text-red-300 hover:bg-red-500/10'
            )}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {t('overdueFilter', { count: overdueCount })}
          </Button>
          <Button variant="outline" size="sm" onClick={loadCards} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            {t('refresh')}
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('newCard')}
          </Button>
          <Button variant="ghost" size="sm" onClick={logout} className="text-white/60">
            <LogOut className="w-4 h-4 mr-2" />
            {t('logout')}
          </Button>
        </div>
      </header>

      {/* Colunas */}
      <main className="flex-1 overflow-x-auto p-4 md:p-8">
        <div className="flex gap-4 min-w-max h-full">
          {columns.map(({ key, cards: columnCards }) => (
            <section
              key={key}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(key);
              }}
              onDragLeave={() => setDropTarget((current) => (current === key ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                drop(key);
              }}
              className={cn(
                'w-72 shrink-0 rounded-xl border border-white/10 bg-white/5 flex flex-col max-h-[calc(100vh-170px)]',
                dropTarget === key && 'ring-2 ring-[#008980]'
              )}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <span className={cn('w-2 h-2 rounded-full', COLUMN_ACCENT[key])} />
                  {t(`columns.${key}`)}
                </span>
                <Badge variant="outline" className="border-white/20 text-white/60">
                  {columnCards.length}
                </Badge>
              </div>

              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {columnCards.map((card) => (
                  <article
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(card.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTarget(null);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      drop(key, card.id);
                    }}
                    onClick={() => setEditing(card)}
                    className={cn(
                      'rounded-lg border border-white/10 bg-[#0F1A2B] p-3 cursor-pointer hover:border-white/30 transition-colors space-y-2',
                      getDueState(card) === 'overdue' && 'border-l-4 border-l-red-500',
                      dragId === card.id && 'opacity-40'
                    )}
                  >
                    {card.area_name && (
                      <p className="text-[11px] uppercase tracking-wide text-blue-300/80">{card.area_name}</p>
                    )}
                    <p className="text-sm font-medium leading-snug">{card.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <DueBadge card={card} />
                      {!!card.comment_count && (
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <MessageSquare className="w-3 h-3" />
                          {card.comment_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {card.assignee ? (
                        <span className="flex items-center gap-1 text-xs text-white/70 truncate">
                          <UserRound className="w-3 h-3 shrink-0" />
                          {card.assignee}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            takeCard(card);
                          }}
                          className="flex items-center gap-1 text-xs text-[#43FFFF] hover:underline"
                        >
                          <Hand className="w-3 h-3" />
                          {t('takeIt')}
                        </button>
                      )}
                      {card.request_id && (
                        <Badge variant="outline" className="border-white/15 text-white/50 text-[10px]">
                          {t('fromRequest')}
                        </Badge>
                      )}
                    </div>
                  </article>
                ))}
                {columnCards.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-6">{t('emptyColumn')}</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <CardDialog
        card={editing}
        myName={myName}
        ensureName={ensureName}
        onCommented={(cardId) =>
          setCards((prev) =>
            prev.map((c) => (c.id === cardId ? { ...c, comment_count: (c.comment_count || 0) + 1 } : c))
          )
        }
        onClose={() => setEditing(null)}
        onSave={async (changes) => {
          if (!editing) return;
          const saved = await updateCard(editing.id, changes);
          if (saved) {
            toast.success(t('saved'));
            setEditing(null);
          }
        }}
        onDelete={async () => {
          if (!editing || !window.confirm(t('confirmDelete'))) return;
          try {
            await techBoardService.deleteCard(editing.id);
            setCards((prev) => prev.filter((c) => c.id !== editing.id));
            setEditing(null);
          } catch (error) {
            if (!handleUnauthorized(error)) toast.error(error instanceof Error ? error.message : t('saveError'));
          }
        }}
      />

      <CardDialog
        card={creating ? ({ column_key: 'BACKLOG' } as TechBoardCard) : null}
        isNew
        myName={myName}
        ensureName={ensureName}
        onClose={() => setCreating(false)}
        onSave={async (changes) => {
          try {
            const created = await techBoardService.createCard({
              title: changes.title || '',
              description: changes.description || undefined,
              area_name: changes.area_name || undefined,
              assignee: changes.assignee || undefined,
              column_key: changes.column_key,
              due_date: changes.due_date || null,
              actor: myName || undefined,
            });
            setCards((prev) => [...prev, created]);
            setCreating(false);
          } catch (error) {
            if (!handleUnauthorized(error)) toast.error(error instanceof Error ? error.message : t('saveError'));
          }
        }}
      />
    </div>
  );
};

// -----------------------------------------------------------------------------

interface CardDialogProps {
  card: TechBoardCard | null;
  isNew?: boolean;
  myName: string;
  ensureName: () => string | null;
  onClose: () => void;
  onSave: (changes: UpdateTechBoardCardData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCommented?: (cardId: string) => void;
}

const CardDialog = ({ card, isNew, myName, ensureName, onClose, onSave, onDelete, onCommented }: CardDialogProps) => {
  const t = useTranslations('techBoard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaName, setAreaName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [column, setColumn] = useState<TechBoardColumn>('BACKLOG');
  const [saving, setSaving] = useState(false);

  const [events, setEvents] = useState<TechBoardCardEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title || '');
    setDescription(card.description || '');
    setAreaName(card.area_name || '');
    setAssignee(card.assignee || '');
    setDueDate(card.due_date || '');
    setColumn(card.column_key || 'BACKLOG');
    setComment('');
    setEvents([]);
    if (!isNew && card.id) {
      setLoadingEvents(true);
      techBoardService
        .getEvents(card.id)
        .then(setEvents)
        .catch((error: Error) => toast.error(error.message))
        .finally(() => setLoadingEvents(false));
    }
  }, [card, isNew]);

  const save = async (overrides: Partial<UpdateTechBoardCardData> = {}) => {
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      area_name: areaName.trim(),
      assignee: assignee.trim(),
      due_date: dueDate || null,
      column_key: column,
      ...overrides,
    });
    setSaving(false);
  };

  const sendComment = async () => {
    if (!card?.id || !comment.trim()) return;
    const name = ensureName();
    if (!name) return;
    setSending(true);
    try {
      const created = await techBoardService.addComment(card.id, name, comment.trim());
      setEvents((prev) => [...prev, created]);
      setComment('');
      onCommented?.(card.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setSending(false);
    }
  };

  const describeEvent = (event: TechBoardCardEvent) => {
    const col = (value?: string | null) => (value ? t(`columns.${value}`) : '-');
    switch (event.event_type) {
      case 'CREATED':
        return event.body || t('history.created', { column: col(event.to_value) });
      case 'MOVED':
        return t('history.moved', { from: col(event.from_value), to: col(event.to_value) });
      case 'ASSIGNED':
        return event.to_value
          ? t('history.assigned', { name: event.to_value })
          : t('history.unassigned', { name: event.from_value || '-' });
      case 'DUE_DATE':
        return event.to_value
          ? t('history.dueSet', { date: shortDate(event.to_value) })
          : t('history.dueCleared');
      case 'EDITED':
        return t('history.edited');
      default:
        return event.body || '';
    }
  };

  const whatsapp = card?.requester_whatsapp;
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}` : null;
  const isDone = card?.column_key === 'CONCLUIDO';

  return (
    <Dialog open={!!card} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto', isNew ? 'max-w-2xl' : 'max-w-5xl')}>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-3">
            {isNew ? t('newCard') : t('editCard')}
            {card && !isNew && <DueBadge card={card} />}
          </DialogTitle>
          {!isNew && card?.requester_name && (
            <DialogDescription className="flex flex-wrap items-center gap-3">
              <span>{t('requestedBy', { name: card.requester_name })}</span>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-400 hover:underline"
                >
                  <MessageCircle className="w-4 h-4" />
                  {whatsapp}
                </a>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className={cn('grid gap-6', !isNew && 'md:grid-cols-5')}>
          {/* Dados do card */}
          <div className={cn('space-y-4', !isNew && 'md:col-span-3')}>
            {!isNew && card && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving || card.column_key === 'EM_ANDAMENTO'}
                  onClick={() => save({ column_key: 'EM_ANDAMENTO' })}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {t('actions.start')}
                </Button>
                <Button size="sm" disabled={saving || isDone} onClick={() => save({ column_key: 'CONCLUIDO' })}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('actions.complete')}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('fields.title')}</Label>
              <Input value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('fields.column')}</Label>
                <Select value={column} onValueChange={(v) => setColumn(v as TechBoardColumn)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TECH_BOARD_COLUMNS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`columns.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('fields.dueDate')}</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.assignee')}</Label>
                <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder={t('unassigned')} />
              </div>
              <div className="space-y-2">
                <Label>{t('fields.area')}</Label>
                <Input value={areaName} onChange={(e) => setAreaName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('fields.description')}</Label>
              <Textarea rows={8} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {!isNew && card && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-white/50">
                <span>{t('dates.created', { date: dateTime(card.created_at) })}</span>
                {card.started_at && <span>{t('dates.started', { date: dateTime(card.started_at) })}</span>}
                {card.completed_at && <span>{t('dates.completed', { date: dateTime(card.completed_at) })}</span>}
              </div>
            )}
          </div>

          {/* Histórico + comentários */}
          {!isNew && (
            <div className="md:col-span-2 flex flex-col rounded-lg border border-white/10 bg-white/5 min-h-[320px]">
              <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2 text-sm font-semibold">
                <History className="w-4 h-4" />
                {t('history.title')}
              </div>
              <ol className="flex-1 overflow-y-auto max-h-[360px] p-4 space-y-4">
                {loadingEvents && <Loader2 className="w-5 h-5 animate-spin text-white/50 mx-auto" />}
                {!loadingEvents && events.length === 0 && (
                  <li className="text-xs text-white/40 text-center">{t('history.empty')}</li>
                )}
                {events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span
                      className={cn(
                        'mt-1 w-2 h-2 rounded-full shrink-0',
                        event.event_type === 'COMMENT' ? 'bg-[#43FFFF]' : 'bg-white/30'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-white/40">
                        {dateTime(event.created_at)}
                        {event.author_name && ` · ${event.author_name}`}
                      </p>
                      {event.event_type === 'COMMENT' ? (
                        <p className="mt-1 text-sm text-white/90 whitespace-pre-wrap rounded-md bg-white/5 border border-white/10 px-3 py-2">
                          {event.body}
                        </p>
                      ) : (
                        <p className="text-sm text-white/70">{describeEvent(event)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="border-t border-white/10 p-3 space-y-2">
                <Textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('history.commentPlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment();
                  }}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-white/40 truncate">
                    {myName ? t('history.commentingAs', { name: myName }) : ''}
                  </span>
                  <Button size="sm" onClick={sendComment} disabled={sending || !comment.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {t('history.send')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
          {!isNew && onDelete ? (
            <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('delete')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button onClick={() => save()} disabled={saving || title.trim().length < 3}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TechBoard;
