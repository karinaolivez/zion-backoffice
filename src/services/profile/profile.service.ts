import httpClient from '../http-client';
import storageService from '@/lib/storage';
import * as Types from '../../types';

/**
 * Serviço para gerenciar operações relacionadas ao perfil do usuário
 * Consome a API Route /profile que integra com a API externa do ZGP
 */
export const profileService = {
  /**
   * Busca o perfil de um usuário específico
   * @param profileId - ID do perfil (opcional, usa o usuário atual se não fornecido)
   * @returns Promise com os dados do perfil
   */
  async getProfile(profileId?: string): Promise<Types.ProfileResponse> {

    if (!profileId) {
      throw new Error('Usuário não autenticado');
    }

    const endpoint = profileId ? `/profile/${profileId}` : '/profile';

    try {
      const response = await httpClient.get(endpoint);
      console.log('Profile Response:', response.data);
      return response.data;
    } catch (error: unknown) {
      // Tratamento de erros específicos
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          throw new Error('Perfil não encontrado');
        } else if (axiosError.response?.status === 401) {
          throw new Error('Falha na autenticação');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro do servidor ao buscar perfil');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao buscar perfil: ${errorMessage}`);
    }
  },

  /**
   * Busca o perfil do usuário atual autenticado
   * @returns Promise com os dados do perfil do usuário atual
   */
  async getCurrentUserProfile(): Promise<Types.ProfileResponse> {
    // Verifica autenticação do usuário
    const currProfile = storageService.getUserProfile();

    if (!currProfile) {
      throw new Error('Usuário não autenticado');
    }

    return {
      success: true,
      data: currProfile
    };
  },

  /**
   * Atualiza o perfil do usuário
   * @param profileData - Dados do perfil para atualizar
   * @returns Promise com os dados do perfil atualizado
   */
  async updateProfile(profileData: Partial<Types.UserProfile>): Promise<Types.ProfileResponse> {
    const tokenData = storageService.getAuthToken();
    if (!tokenData) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const response = await httpClient.put('/profile', profileData);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          throw new Error('Dados de perfil inválidos');
        } else if (axiosError.response?.status === 401) {
          throw new Error('Não autorizado para atualizar perfil');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Perfil não encontrado');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor ao atualizar perfil');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao atualizar perfil: ${errorMessage}`);
    }
  },

  async deleteUserProfile(): Promise<void> {
    try {
      await httpClient.delete('/profile');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 401) {
          throw new Error('Não autorizado para deletar perfil');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Perfil não encontrado');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor ao deletar perfil');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao deletar perfil: ${errorMessage}`);
    }
  }
};

export default profileService;