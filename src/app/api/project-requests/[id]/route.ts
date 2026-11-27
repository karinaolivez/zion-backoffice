import { NextRequest, NextResponse } from 'next/server';
import { PermissionAction } from '@/types/permissions';
import { ProjectRequestStatus } from '@/types/project-requests';
import { requireProjectRequestPermission } from '@/lib/project-requests/server';

const DETAIL_FIELDS =
  'id, area_id, requester_external_id, requester_name, requester_email, requester_whatsapp, title, description, status, viewed_at, viewed_by_name, moderator_notes, decided_at, decided_by_name, created_at, updated_at, area:church_areas(id, name, slug)';

/**
 * GET /api/project-requests/:id
 * Abre a solicitação na moderação. Na primeira abertura marca como EM_ANALISE
 * e registra quem viu e quando.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireProjectRequestPermission(request, PermissionAction.VER);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: existing, error } = await auth.supabase
    .from('project_requests')
    .select('id, status, viewed_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao buscar solicitação' }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });

  if (!existing.viewed_at || existing.status === ProjectRequestStatus.NOVA) {
    const updates: Record<string, unknown> = {};
    if (!existing.viewed_at) {
      updates.viewed_at = new Date().toISOString();
      updates.viewed_by = auth.user.id;
      updates.viewed_by_name = auth.user.fullName;
    }
    if (existing.status === ProjectRequestStatus.NOVA) {
      updates.status = ProjectRequestStatus.EM_ANALISE;
    }
    const { error: updateError } = await auth.supabase
      .from('project_requests')
      .update(updates)
      .eq('id', id);
    if (updateError) console.error('Erro ao marcar solicitação como vista:', updateError);
  }

  const { data, error: detailError } = await auth.supabase
    .from('project_requests')
    .select(DETAIL_FIELDS)
    .eq('id', id)
    .single();

  if (detailError) {
    console.error('Erro ao buscar solicitação:', detailError);
    return NextResponse.json({ error: 'Erro ao buscar solicitação' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

/**
 * PATCH /api/project-requests/:id
 * Aprova ou recusa. Ao aprovar, cria o card no Backlog do Kanban do time.
 * Body: { status: 'APROVADA' | 'RECUSADA', moderator_notes?: string }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireProjectRequestPermission(request, PermissionAction.EDITAR);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const status = body.status;
  if (status !== ProjectRequestStatus.APROVADA && status !== ProjectRequestStatus.RECUSADA) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }
  const notes = typeof body.moderator_notes === 'string' ? body.moderator_notes.trim().slice(0, 2000) : null;

  const { data: updated, error } = await auth.supabase
    .from('project_requests')
    .update({
      status,
      moderator_notes: notes || null,
      decided_at: new Date().toISOString(),
      decided_by: auth.user.id,
      decided_by_name: auth.user.fullName,
    })
    .eq('id', id)
    .select(DETAIL_FIELDS)
    .maybeSingle();

  if (error) {
    console.error('Erro ao moderar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao atualizar solicitação' }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });

  if (status === ProjectRequestStatus.APROVADA) {
    const area = Array.isArray(updated.area) ? updated.area[0] : updated.area;
    const { error: cardError } = await auth.supabase.from('tech_board_cards').upsert(
      {
        request_id: updated.id,
        title: updated.title,
        description: updated.description,
        area_name: area?.name || null,
        requester_name: updated.requester_name,
        requester_whatsapp: updated.requester_whatsapp,
        column_key: 'BACKLOG',
        position: Date.now(),
      },
      { onConflict: 'request_id', ignoreDuplicates: true }
    );
    if (cardError) {
      console.error('Erro ao criar card no Kanban:', cardError);
      return NextResponse.json(
        { success: true, data: updated, warning: 'Solicitação aprovada, mas o card do Kanban não foi criado' },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ success: true, data: updated });
}
