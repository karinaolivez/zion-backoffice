// Tipos do módulo de Solicitação de Projetos e do Kanban do time de tecnologia

export enum ProjectRequestStatus {
  NOVA = 'NOVA',
  EM_ANALISE = 'EM_ANALISE',
  APROVADA = 'APROVADA',
  RECUSADA = 'RECUSADA',
}

export interface ChurchArea {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProjectRequest {
  id: string;
  area_id: string;
  area?: ChurchArea | null;
  requester_external_id: string;
  requester_name: string;
  requester_email?: string | null;
  requester_whatsapp: string;
  title: string;
  description: string;
  status: ProjectRequestStatus;
  viewed_at?: string | null;
  viewed_by_name?: string | null;
  moderator_notes?: string | null;
  decided_at?: string | null;
  decided_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

/** Versão resumida usada na lista da moderação */
export type ProjectRequestSummary = Pick<
  ProjectRequest,
  'id' | 'area_id' | 'title' | 'status' | 'requester_name' | 'created_at' | 'viewed_at'
>;

export interface CreateProjectRequestData {
  area_id: string;
  title: string;
  description: string;
  whatsapp: string;
}

export interface ModerateProjectRequestData {
  status: ProjectRequestStatus.APROVADA | ProjectRequestStatus.RECUSADA;
  moderator_notes?: string;
}

// ---------------------------------------------------------------------------
// Kanban
// ---------------------------------------------------------------------------

export const TECH_BOARD_COLUMNS = [
  'BACKLOG',
  'A_FAZER',
  'EM_ANDAMENTO',
  'EM_REVISAO',
  'CONCLUIDO',
] as const;

export type TechBoardColumn = (typeof TECH_BOARD_COLUMNS)[number];

export interface TechBoardCard {
  id: string;
  request_id?: string | null;
  title: string;
  description?: string | null;
  area_name?: string | null;
  requester_name?: string | null;
  requester_whatsapp?: string | null;
  assignee?: string | null;
  column_key: TechBoardColumn;
  position: number;
  /** Prazo (YYYY-MM-DD) */
  due_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  /** Quantidade de comentários (calculada na listagem) */
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export type TechBoardEventType = 'CREATED' | 'MOVED' | 'ASSIGNED' | 'DUE_DATE' | 'EDITED' | 'COMMENT';

export interface TechBoardCardEvent {
  id: string;
  card_id: string;
  event_type: TechBoardEventType;
  author_name?: string | null;
  from_value?: string | null;
  to_value?: string | null;
  body?: string | null;
  created_at: string;
}

/** Situação do prazo do card */
export type DueState = 'none' | 'ok' | 'soon' | 'today' | 'overdue' | 'done';

/** Calcula a situação do prazo comparando datas locais (YYYY-MM-DD) */
export function getDueState(card: Pick<TechBoardCard, 'due_date' | 'column_key'>, today = new Date()): DueState {
  if (card.column_key === 'CONCLUIDO') return 'done';
  if (!card.due_date) return 'none';
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  if (card.due_date < todayKey) return 'overdue';
  if (card.due_date === todayKey) return 'today';
  const diffDays = (new Date(`${card.due_date}T00:00:00`).getTime() - new Date(`${todayKey}T00:00:00`).getTime()) / 86400000;
  return diffDays <= 2 ? 'soon' : 'ok';
}

export interface CreateTechBoardCardData {
  title: string;
  description?: string;
  area_name?: string;
  assignee?: string;
  column_key?: TechBoardColumn;
  due_date?: string | null;
  /** Quem está criando (para o histórico) */
  actor?: string;
}

export type UpdateTechBoardCardData = Partial<
  Pick<TechBoardCard, 'title' | 'description' | 'area_name' | 'assignee' | 'column_key' | 'position' | 'due_date'>
> & {
  /** Quem está fazendo a alteração (para o histórico) */
  actor?: string;
};

// Regras de validação compartilhadas entre front e API
export const PROJECT_REQUEST_LIMITS = {
  titleMin: 5,
  titleMax: 150,
  descriptionMin: 50,
  descriptionMax: 5000,
  whatsappMinDigits: 10,
  whatsappMaxDigits: 13,
} as const;
