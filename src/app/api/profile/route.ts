import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ExternalUserProfile, UserProfile } from '@/types';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://x9mbeqmprx.us-east-2.awsapprunner.com';
const NEXT_PUBLIC_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'ef688b3c-de1f-413e-a40c-486b976be887';

// Function to map external profile to internal UserProfile
function mapExternalProfileToUserProfile(externalProfile: ExternalUserProfile): UserProfile {
  return {
    id: externalProfile.id,
    name: externalProfile.fullname,
    email: externalProfile.user?.email || null,
    phone: externalProfile.user?.phone || undefined,
    document: externalProfile.documentNumber || '',
    nationality: '', // Not provided in external API
    address: externalProfile.addresses?.[0] ?
      `${externalProfile.addresses[0].street}, ${externalProfile.addresses[0].number}, ${externalProfile.addresses[0].city}` :
      undefined,
    birthDate: externalProfile.birthdate || undefined,
    registrationDate: externalProfile.createdAt,
    avatar: externalProfile.avatarUrl || undefined,
    status: externalProfile.type || 'active',
    // Login-specific fields (will be null for profile endpoint)
    token: null,
    accessToken: null,
    expiresIn: null,
    refreshToken: null,
    tokenType: null,
    userEmail: externalProfile.user?.email || null,
    username: externalProfile.user?.username || null,
    type: externalProfile.type || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get headers from request
    const authHeader = request.headers.get('authorization');
    const organizationId = request.headers.get('organization_id') || NEXT_PUBLIC_ORGANIZATION_ID;
    const correlationId = request.headers.get('x-correlation-id') || '';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const communityId = searchParams.get('communityId') || '';
    const spaceId = searchParams.get('spaceId') || '';

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required as query parameter' },
        { status: 400 }
      );
    }

    // Build the external API URL
    const externalUrl = `${NEXT_PUBLIC_API_BASE_URL}/profiles/${profileId}?organizationId=${organizationId}&communityId=${communityId}&spaceId=${spaceId}`;

    // Make request to external API
    const response = await axios.get<ExternalUserProfile>(externalUrl, {
      headers: {
        'Content-Type': 'application/json',
        'authorization': authHeader,
        'organization_id': organizationId,
        'x-correlation-id': correlationId,
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200 && response.data) {
      // Map external profile to internal UserProfile
      const userProfile = mapExternalProfileToUserProfile(response.data);

      return NextResponse.json({
        success: true,
        data: userProfile
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error('Error fetching profile:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message || 'Failed to fetch profile';

      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}