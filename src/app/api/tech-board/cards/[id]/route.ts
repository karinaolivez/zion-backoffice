import { NextRequest, NextResponse } from 'next/server';
import { TECH_BOARD_COLUMNS } from '@/types/project-requests';
import { requireTechBoardSession } from '@/lib/project-requests/server';

/** PATCH /api/tech-board/cards/:id -> mover coluna, trocar responsável, editar */
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

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
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
