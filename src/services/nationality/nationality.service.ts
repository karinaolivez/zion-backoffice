import httpClient from '../http-client';
import * as Types from '../../types';

/**
 * Serviço para gerenciar operações relacionadas a nacionalidades
 * Consome a API Route /nationalities que integra com a API externa
 */
export const nationalityService = {
  /**
   * Busca todas as nacionalidades disponíveis
   * @returns Promise com a lista de nacionalidades
   */
  async getNationalities(): Promise<Types.NationalityResponse> {
    try {
      const response = await httpClient.get('/nationalities');
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          throw new Error('Parâmetros de busca inválidos');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Nenhuma nacionalidade encontrada');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor ao buscar nacionalidades');
        } else if (axiosError.response?.status === 503) {
          throw new Error('Serviço de nacionalidades temporariamente indisponível');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao buscar nacionalidades: ${errorMessage}`);
    }
  },

  /**
   * Busca uma nacionalidade específica por ID
   * @param nationalityId - ID da nacionalidade
   * @returns Promise com os dados da nacionalidade
   */
  async getNationalityById(id: string): Promise<Types.Nationality> {
    try {
      const response = await httpClient.get(`/nationality/${id}`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          throw new Error('ID de nacionalidade inválido');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Nacionalidade não encontrada');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao buscar nacionalidade: ${errorMessage}`);
    }
  },

  /**
   * Busca nacionalidades por nome ou código
   * @param searchTerm - Termo de busca (nome ou código)
   * @returns Promise com as nacionalidades encontradas
   */
  async searchNationalities(searchTerm: string): Promise<Types.Nationality[]> {
    try {
      const response = await httpClient.get(`/nationality/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 400) {
          throw new Error('Termo de busca inválido');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Nenhuma nacionalidade encontrada para o termo buscado');
        } else if (axiosError.response?.status === 500) {
          throw new Error('Erro interno do servidor na busca');
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha na busca de nacionalidades: ${errorMessage}`);
    }
  }
};

export default nationalityService;