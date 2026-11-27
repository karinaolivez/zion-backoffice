import { NextRequest, NextResponse } from 'next/server';
import { PermissionAction } from '@/types/permissions';
import { PROJECT_REQUEST_LIMITS, ProjectRequestStatus } from '@/types/project-requests';
import { onlyDigits, requireProjectRequestPermission } from '@/lib/project-requests/server';

/**
 * GET /api/project-requests
 * Lista resumida para a página de moderação (líder de tecnologia + head).
 * Query opcional: ?status=NOVA|EM_ANALISE|APROVADA|RECUSADA|OPEN
 *   OPEN = NOVA + EM_ANALISE
 */
export async function GET(request: NextRequest) {
  const auth = await requireProjectRequestPermission(request, PermissionAction.LISTAR);
  if (!auth.ok) return auth.response;

  const status = new URL(request.url).searchParams.get('status');

  let query = auth.supabase
    .from('project_requests')
    .select('id, area_id, title, status, requester_name, created_at, viewed_at')
    .order('created_at', { ascending: false });

  if (status === 'OPEN') {
    query = query.in('status', [ProjectRequestStatus.NOVA, ProjectRequestStatus.EM_ANALISE]);
  } else if (status && (Object.values(ProjectRequestStatus) as string[]).includes(status)) {
    query = query.eq('status', status);
  }

  const [{ data: requests, error }, { data: areas, error: areasError }] = await Promise.all([
    query,
    auth.supabase.from('church_areas').select('id, name, slug').order('name', { ascending: true }),
  ]);

  if (error || areasError) {
    console.error('Erro ao listar solicitações:', error || areasError);
    return NextResponse.json({ error: 'Erro ao listar solicitações' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { requests: requests || [], areas: areas || [] } });
}

/**
 * POST /api/project-requests
 * Cria uma solicitação. Requer SOLICITACAO_PROJETOS_CRIAR (líderes/heads/pastores).
 * Nome e e-mail vêm do cadastro do usuário logado, não do corpo da requisição.
 */
export async function POST(request: NextRequest) {
  const auth = await requireProjectRequestPermission(request, PermissionAction.CRIAR);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const areaId = typeof body.area_id === 'string' ? body.area_id : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const whatsapp = onlyDigits(typeof body.whatsapp === 'string' ? body.whatsapp : '');

  const L = PROJECT_REQUEST_LIMITS;
  const errors: Record<string, string> = {};
  if (!areaId) errors.area_id = 'Selecione a área';
  if (title.length < L.titleMin || title.length > L.titleMax) {
    errors.title = `O título deve ter entre ${L.titleMin} e ${L.titleMax} caracteres`;
  }
  if (description.length < L.descriptionMin || description.length > L.descriptionMax) {
    errors.description = `A descrição deve ter entre ${L.descriptionMin} e ${L.descriptionMax} caracteres`;
  }
  if (whatsapp.length < L.whatsappMinDigits || whatsapp.length > L.whatsappMaxDigits) {
    errors.whatsapp = 'Informe um WhatsApp válido com DDD';
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Dados inválidos', fields: errors }, { status: 400 });
  }

  const { data: area } = await auth.supabase
    .from('church_areas')
    .select('id')
    .eq('id', areaId)
    .eq('is_active', true)
    .maybeSingle();

  if (!area) {
    return NextResponse.json({ error: 'Dados inválidos', fields: { area_id: 'Área inválida' } }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from('project_requests')
    .insert({
      area_id: areaId,
      requester_user_id: auth.user.id,
      requester_external_id: auth.user.externalId,
      requester_name: auth.user.fullName,
      requester_email: auth.user.email || null,
      requester_whatsapp: whatsapp,
      title,
      description,
      status: ProjectRequestStatus.NOVA,
    })
    .select('id, title, status, created_at')
    .single();

  if (error) {
    console.error('Erro ao criar solicitação:', error);
    return NextResponse.json({ error: 'Erro ao enviar solicitação' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
