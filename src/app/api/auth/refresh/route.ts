import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Refresh token is required'
        },
        { status: 400 }
      );
    }

    // Refresh the session using Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error('Supabase refresh error:', error);
      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to refresh session'
        },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid refresh token'
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
      message: 'Session refreshed successfully'
    });

  } catch (error) {
    console.error('Refresh session error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}