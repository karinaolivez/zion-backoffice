export interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    external_id?: string;
    full_name?: string;
    avatar?: string;
  };
  expiresAt: number;
}

const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

const SESSION_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_TOKEN || 'zion-session';
const REFRESH_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_REFRESH || 'zion-refresh';
const USER_COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_USER || 'zion-user';

// Client-side cookie manager for browser environment
export class ClientCookieManager {
  static setSession(sessionData: SessionData) {
    if (typeof window === 'undefined') return;
    
    // Set access token cookie (shorter expiry)
    document.cookie = `${SESSION_COOKIE_NAME}=${sessionData.accessToken}; max-age=${60 * 60}; path=/; ${COOKIE_OPTIONS.secure ? 'secure;' : ''} samesite=${COOKIE_OPTIONS.sameSite}`;

    // Set refresh token cookie (longer expiry)
    document.cookie = `${REFRESH_COOKIE_NAME}=${sessionData.refreshToken}; max-age=${60 * 60 * 24 * 7}; path=/; ${COOKIE_OPTIONS.secure ? 'secure;' : ''} samesite=${COOKIE_OPTIONS.sameSite}`;

    // Set user data cookie
    document.cookie = `${USER_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(sessionData.user))}; max-age=${60 * 60 * 24 * 7}; path=/; ${COOKIE_OPTIONS.secure ? 'secure;' : ''} samesite=${COOKIE_OPTIONS.sameSite}`;
  }

  static getSession(): {
    accessToken: string | null;
    refreshToken: string | null;
    user: SessionData['user'] | null;
  } {
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null, user: null };
    }

    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    const accessToken = getCookie(SESSION_COOKIE_NAME);
    const refreshToken = getCookie(REFRESH_COOKIE_NAME);
    const userCookie = getCookie(USER_COOKIE_NAME);
    
    let user = null;
    if (userCookie) {
      try {
        user = JSON.parse(decodeURIComponent(userCookie));
      } catch {
        // Invalid JSON, ignore
      }
    }

    return { accessToken, refreshToken, user };
  }

  static clearSession() {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${REFRESH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${USER_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  static isSessionValid(): boolean {
    const { accessToken, refreshToken } = this.getSession();
    return !!(accessToken || refreshToken);
  }
}

// Alias for backward compatibility
export const CookieManager = ClientCookieManager;