'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Hand,
  KanbanSquare,
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
import { TECH_BOARD_COLUMNS, TechBoardCard, TechBoardColumn } from '@/types/project-requests';

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

/**
 * Kanban do time de tecnologia.
 *
 * - Solicitações aprovadas na moderação entram sozinhas no Backlog
 * - O time também pode criar cards manuais
 * - Arrastar e soltar entre colunas (ou usar o seletor de coluna no card)
 * - "Pegar pra mim" define o responsável com o nome salvo neste navegador
 */
export const TechBoard = () => {
  const t = useTranslations('techBoard');

  const [authState, setAuthState] = useState<'checking' | 'out' | 'in'>('checking');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [cards, setCards] = useState<TechBoardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState(ALL);
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

  const columns = useMemo(() => {
    const visible =
      assigneeFilter === ALL
        ? cards
        : cards.filter((c) => (assigneeFilter === NONE ? !c.assignee : c.assignee === assigneeFilter));
    return TECH_BOARD_COLUMNS.map((key) => ({
      key,
      cards: visible.filter((c) => c.column_key === key).sort((a, b) => a.position - b.position),
    }));
  }, [cards, assigneeFilter]);

  /** Atualiza otimista e volta atrás se a API falhar */
  const updateCard = async (id: string, changes: Partial<TechBoardCard>) => {
    const previous = cards;
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)));
    try {
      const saved = await techBoardService.updateCard(id, changes);
      setCards((prev) => prev.map((c) => (c.id === id ? saved : c)));
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
    let name = myName;
    if (!name) {
      name = (window.prompt(t('askName')) || '').trim();
      if (!name) return;
      setMyName(name);
      saveMyName(name);
    }
    updateCard(card.id, { assignee: name });
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
                      dragId === card.id && 'opacity-40'
                    )}
                  >
                    {card.area_name && (
                      <p className="text-[11px] uppercase tracking-wide text-blue-300/80">{card.area_name}</p>
                    )}
                    <p className="text-sm font-medium leading-snug">{card.title}</p>
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
        onClose={() => setCreating(false)}
        onSave={async (changes) => {
          try {
            const created = await techBoardService.createCard({
              title: changes.title || '',
              description: changes.description || undefined,
              area_name: changes.area_name || undefined,
              assignee: changes.assignee || undefined,
              column_key: changes.column_key,
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
  onClose: () => void;
  onSave: (changes: Partial<TechBoardCard>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const CardDialog = ({ card, isNew, onClose, onSave, onDelete }: CardDialogProps) => {
  const t = useTranslations('techBoard');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [areaName, setAreaName] = useState('');
  const [assignee, setAssignee] = useState('');
  const [column, setColumn] = useState<TechBoardColumn>('BACKLOG');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title || '');
    setDescription(card.description || '');
    setAreaName(card.area_name || '');
    setAssignee(card.assignee || '');
    setColumn(card.column_key || 'BACKLOG');
  }, [card]);

  const save = async () => {
    setSaving(true);
    await onSave({
      title: title.trim(),
      description: description.trim(),
      area_name: areaName.trim(),
      assignee: assignee.trim(),
      column_key: column,
    });
    setSaving(false);
  };

  const whatsapp = card?.requester_whatsapp;
  const whatsappUrl = whatsapp ? `https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}` : null;

  return (
    <Dialog open={!!card} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? t('newCard') : t('editCard')}</DialogTitle>
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('fields.title')}</Label>
            <Input value={title} maxLength={150} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Textarea rows={10} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
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
            <Button onClick={save} disabled={saving || title.trim().length < 3}>
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
