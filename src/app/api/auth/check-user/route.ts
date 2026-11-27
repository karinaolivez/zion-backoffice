import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const NEXT_PUBLIC_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID;
const X_API_KEY = process.env.NEXT_PUBLIC_ZION_API_KEY;
const X_CORRELATION_ID = process.env.NEXT_PUBLIC_ZION_CORRELATION_ID;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document } = body;

    if (!document) {
      return NextResponse.json(
        { error: 'Document are required' },
        { status: 400 }
      );
    }

    console.log('Document >>>>>> ', document);

    // Call Zion API to check if user exists
    const response = await axios.get(`${NEXT_PUBLIC_API_BASE_URL}/user/check-user?username=${document}`, {
      headers: {
        'Content-Type': 'application/json',
        'organization_id': NEXT_PUBLIC_ORGANIZATION_ID,
        'x-api-key': X_API_KEY,
        'x-correlation-id': X_CORRELATION_ID
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200 && response.data) {
      return NextResponse.json({
        success: true,
        user: response.data.user,
      });
    }

    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );

  } catch (error: any) {
    console.error('Check User API Error:', error?.response?.data?.message || error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError;

      // User not found
      if (axiosError.response?.status === 404) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Other API errors
      return NextResponse.json(
        {
          error: (axiosError.response?.data as any)?.message || 'Failed to check user',
          details: axiosError.response?.data
        },
        { status: axiosError.response?.status || 500 }
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