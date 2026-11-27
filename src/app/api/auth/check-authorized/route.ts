import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document } = body;

    if (!document) {
      return NextResponse.json(
        { error: 'Document is required' },
        { status: 400 }
      );
    }

    // Check if user is authorized in the authorized_users table
    const { data: authorizedUser, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('document', document)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Supabase error checking authorized user:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!authorizedUser) {
      return NextResponse.json(
        {
          isAuthorized: false,
          message: 'Usuário não autorizado a acessar o sistema'
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAuthorized: true,
      message: 'Usuário autorizado'
    });

  } catch (error: any) {
    console.error('Check Authorized User API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}