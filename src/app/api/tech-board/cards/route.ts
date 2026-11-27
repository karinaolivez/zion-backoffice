import { NextRequest, NextResponse } from 'next/server';
import { TECH_BOARD_COLUMNS, TechBoardColumn } from '@/types/project-requests';
import { requireTechBoardSession } from '@/lib/project-requests/server';

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** GET /api/tech-board/cards -> todos os cards do Kanban */
export async function GET(request: NextRequest) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from('tech_board_cards')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Erro ao buscar cards:', error);
    return NextResponse.json({ error: 'Erro ao buscar cards' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

/** POST /api/tech-board/cards -> cria um card manual (sem solicitação vinculada) */
export async function POST(request: NextRequest) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const title = str(body.title, 150);
  if (title.length < 3) {
    return NextResponse.json({ error: 'Informe um título' }, { status: 400 });
  }

  const column = (TECH_BOARD_COLUMNS as readonly string[]).includes(String(body.column_key))
    ? (body.column_key as TechBoardColumn)
    : 'BACKLOG';

  const { data, error } = await auth.supabase
    .from('tech_board_cards')
    .insert({
      title,
      description: str(body.description, 5000) || null,
      area_name: str(body.area_name, 255) || null,
      assignee: str(body.assignee, 255) || null,
      column_key: column,
      position: Date.now(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar card:', error);
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
