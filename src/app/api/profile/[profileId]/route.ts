import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ExternalUserProfile } from '@/types';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://x9mbeqmprx.us-east-2.awsapprunner.com';
const NEXT_PUBLIC_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'ef688b3c-de1f-413e-a40c-486b976be887';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    // Get headers from request
    const authHeader = request.headers.get('authorization');
    const organizationId = request.headers.get('organization_id') || NEXT_PUBLIC_ORGANIZATION_ID;
    const correlationId = request.headers.get('x-correlation-id') || '';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Build the external API URL
    const externalUrl = `${NEXT_PUBLIC_API_BASE_URL}/profiles/${profileId}?organizationId=${organizationId}`;

    // Make request to external API
    const response = await axios.get<ExternalUserProfile>(externalUrl, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': authHeader,
        'organization_id': organizationId,
        'x-correlation-id': correlationId,
      },
      params: {
        organizationId,
      },
      timeout: 10000 // 10 seconds timeout
    });

    console.log(response)

    if (response.status === 200 && response.data) {
      return NextResponse.json({
        success: true,
        data: response.data
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error('Profile API Error:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      console.error('Axios Error Response:', axiosError.response);
      return NextResponse.json(
        {
          error: axiosError.response?.data?.message || 'Failed to fetch profile',
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

    if (error && typeof error === 'object' && 'message' in error) {
      console.error('Error message:', error.message);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}