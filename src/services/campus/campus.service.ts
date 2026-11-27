// Importando o novo serviço Supabase
import campusSupabaseService from './campus-supabase.service';
import * as Types from '../../types';

export interface CampusSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  communityGroupId?: string;
}

/**
 * Serviço para gerenciar operações relacionadas a Campus
 * MIGRADO PARA SUPABASE - Agora usa persistência direta no banco de dados
 * Mantém a mesma interface para compatibilidade com componentes existentes
 */
export const campusService = {
  /**
   * Cria um novo campus
   * @param campusData - Dados do campus a ser criado
   * @returns Promise com o campus criado
   */
  async createCampus(campusData: Types.CreateCampusRequest): Promise<Types.CampusResponse> {
    return campusSupabaseService.createCampus(campusData);
  },

  /**
   * Busca lista de campus com filtros opcionais
   * @param params - Parâmetros de busca (search, page, limit, organizationId, communityGroupId)
   * @returns Promise com a resposta contendo os campus
   */
  async getCampus(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    return campusSupabaseService.getCampus(params);
  },

  /**
   * Busca um campus específico por ID
   * @param id - ID do campus
   * @returns Promise com o campus encontrado
   */
  async getCampusById(id: string): Promise<Types.CampusResponse> {
    return campusSupabaseService.getCampusById(id);
  },

  /**
   * Atualiza um campus existente
   * @param updateData - Dados para atualização
   * @returns Promise com o campus atualizado
   */
  async updateCampus(updateData: Types.UpdateCampusRequest): Promise<Types.CampusResponse> {
    return campusSupabaseService.updateCampus(updateData);
  },

  /**
   * Remove um campus
   * @param id - ID do campus a ser removido
   * @returns Promise com resultado da operação
   */
  async deleteCampus(id: string): Promise<Types.CampusResponse> {
    return campusSupabaseService.deleteCampus(id);
  },

  /**
   * Busca campus com termo de pesquisa
   * @param searchTerm - Termo para buscar nos campus
   * @param page - Página atual (padrão: 1)
   * @param limit - Limite de resultados por página (padrão: 10)
   * @returns Promise com a resposta da busca
   */
  async searchCampus(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Types.CampusResponse> {
    return campusSupabaseService.searchCampus(searchTerm, page, limit);
  },

  /**
   * Busca campus paginados com filtros opcionais
   * @param params - Parâmetros de busca
   * @returns Promise com a resposta paginada
   */
  async getCampusPaginated(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    return campusSupabaseService.getCampusPaginated(params);
  },

  // Métodos de compatibilidade com a API anterior (Communities)
  /**
   * @deprecated Use getCampus() instead
   * Busca comunidades/campus com filtros opcionais (compatibilidade)
   */
  async getCommunities(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    console.warn('getCommunities() is deprecated. Use getCampus() instead.');
    return this.getCampus(params);
  },

  /**
   * @deprecated Use searchCampus() instead
   * Busca comunidades com termo de pesquisa (compatibilidade)
   */
  async searchCommunities(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Types.CampusResponse> {
    console.warn('searchCommunities() is deprecated. Use searchCampus() instead.');
    return this.searchCampus(searchTerm, page, limit);
  },

  /**
   * @deprecated Use getCampusPaginated() instead
   * Busca comunidades paginadas (compatibilidade)
   */
  async getCommunitiesPaginated(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    console.warn('getCommunitiesPaginated() is deprecated. Use getCampusPaginated() instead.');
    return this.getCampusPaginated(params);
  }
};

export default campusService;