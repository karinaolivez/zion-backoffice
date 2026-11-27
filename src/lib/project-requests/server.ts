import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';
import { PermissionAction, PermissionModule } from '@/types/permissions';

/**
 * Helpers server-side do módulo de Solicitação de Projetos.
 *
 * As tabelas novas (church_areas, project_requests, tech_board_cards) só são
 * acessadas por aqui, com a service role. Toda rota valida:
 *   1. o token de sessão do Supabase (Authorization: Bearer <access_token>)
 *   2. o usuário em authorized_users (APPROVED + ativo)
 *   3. a permissão SOLICITACAO_PROJETOS_<ACAO> em user_permissions
 */

export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface RequestUser {
  /** id em authorized_users */
  id: string;
  /** id do usuário no Supabase Auth (= authorized_users.external_id) */
  externalId: string;
  fullName: string;
  email?: string | null;
}

type AuthResult =
  | { ok: true; user: RequestUser; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

const deny = (status: number, error: string): AuthResult => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

/**
 * Garante que quem chamou está logado e tem a permissão
 * SOLICITACAO_PROJETOS_<action>.
 */
export async function requireProjectRequestPermission(
  request: NextRequest,
  action: PermissionAction
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) return deny(401, 'Não autenticado');

  let supabase: SupabaseClient;
  try {
    supabase = getServiceClient();
  } catch (error) {
    console.error('Project requests: Supabase não configurado', error);
    return deny(500, 'Erro de configuração do servidor');
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return deny(401, 'Sessão inválida ou expirada');

  const { data: authorizedUser, error: userError } = await supabase
    .from('authorized_users')
    .select('id, external_id, full_name, status, is_active')
    .eq('external_id', authData.user.id)
    .maybeSingle();

  if (userError) {
    console.error('Project requests: erro ao buscar usuário', userError);
    return deny(500, 'Erro ao verificar usuário');
  }

  if (!authorizedUser || authorizedUser.status !== 'APPROVED' || !authorizedUser.is_active) {
    return deny(403, 'Usuário sem acesso ao sistema');
  }

  const permissionName = `${PermissionModule.SOLICITACAO_PROJETOS}_${action}`;

  const { data: userPermissions, error: permError } = await supabase
    .from('user_permissions')
    .select('id, is_active, expires_at, permission:permissions!inner(name, is_active)')
    .eq('user_id', authorizedUser.id)
    .eq('is_active', true)
    .eq('permission.name', permissionName);

  if (permError) {
    console.error('Project requests: erro ao verificar permissão', permError);
    return deny(500, 'Erro ao verificar permissões');
  }

  const now = new Date();
  const allowed = (userPermissions || []).some((up) => {
    const permission = Array.isArray(up.permission) ? up.permission[0] : up.permission;
    const notExpired = !up.expires_at || new Date(up.expires_at) > now;
    return permission?.is_active && notExpired;
  });

  if (!allowed) return deny(403, 'Você não tem permissão para esta ação');

  return {
    ok: true,
    supabase,
    user: {
      id: authorizedUser.id,
      externalId: authorizedUser.external_id,
      fullName: authorizedUser.full_name,
      email: authData.user.email,
    },
  };
}

// ---------------------------------------------------------------------------
// Kanban do time de tecnologia (acesso por senha compartilhada do time)
// ---------------------------------------------------------------------------

export const TECH_BOARD_COOKIE = 'tech-board-session';
export const TECH_BOARD_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function techBoardSecret(): string | null {
  const password = process.env.TECH_BOARD_PASSWORD;
  if (!password) return null;
  return password;
}

/** Token do cookie: HMAC da senha. Trocar a senha derruba todas as sessões. */
export function buildTechBoardToken(): string | null {
  const secret = techBoardSecret();
  if (!secret) return null;
  const signingKey = process.env.TECH_BOARD_SESSION_SECRET || secret;
  return createHmac('sha256', signingKey).update(`tech-board:${secret}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkTechBoardPassword(password: string): boolean {
  const secret = techBoardSecret();
  if (!secret || !password) return false;
  return safeEqual(password, secret);
}

type BoardAuthResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

export function requireTechBoardSession(request: NextRequest): BoardAuthResult {
  const expected = buildTechBoardToken();
  if (!expected) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Kanban não configurado (defina TECH_BOARD_PASSWORD)' },
        { status: 500 }
      ),
    };
  }

  const cookie = request.cookies.get(TECH_BOARD_COOKIE)?.value || '';
  if (!cookie || !safeEqual(cookie, expected)) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  try {
    return { ok: true, supabase: getServiceClient() };
  } catch (error) {
    console.error('Tech board: Supabase não configurado', error);
    return {
      ok: false,
      response: NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 }),
    };
  }
}

export const onlyDigits = (value: string) => (value || '').replace(/\D/g, '');
