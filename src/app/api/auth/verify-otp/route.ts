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
    const { email, token } = body;

    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    // Verify OTP via Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    });

    if (error) {
      console.error('Supabase OTP Verification Error:', error);

      // Handle specific error cases
      if (error.message.includes('Invalid token') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP code' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to verify OTP' },
        { status: 400 }
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      session: data.session,
      user: data.user,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    });

  } catch (error: any) {
    console.error('Verify OTP API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}