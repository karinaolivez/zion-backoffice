import { NextRequest, NextResponse } from 'next/server';
import { TECH_BOARD_COLUMNS } from '@/types/project-requests';
import {
  actorName,
  logTechBoardEvents,
  parseDueDate,
  requireTechBoardSession,
  TechBoardEventInput,
} from '@/lib/project-requests/server';

/**
 * PATCH /api/tech-board/cards/:id -> mover coluna, trocar responsável, prazo, editar.
 * Toda mudança de coluna, responsável e prazo entra no histórico com data/hora e autor (body.actor).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const { data: current, error: currentError } = await auth.supabase
    .from('tech_board_cards')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (currentError) {
    console.error('Erro ao buscar card:', currentError);
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 500 });
  }
  if (!current) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (body.column_key !== undefined) {
    if (!(TECH_BOARD_COLUMNS as readonly string[]).includes(String(body.column_key))) {
      return NextResponse.json({ error: 'Coluna inválida' }, { status: 400 });
    }
    updates.column_key = body.column_key;
  }
  if (body.position !== undefined) {
    const position = Number(body.position);
    if (!Number.isFinite(position)) {
      return NextResponse.json({ error: 'Posição inválida' }, { status: 400 });
    }
    updates.position = position;
  }
  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 150) : '';
    if (title.length < 3) return NextResponse.json({ error: 'Informe um título' }, { status: 400 });
    updates.title = title;
  }
  for (const field of ['description', 'area_name', 'assignee'] as const) {
    if (body[field] !== undefined) {
      const value = typeof body[field] === 'string' ? (body[field] as string).trim() : '';
      updates[field] = value ? value.slice(0, field === 'description' ? 5000 : 255) : null;
    }
  }
  const due = parseDueDate(body.due_date);
  if (!due.ok) return NextResponse.json({ error: 'Prazo inválido' }, { status: 400 });
  if (due.value !== undefined) updates.due_date = due.value;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
  }

  // Datas de início/conclusão acompanham a coluna
  const now = new Date().toISOString();
  const movedTo = updates.column_key as string | undefined;
  if (movedTo && movedTo !== current.column_key) {
    if (movedTo === 'EM_ANDAMENTO' && !current.started_at) updates.started_at = now;
    if (movedTo === 'CONCLUIDO') updates.completed_at = now;
    else if (current.column_key === 'CONCLUIDO') updates.completed_at = null;
  }

  const { data, error } = await auth.supabase
    .from('tech_board_cards')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Erro ao atualizar card:', error);
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

  // Histórico
  const author = actorName(body.actor);
  const events: TechBoardEventInput[] = [];
  if (movedTo && movedTo !== current.column_key) {
    events.push({ card_id: id, event_type: 'MOVED', author_name: author, from_value: current.column_key, to_value: movedTo });
  }
  if ('assignee' in updates && (updates.assignee || null) !== (current.assignee || null)) {
    events.push({
      card_id: id,
      event_type: 'ASSIGNED',
      author_name: author,
      from_value: current.assignee || null,
      to_value: (updates.assignee as string | null) || null,
    });
  }
  if ('due_date' in updates && (updates.due_date || null) !== (current.due_date || null)) {
    events.push({
      card_id: id,
      event_type: 'DUE_DATE',
      author_name: author,
      from_value: current.due_date || null,
      to_value: (updates.due_date as string | null) || null,
    });
  }
  const edited = (['title', 'description', 'area_name'] as const).some(
    (field) => field in updates && (updates[field] || null) !== (current[field] || null)
  );
  if (edited) events.push({ card_id: id, event_type: 'EDITED', author_name: author });
  await logTechBoardEvents(auth.supabase, events);

  return NextResponse.json({ success: true, data });
}

/** DELETE /api/tech-board/cards/:id */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { error } = await auth.supabase.from('tech_board_cards').delete().eq('id', id);

  if (error) {
    console.error('Erro ao remover card:', error);
    return NextResponse.json({ error: 'Erro ao remover card' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
