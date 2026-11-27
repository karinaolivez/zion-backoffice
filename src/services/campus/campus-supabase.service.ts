import { supabase } from '../../lib/supabase';
import * as Types from '../../types';

export interface CampusSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  organizationId?: string;
  communityGroupId?: string;
}

/**
 * Serviço para gerenciar operações CRUD de Campus usando Supabase
 * Substitui completamente a implementação anterior que usava a API externa
 */
export const campusSupabaseService = {
  /**
   * Cria um novo campus
   * @param campusData - Dados do campus a ser criado
   * @returns Promise com o campus criado
   */
  async createCampus(campusData: Types.CreateCampusRequest): Promise<Types.CampusResponse> {
    try {
      const { data, error } = await supabase
        .from('campus')
        .insert([{
          name: campusData.name,
          slug: campusData.slug,
          organization_id: campusData.organizationId,
          community_group_id: campusData.communityGroupId,
          community_group_name: campusData.communityGroupName,
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar campus:', error);
        return {
          success: false,
          error: error.message,
          message: 'Falha ao criar campus'
        };
      }

      // Converter snake_case para camelCase
      const campus: Types.Campus = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        organizationId: data.organization_id,
        communityGroupId: data.community_group_id,
        communityGroupName: data.community_group_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: campus,
        message: 'Campus criado com sucesso'
      };
    } catch (error) {
      console.error('Erro inesperado ao criar campus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao criar campus'
      };
    }
  },

  /**
   * Busca todos os campus com filtros opcionais
   * @param params - Parâmetros de busca
   * @returns Promise com lista de campus
   */
  async getCampus(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    try {
      let query = supabase
        .from('campus')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId);
      }

      if (params.communityGroupId) {
        query = query.eq('community_group_id', params.communityGroupId);
      }

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%,community_group_name.ilike.%${params.search}%`);
      }

      // Aplicar paginação
      if (params.page && params.limit) {
        const from = (params.page - 1) * params.limit;
        const to = from + params.limit - 1;
        query = query.range(from, to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar campus:', error);
        return {
          success: false,
          error: error.message,
          message: 'Falha ao buscar campus'
        };
      }

      // Converter snake_case para camelCase
      const campus: Types.Campus[] = data.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        organizationId: item.organization_id,
        communityGroupId: item.community_group_id,
        communityGroupName: item.community_group_name,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return {
        success: true,
        data: campus,
        message: 'Campus encontrados com sucesso'
      };
    } catch (error) {
      console.error('Erro inesperado ao buscar campus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao buscar campus'
      };
    }
  },

  /**
   * Busca um campus específico por ID
   * @param id - ID do campus
   * @returns Promise com o campus encontrado
   */
  async getCampusById(id: string): Promise<Types.CampusResponse> {
    try {
      const { data, error } = await supabase
        .from('campus')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar campus por ID:', error);
        return {
          success: false,
          error: error.message,
          message: 'Campus não encontrado'
        };
      }

      // Converter snake_case para camelCase
      const campus: Types.Campus = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        organizationId: data.organization_id,
        communityGroupId: data.community_group_id,
        communityGroupName: data.community_group_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: campus,
        message: 'Campus encontrado com sucesso'
      };
    } catch (error) {
      console.error('Erro inesperado ao buscar campus por ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao buscar campus'
      };
    }
  },

  /**
   * Atualiza um campus existente
   * @param updateData - Dados para atualização
   * @returns Promise com o campus atualizado
   */
  async updateCampus(updateData: Types.UpdateCampusRequest): Promise<Types.CampusResponse> {
    try {
      const updatePayload: any = {};

      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.slug) updatePayload.slug = updateData.slug;
      if (updateData.organizationId) updatePayload.organization_id = updateData.organizationId;
      if (updateData.communityGroupId) updatePayload.community_group_id = updateData.communityGroupId;
      if (updateData.communityGroupName) updatePayload.community_group_name = updateData.communityGroupName;

      const { data, error } = await supabase
        .from('campus')
        .update(updatePayload)
        .eq('id', updateData.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar campus:', error);
        return {
          success: false,
          error: error.message,
          message: 'Falha ao atualizar campus'
        };
      }

      // Converter snake_case para camelCase
      const campus: Types.Campus = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        organizationId: data.organization_id,
        communityGroupId: data.community_group_id,
        communityGroupName: data.community_group_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return {
        success: true,
        data: campus,
        message: 'Campus atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro inesperado ao atualizar campus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao atualizar campus'
      };
    }
  },

  /**
   * Remove um campus
   * @param id - ID do campus a ser removido
   * @returns Promise com resultado da operação
   */
  async deleteCampus(id: string): Promise<Types.CampusResponse> {
    try {
      const { error } = await supabase
        .from('campus')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar campus:', error);
        return {
          success: false,
          error: error.message,
          message: 'Falha ao deletar campus'
        };
      }

      return {
        success: true,
        message: 'Campus deletado com sucesso'
      };
    } catch (error) {
      console.error('Erro inesperado ao deletar campus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha ao deletar campus'
      };
    }
  },

  /**
   * Busca campus com termo de pesquisa (compatibilidade com API anterior)
   * @param searchTerm - Termo para buscar
   * @param page - Página atual
   * @param limit - Limite de resultados
   * @returns Promise com resultado da busca
   */
  async searchCampus(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Types.CampusResponse> {
    return this.getCampus({
      search: searchTerm,
      page,
      limit
    });
  },

  /**
   * Busca campus paginados com informações de paginação
   * @param params - Parâmetros de busca
   * @returns Promise com a resposta paginada
   */
  async getCampusPaginated(params: CampusSearchParams = {}): Promise<Types.CampusResponse> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;

      // Buscar total de registros primeiro
      let countQuery = supabase
        .from('campus')
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros para contagem
      if (params.organizationId) {
        countQuery = countQuery.eq('organization_id', params.organizationId);
      }

      if (params.communityGroupId) {
        countQuery = countQuery.eq('community_group_id', params.communityGroupId);
      }

      if (params.search) {
        countQuery = countQuery.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%,community_group_name.ilike.%${params.search}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Erro ao contar campus:', countError);
        return {
          success: false,
          error: countError.message,
          message: 'Falha ao contar campus'
        };
      }

      // Buscar dados paginados
      let query = supabase
        .from('campus')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (params.organizationId) {
        query = query.eq('organization_id', params.organizationId);
      }

      if (params.communityGroupId) {
        query = query.eq('community_group_id', params.communityGroupId);
      }

      if (params.search) {
        query = query.or(`name.ilike.%${params.search}%,slug.ilike.%${params.search}%,community_group_name.ilike.%${params.search}%`);
      }

      // Aplicar paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar campus paginados:', error);
        return {
          success: false,
          error: error.message,
          message: 'Falha ao buscar campus paginados'
        };
      }

      // Converter snake_case para camelCase
      const campuses: Types.Campus[] = data.map(item => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        organizationId: item.organization_id,
        communityGroupId: item.community_group_id,
        communityGroupName: item.community_group_name,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      // Calcular informações de paginação
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      const paginatedResponse: Types.CampusPaginatedResponse = {
        campuses,
        pageInfo: {
          totalCount,
          currentPage: page,
          totalPages,
          pageSize: limit
        }
      };

      return {
        success: true,
        data: paginatedResponse,
        message: 'Campus encontrados com sucesso'
      };

    } catch (error) {
      console.error('Erro inesperado ao buscar campus paginados:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Falha inesperada ao buscar campus paginados'
      };
    }
  }
};

export default campusSupabaseService;