import { NextRequest, NextResponse } from 'next/server';
import {
  TECH_BOARD_COOKIE,
  TECH_BOARD_COOKIE_MAX_AGE,
  buildTechBoardToken,
  checkTechBoardPassword,
  requireTechBoardSession,
} from '@/lib/project-requests/server';

/** GET /api/tech-board/session -> 200 se o cookie do time é válido */
export async function GET(request: NextRequest) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ success: true });
}

/** POST /api/tech-board/session { password } -> entra no Kanban */
export async function POST(request: NextRequest) {
  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    // corpo inválido -> senha vazia
  }

  const token = buildTechBoardToken();
  if (!token) {
    return NextResponse.json({ error: 'Kanban não configurado (defina TECH_BOARD_PASSWORD)' }, { status: 500 });
  }

  if (!checkTechBoardPassword(password)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(TECH_BOARD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TECH_BOARD_COOKIE_MAX_AGE,
  });
  return response;
}

/** DELETE /api/tech-board/session -> sai do Kanban */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(TECH_BOARD_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
