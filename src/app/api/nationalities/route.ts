import { NextResponse } from 'next/server';
import axios from 'axios';

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://x9mbeqmprx.us-east-2.awsapprunner.com';
const NEXT_PUBLIC_ORGANIZATION_ID = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'ef688b3c-de1f-413e-a40c-486b976be887';

export async function GET() {

  try {
    const response = await axios.get(`${NEXT_PUBLIC_API_BASE_URL}/nationality/list`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'organization_id': NEXT_PUBLIC_ORGANIZATION_ID,
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (response.status === 200) {

      // A API externa retorna um objeto com uma propriedade contendo o array
      // Vamos verificar se existe uma propriedade que contém o array
      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Procurar pela propriedade que contém o array
        const keys = Object.keys(response.data);
        for (const key of keys) {
          if (Array.isArray(response.data[key])) {
            data = response.data[key];
            break;
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: data
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch nationalities' },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error('Nationalities API Error:', error);

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      return NextResponse.json(
        {
          error: axiosError.response?.data?.message || 'Failed to fetch nationalities',
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