import httpClient from '../http-client';
import { ClientCookieManager } from '@/lib/cookies';

export interface CheckUserResponse {
  success: boolean;
  user: {
    id: string;
    email?: string;
    phone?: string;
    username?: string;
    unmaskedEmail?: string;
    unmaskedPhone?: string;
  };
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    document: string;
    name?: string;
    avatar?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface RefreshSessionResponse {
  success: boolean;
  message: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  user?: {
    id: string;
    email: string;
    document: string;
    name?: string;
    avatar?: string;
  };
}

class AuthNewService {
  async checkUser(document: string): Promise<CheckUserResponse> {
    try {
      const response = await httpClient.post('/auth/check-user', { document });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao verificar usuário');
    }
  }

  async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const response = await httpClient.post('/auth/send-otp', { email });
      return response.data;
    } catch (error: any) {
      // Propagate the exact error message from the API
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao enviar OTP';
      throw new Error(errorMessage);
    }
  }

  async verifyOtp(email: string, token: string): Promise<VerifyOtpResponse> {
    try {
      const response = await httpClient.post('/auth/verify-otp', { email, token });

      // Store session data in cookies if verification is successful
      if (response.data.success && response.data.session && response.data.user) {
        await this.storeSession(response.data.session, response.data.user);
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao verificar OTP');
    }
  }

  async refreshSession(): Promise<RefreshSessionResponse> {
    try {
      const { refreshToken } = ClientCookieManager.getSession();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await httpClient.post('/auth/refresh', {
        refresh_token: refreshToken
      });

      // Store new session data if refresh is successful
      if (response.data.success && response.data.session && response.data.user) {
        await this.storeSession(response.data.session, response.data.user);
      }

      return response.data;
    } catch (error: any) {
      // Clear session if refresh fails
      this.clearSession();
      throw new Error(error.response?.data?.message || 'Erro ao renovar sessão');
    }
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Always clear local session
      this.clearSession();
    }
  }

  private async storeSession(session: any, user: any): Promise<void> {
    // Get authorized user data to include external_id, full_name, and avatar
    let authorizedUser = null;
    try {
      const { PermissionsService } = await import('@/services/permissions.service');
      authorizedUser = await PermissionsService.getAuthorizedUser(user.id);
    } catch (error) {
      console.warn('Erro ao buscar dados do usuário autorizado no storeSession:', error);
    }

    const sessionData = {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        username: user.email, // Using email as username for compatibility
        external_id: authorizedUser?.external_id || user.id,
        full_name: authorizedUser?.full_name || user.name || user.email,
        avatar: authorizedUser?.avatar || user.avatar || undefined,
      },
      expiresAt: session.expires_at
    };

    ClientCookieManager.setSession(sessionData);
  }

  clearSession(): void {
    ClientCookieManager.clearSession();
  }

  isAuthenticated(): boolean {
    return ClientCookieManager.isSessionValid();
  }

  getCurrentUser() {
    const session = ClientCookieManager.getSession();
    return session?.user || null;
  }

  async ensureValidSession(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    // Try to refresh session
    try {
      await this.refreshSession();
      return this.isAuthenticated();
    } catch (error) {
      return false;
    }
  }
}

export const authNewService = new AuthNewService();