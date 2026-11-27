import httpClient from '../http-client';
import { ClientCookieManager } from '@/lib/cookies';
import {
  ChurchArea,
  CreateProjectRequestData,
  CreateTechBoardCardData,
  ModerateProjectRequestData,
  ProjectRequest,
  ProjectRequestSummary,
  TechBoardCard,
  UpdateTechBoardCardData,
} from '@/types/project-requests';

/**
 * Serviço do módulo de Solicitação de Projetos.
 * Consome as API Routes /api/church-areas e /api/project-requests,
 * enviando o access token da sessão (Supabase) para validação no servidor.
 */

const authHeaders = () => {
  const { accessToken } = ClientCookieManager.getSession();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const errorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const data = (error as { response?: { data?: { error?: string } } }).response?.data;
    if (data?.error) return data.error;
  }
  return fallback;
};

export class ProjectRequestError extends Error {
  fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.fields = fields;
  }
}

export const projectRequestsService = {
  async getAreas(): Promise<ChurchArea[]> {
    try {
      const response = await httpClient.get('/church-areas', { headers: authHeaders() });
      return response.data.data || [];
    } catch (error) {
      throw new Error(errorMessage(error, 'Erro ao carregar as áreas'));
    }
  },

  async create(data: CreateProjectRequestData): Promise<{ id: string }> {
    try {
      const response = await httpClient.post('/project-requests', data, { headers: authHeaders() });
      return response.data.data;
    } catch (error) {
      const fields = (error as { response?: { data?: { fields?: Record<string, string> } } })?.response?.data
        ?.fields;
      throw new ProjectRequestError(errorMessage(error, 'Erro ao enviar a solicitação'), fields);
    }
  },

  async list(status?: string): Promise<{ requests: ProjectRequestSummary[]; areas: ChurchArea[] }> {
    try {
      const response = await httpClient.get('/project-requests', {
        headers: authHeaders(),
        params: status ? { status } : undefined,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(errorMessage(error, 'Erro ao carregar as solicitações'));
    }
  },

  /** Abre a solicitação (na primeira vez marca como "em análise") */
  async open(id: string): Promise<ProjectRequest> {
    try {
      const response = await httpClient.get(`/project-requests/${id}`, { headers: authHeaders() });
      return response.data.data;
    } catch (error) {
      throw new Error(errorMessage(error, 'Erro ao abrir a solicitação'));
    }
  },

  async moderate(id: string, data: ModerateProjectRequestData): Promise<{ request: ProjectRequest; warning?: string }> {
    try {
      const response = await httpClient.patch(`/project-requests/${id}`, data, { headers: authHeaders() });
      return { request: response.data.data, warning: response.data.warning };
    } catch (error) {
      throw new Error(errorMessage(error, 'Erro ao atualizar a solicitação'));
    }
  },
};

// ---------------------------------------------------------------------------
// Kanban do time de tecnologia (cookie httpOnly próprio, sem login Zion)
// ---------------------------------------------------------------------------

export class TechBoardUnauthorizedError extends Error {}

async function boardFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/tech-board${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) throw new TechBoardUnauthorizedError(body.error || 'Não autenticado');
  if (!response.ok) throw new Error(body.error || 'Erro na requisição');
  return body.data as T;
}

export const techBoardService = {
  async checkSession(): Promise<boolean> {
    try {
      await boardFetch('/session');
      return true;
    } catch (error) {
      if (error instanceof TechBoardUnauthorizedError) return false;
      throw error;
    }
  },

  login: (password: string) =>
    boardFetch<void>('/session', { method: 'POST', body: JSON.stringify({ password }) }),

  logout: () => boardFetch<void>('/session', { method: 'DELETE' }),

  getCards: () => boardFetch<TechBoardCard[]>('/cards'),

  createCard: (data: CreateTechBoardCardData) =>
    boardFetch<TechBoardCard>('/cards', { method: 'POST', body: JSON.stringify(data) }),

  updateCard: (id: string, data: UpdateTechBoardCardData) =>
    boardFetch<TechBoardCard>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteCard: (id: string) => boardFetch<void>(`/cards/${id}`, { method: 'DELETE' }),
};

export default projectRequestsService;
