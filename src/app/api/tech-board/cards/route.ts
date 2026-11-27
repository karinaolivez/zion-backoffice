import { NextRequest, NextResponse } from 'next/server';
import { TECH_BOARD_COLUMNS, TechBoardColumn } from '@/types/project-requests';
import {
  actorName,
  logTechBoardEvents,
  parseDueDate,
  requireTechBoardSession,
} from '@/lib/project-requests/server';

const str = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** GET /api/tech-board/cards -> todos os cards do Kanban (com contagem de comentários) */
export async function GET(request: NextRequest) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const [{ data, error }, { data: comments, error: commentsError }] = await Promise.all([
    auth.supabase.from('tech_board_cards').select('*').order('position', { ascending: true }),
    auth.supabase.from('tech_board_card_events').select('card_id').eq('event_type', 'COMMENT'),
  ]);

  if (error) {
    console.error('Erro ao buscar cards:', error);
    return NextResponse.json({ error: 'Erro ao buscar cards' }, { status: 500 });
  }
  if (commentsError) console.error('Erro ao contar comentários:', commentsError);

  const counts = new Map<string, number>();
  (comments || []).forEach((c) => counts.set(c.card_id, (counts.get(c.card_id) || 0) + 1));

  return NextResponse.json({
    success: true,
    data: (data || []).map((card) => ({ ...card, comment_count: counts.get(card.id) || 0 })),
  });
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

  const due = parseDueDate(body.due_date);
  if (!due.ok) return NextResponse.json({ error: 'Prazo inválido' }, { status: 400 });

  const column = (TECH_BOARD_COLUMNS as readonly string[]).includes(String(body.column_key))
    ? (body.column_key as TechBoardColumn)
    : 'BACKLOG';
  const now = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from('tech_board_cards')
    .insert({
      title,
      description: str(body.description, 5000) || null,
      area_name: str(body.area_name, 255) || null,
      assignee: str(body.assignee, 255) || null,
      due_date: due.value ?? null,
      column_key: column,
      position: Date.now(),
      started_at: column === 'EM_ANDAMENTO' ? now : null,
      completed_at: column === 'CONCLUIDO' ? now : null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar card:', error);
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 });
  }

  await logTechBoardEvents(auth.supabase, [
    { card_id: data.id, event_type: 'CREATED', author_name: actorName(body.actor), to_value: column },
  ]);

  return NextResponse.json({ success: true, data: { ...data, comment_count: 0 } }, { status: 201 });
}
