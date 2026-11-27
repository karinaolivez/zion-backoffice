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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // First, check if user exists in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust as needed
    });

    if (userError) {
      console.error('Error checking user existence:', userError);
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    // Check if user with this email exists
    const userExists = userData.users.some(user => user.email === email);

    if (!userExists) {
      return NextResponse.json(
        { error: 'Usuário não existe ou não tem acesso à plataforma' },
        { status: 404 }
      );
    }

    // Send OTP via Supabase Auth
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Don't create user if doesn't exist
        emailRedirectTo: undefined, // We don't want email redirect
      }
    });

    if (error) {
      console.error('Supabase OTP Error:', error);

      // Handle specific error cases
      if (error.message.includes('User not found') || error.code === 'otp_disabled') {
        return NextResponse.json(
          { error: 'Usuário não existe ou não tem acesso à plataforma' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to send OTP' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      session: data.session,
      user: data.user
    });

  } catch (error: any) {
    console.error('Send OTP API Error:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}