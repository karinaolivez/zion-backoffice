import httpClient from './http-client';
import { storageService } from '@/lib/storage';
import * as Types from '../types';

/**
 * Serviço para gerenciar operações de autenticação
 * Consome a API Route /auth que integra com a API externa do ZGP
 */
export const authService = {
  /**
   * Realiza login do usuário
   * @param credentials - Credenciais de login (username e password)
   * @returns Promise com a resposta do login contendo token e dados do usuário
   */
  async login(credentials: Types.LoginRequest): Promise<Types.LoginResponse> {
    try {
      const response = await httpClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: unknown) {
      // Tratamento de erros específicos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          throw new Error('Credenciais inválidas');
        } else if (axiosError.response?.status === 400) {
          throw new Error('Dados de login inválidos');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor');
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha no login: ${errorMessage}`);
    }
  },

  /**
   * Realiza logout do usuário
   * @returns Promise void
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } catch (error: unknown) {
      // Log do erro mas não falha o logout local
      console.error('Erro ao fazer logout no servidor:', error);
    } finally {
      // Sempre limpa os dados locais
      storageService.removeAuthToken();
      storageService.clearUserData();
    }
  },

  /**
   * Valida se o token atual ainda é válido
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await httpClient.get('/auth/validate');
      return response.data.valid === true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          return false;
        }
      }
      return false;
    }
  },

  /**
   * Solicita reset de senha
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await httpClient.post('/auth/password-reset', { email });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new Error('Email não encontrado');
        } else if (axiosError.response?.status === 429) {
          throw new Error('Muitas tentativas. Tente novamente mais tarde');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor');
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao solicitar reset de senha: ${errorMessage}`);
    }
  },

  /**
   * Confirma reset de senha com token
   */
  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    try {
      await httpClient.post('/auth/password-reset/confirm', {
        token,
        newPassword
      });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          throw new Error('Token inválido ou expirado');
        } else if (axiosError.response?.status === 422) {
          throw new Error('Nova senha não atende aos critérios de segurança');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor');
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao confirmar reset de senha: ${errorMessage}`);
    }
  }
};

export default authService;