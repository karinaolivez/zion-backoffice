import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://x9mbeqmprx.us-east-2.awsapprunner.com';
const NEXT_PUBLIC_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'ef688b3c-de1f-413e-a40c-486b976be887';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    console.log('USERNAME >>>>>', username, password)

    // Call ZGP API for authentication
    const response = await axios.post(`${NEXT_PUBLIC_API_BASE_URL}/user/login`, {
      username,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
        'organization_id': NEXT_PUBLIC_ORGANIZATION_ID,
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200 && response.data) {
      return NextResponse.json({
        success: true,
        token: response.data.token || response.data.access_token,
        user: response.data.user || response.data,
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Login API Error:', error?.response?.data?.message || error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      // API returned an error response
      return NextResponse.json(
        {
          error: axiosError.response?.data?.message || 'Authentication failed',
          details: axiosError.response?.data
        },
        { status: 500 }
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}