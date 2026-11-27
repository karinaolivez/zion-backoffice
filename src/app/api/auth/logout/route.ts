import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies using simple cookie parsing
    const getCookie = (name: string): string | null => {
      const cookies = request.headers.get('cookie') || '';
      const value = `; ${cookies}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    const accessToken = getCookie(process.env.NEXT_PUBLIC_COOKIE_TOKEN || 'zion-session');

    // If we have an access token, try to sign out from Supabase
    if (accessToken) {
      try {
        await supabase.auth.signOut();
      } catch (supabaseError) {
        console.error('Error signing out from Supabase:', supabaseError);
        // Continue with cookie clearing even if Supabase sign out fails
      }
    }

    // Create response and clear all session cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logout realizado com sucesso' 
    });

    // Clear all session cookies
    response.cookies.set(process.env.NEXT_PUBLIC_COOKIE_TOKEN || 'zion-session', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0)
    });

    response.cookies.set(process.env.NEXT_PUBLIC_COOKIE_REFRESH || 'zion-refresh', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0)
    });

    response.cookies.set(process.env.NEXT_PUBLIC_COOKIE_USER || 'zion-user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0)
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}