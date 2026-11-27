export const apiTemplate = (featureName, pascalName, camelName, upperSnakeName) => `import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ${camelName}Service } from '@/services/${featureName}';

// Verificar permissões
async function checkPermission(action: 'view' | 'create' | 'edit' | 'delete') {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { authorized: false, error: 'Não autenticado' };
    }

    // Verificar permissão específica
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select(\`
        permission:permissions(module, action)
      \`)
      .eq('user_id', session.user.id);

    if (permError) {
      console.error('Erro ao verificar permissões:', permError);
      return { authorized: false, error: 'Erro ao verificar permissões' };
    }

    const hasPermission = permissions?.some(
      (p: any) => p.permission?.module === '${upperSnakeName}' && p.permission?.action === action.toUpperCase()
    );

    return { 
      authorized: hasPermission || false, 
      userId: session.user.id,
      error: hasPermission ? null : 'Permissão insuficiente'
    };
  } catch (error) {
    console.error('Erro na verificação de permissão:', error);
    return { authorized: false, error: 'Erro interno' };
  }
}

/**
 * GET - Listar todos os registros
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar permissão
    const { authorized, error } = await checkPermission('view');
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Acesso negado' },
        { status: 401 }
      );
    }

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Buscar dados
    const data = await ${camelName}Service.search({
      name,
      limit,
      offset,
    });

    // Buscar total para paginação
    const total = await ${camelName}Service.count({ name });

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit: limit || data.length,
        offset: offset || 0,
        hasMore: (offset || 0) + (limit || data.length) < total,
      },
    });
  } catch (error) {
    console.error('Erro no GET ${featureName}:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar novo registro
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const { authorized, error } = await checkPermission('create');
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Acesso negado' },
        { status: 401 }
      );
    }

    // Validar dados
    const body = await request.json();
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar dados
    const createData = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
    };

    // Criar registro
    const newRecord = await ${camelName}Service.create(createData);

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Erro no POST ${featureName}:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Atualizar registro
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar permissão
    const { authorized, error } = await checkPermission('edit');
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Acesso negado' },
        { status: 401 }
      );
    }

    // Extrair ID da query
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se registro existe
    const existingRecord = await ${camelName}Service.getById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados
    const body = await request.json();
    
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Nome deve ser uma string não vazia' },
        { status: 400 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;

    // Atualizar registro
    const updatedRecord = await ${camelName}Service.update(id, updateData);

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Erro no PUT ${featureName}:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Excluir registro
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verificar permissão
    const { authorized, error } = await checkPermission('delete');
    if (!authorized) {
      return NextResponse.json(
        { error: error || 'Acesso negado' },
        { status: 401 }
      );
    }

    // Extrair ID da query
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se registro existe
    const existingRecord = await ${camelName}Service.getById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    // Excluir registro
    await ${camelName}Service.delete(id);

    return NextResponse.json({ message: 'Registro excluído com sucesso' });
  } catch (error) {
    console.error('Erro no DELETE ${featureName}:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}`;