import { NextRequest, NextResponse } from 'next/server';
import { actorName, requireTechBoardSession } from '@/lib/project-requests/server';

/** GET /api/tech-board/cards/:id/events -> histórico + comentários (mais antigos primeiro) */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from('tech_board_card_events')
    .select('*')
    .eq('card_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

/** POST /api/tech-board/cards/:id/events { author, body } -> novo comentário */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTechBoardSession(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let payload: Record<string, unknown> = {};
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const text = typeof payload.body === 'string' ? payload.body.trim().slice(0, 3000) : '';
  if (!text) return NextResponse.json({ error: 'Escreva o comentário' }, { status: 400 });

  const author = actorName(payload.author);
  if (!author) return NextResponse.json({ error: 'Informe seu nome' }, { status: 400 });

  const { data: card } = await auth.supabase.from('tech_board_cards').select('id').eq('id', id).maybeSingle();
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

  const { data, error } = await auth.supabase
    .from('tech_board_card_events')
    .insert({ card_id: id, event_type: 'COMMENT', author_name: author, body: text })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao comentar:', error);
    return NextResponse.json({ error: 'Erro ao salvar comentário' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
