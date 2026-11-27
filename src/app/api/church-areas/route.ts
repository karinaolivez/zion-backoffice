import { NextRequest, NextResponse } from 'next/server';
import { PermissionAction } from '@/types/permissions';
import { requireProjectRequestPermission } from '@/lib/project-requests/server';

/**
 * GET /api/church-areas
 * Lista as áreas ativas da igreja (usada no formulário de solicitação).
 * Requer SOLICITACAO_PROJETOS_CRIAR ou SOLICITACAO_PROJETOS_LISTAR.
 */
export async function GET(request: NextRequest) {
  let auth = await requireProjectRequestPermission(request, PermissionAction.CRIAR);
  if (!auth.ok) {
    const fallback = await requireProjectRequestPermission(request, PermissionAction.LISTAR);
    if (!fallback.ok) return auth.response;
    auth = fallback;
  }

  const { data, error } = await auth.supabase
    .from('church_areas')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao buscar áreas:', error);
    return NextResponse.json({ error: 'Erro ao buscar áreas' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
