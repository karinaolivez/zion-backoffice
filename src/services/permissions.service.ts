import { createClient } from '@supabase/supabase-js';
import {
  AuthorizedUser,
  UserStatus,
  Permission,
  UserPermission,
  UserPermissionSummary,
  Campus,
  Module,
  Action,
  PermissionFilter,
  UserFilter,
  AccessRequestData,
  CreatePermissionData,
  UpdatePermissionData,
  CreateUserPermissionData,
  UpdateUserPermissionData,
  ApproveUserData,
  PaginatedResponse,
  AuthenticationError,
  PermissionWithDetails,
  UserPermissionWithDetails
} from '@/types/permissions';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class PermissionsService {
  // Métodos para usuários autorizados
  static async getAuthorizedUsers(
    filter?: UserFilter,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<AuthorizedUser>> {
    let query = supabase
      .from('authorized_users')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', filter.is_active);
    }
    if (filter?.search) {
      query = query.or(`full_name.ilike.%${filter.search}%,username.ilike.%${filter.search}%`);
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar usuários autorizados: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  static async getAuthorizedUser(external_id: string): Promise<AuthorizedUser | null> {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('external_id', external_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    return data;
  }

  static async createAuthorizedUser(userData: AccessRequestData): Promise<AuthorizedUser> {
    const { data, error } = await supabase
      .from('authorized_users')
      .insert([{
        external_id: userData.external_id,
        username: userData.username,
        full_name: userData.full_name,
        avatar: userData.avatar,
        document_type: userData.document_type,
        document_value: userData.document_value,
        status: UserStatus.PENDING
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }

    return data;
  }

  static async updateAuthorizedUser(
    id: string,
    updates: Partial<AuthorizedUser>
  ): Promise<AuthorizedUser> {
    const { data, error } = await supabase
      .from('auth_roles_permissions.authorized_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }

    return data;
  }

  static async updateUserStatus(user_id: string, status: UserStatus): Promise<AuthorizedUser> {
    const { data, error } = await supabase
      .from('authorized_users')
      .update({ status })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar status do usuário: ${error.message}`);
    }

    return data;
  }

  static async approveUser(approvalData: ApproveUserData): Promise<AuthorizedUser> {
    // Aprovar usuário
    const { data: user, error: userError } = await supabase
      .from('authorized_users')
      .update({
        status: UserStatus.APPROVED,
        approved_by: approvalData.approved_by,
        approved_at: new Date().toISOString()
      })
      .eq('id', approvalData.user_id)
      .select()
      .single();

    if (userError) {
      throw new Error(`Erro ao aprovar usuário: ${userError.message}`);
    }

    // Adicionar permissões se fornecidas
    if (approvalData.permissions && approvalData.permissions.length > 0) {
      const permissionsData = approvalData.permissions.map(p => ({
        ...p,
        created_by: approvalData.approved_by
      }));

      const { error: permError } = await supabase
        .from('user_permissions')
        .insert(permissionsData);

      if (permError) {
        throw new Error(`Erro ao adicionar permissões: ${permError.message}`);
      }
    }

    return user;
  }

  static async rejectUser(user_id: string, rejected_by: string): Promise<AuthorizedUser> {
    const { data, error } = await supabase
      .from('authorized_users')
      .update({
        status: UserStatus.REJECTED,
        approved_by: rejected_by,
        approved_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao rejeitar usuário: ${error.message}`);
    }

    return data;
  }

  // Métodos para permissões
  static async getPermissions(
    filter?: PermissionFilter,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Permission>> {
    let query = supabase
      .from('permissions')
      .select(`
        *,
        module:modules(*),
        action:actions(*)
      `)
      .eq('is_active', true);

    // Aplicar filtros
    if (filter?.module) {
      query = query.eq('modules.name', filter.module);
    }

    if (filter?.action) {
      query = query.eq('actions.name', filter.action);
    }

    if (filter?.search) {
      query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
    }

    // Contar total de registros
    const { count } = await supabase
      .from('permissions')
      .select('*', { count: 'exact', head: true });

    // Buscar dados paginados
    const { data, error } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data as PermissionWithDetails[],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  static async getPermission(id: string): Promise<Permission | null> {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        module:modules(*),
        action:actions(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar permissão: ${error.message}`);
    }

    return data;
  }

  static async createPermission(permissionData: CreatePermissionData): Promise<Permission> {
    const { data, error } = await supabase
      .from('permissions')
      .insert([permissionData])
      .select(`
        *,
        module:modules(*),
        action:actions(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar permissão: ${error.message}`);
    }

    return data;
  }

  // Métodos para permissões de usuários
  static async getUserPermissions(
    user_id: string,
    filter?: PermissionFilter
  ): Promise<UserPermission[]> {
    let query = supabase
      .from('user_permissions')
      .select(`
        *,
        permission:permissions(
          *,
          module:modules(*),
          action:actions(*)
        )
      `)
      .eq('user_id', user_id);

    // Aplicar filtros
    if (filter?.is_active !== undefined) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar permissões do usuário: ${error.message}`);
    }

    return data || [];
  }

  static async getUserPermissionSummary(external_id: string): Promise<UserPermissionSummary | null> {
    try {
      // Buscar usuário
      const user = await this.getAuthorizedUser(external_id);
      if (!user || user.status !== UserStatus.APPROVED) {
        return null;
      }

      // Buscar permissões do usuário
      const userPermissions = await supabase
        .from('user_permissions')
        .select(`
          *,
          permission:permissions(
            *,
            module:modules(*),
            action:actions(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (userPermissions.error) {
        throw userPermissions.error;
      }

      const permissions = userPermissions.data as UserPermissionWithDetails[];

      // Coletar todos os campus_ids únicos
      const allCampusIds = [...new Set(permissions.flatMap((p: UserPermissionWithDetails) => p.campus_ids || []))];

      // Buscar informações dos campus separadamente se houver IDs
      let campusData: Campus[] = [];
      if (allCampusIds.length > 0) {
        const campusResult = await supabase
          .from('campus')
          .select('*')
          .in('id', allCampusIds);

        if (!campusResult.error) {
          campusData = campusResult.data || [];
        }
      }

      // Adicionar informações de campus às permissões
      const permissionsWithCampus = permissions.map((p: UserPermissionWithDetails) => ({
        ...p,
        campus: campusData.filter(c => p.campus_ids?.includes(c.id))
      }));

      const modules = [...new Set(permissions.map((p: UserPermissionWithDetails) => p.permission?.module?.name).filter(Boolean))];
      const actions = [...new Set(permissions.map((p: UserPermissionWithDetails) => p.permission?.action?.name).filter(Boolean))];
      const campus_ids = allCampusIds;

      return {
        user,
        permissions: permissionsWithCampus,
        modules,
        actions,
        campus_ids
      };
    } catch (error) {
      console.error('Erro ao buscar resumo de permissões:', error);
      return null;
    }
  }

  static async addUserPermission(permissionData: CreateUserPermissionData): Promise<UserPermission> {
    const { data, error } = await supabase
      .from('user_permissions')
      .insert([permissionData])
      .select(`
        *,
        permission:permissions(
          *,
          module:modules(*),
          action:actions(*)
        ),
        user:authorized_users!user_permissions_user_id_fkey(id, username, full_name),
        created_by_user:authorized_users!user_permissions_created_by_fkey(id, username, full_name)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao adicionar permissão ao usuário: ${error.message}`);
    }

    return data;
  }

  static async assignUserPermission(data: {
    user_id: string;
    permission_id: string;
    assigned_by: string;
  }): Promise<UserPermission> {
    const permissionData: CreateUserPermissionData = {
      user_id: data.user_id,
      permission_id: data.permission_id,
      campus_ids: [],
    };

    return this.addUserPermission(permissionData);
  }

  static async removeUserPermission(data: {
    user_id: string;
    permission_id: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', data.user_id)
      .eq('permission_id', data.permission_id);

    if (error) {
      throw new Error(`Erro ao remover permissão do usuário: ${error.message}`);
    }
  }

  static async updateUserPermission(
    user_permission_id: string,
    updateData: Partial<CreateUserPermissionData>
  ): Promise<UserPermission> {
    const { data, error } = await supabase
      .from('user_permissions')
      .update(updateData)
      .eq('id', user_permission_id)
      .select(`
        *,
        permission:permissions(
          *,
          module:modules(*),
          action:actions(*)
        ),
        user:authorized_users(id, username, full_name),
        created_by_user:authorized_users!user_permissions_created_by_fkey(id, username, full_name)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar permissão do usuário: ${error.message}`);
    }

    return data;
  }

  // Métodos para gerenciar permissões
  static async updatePermission(id: string, data: UpdatePermissionData): Promise<Permission> {
    const { data: result, error } = await supabase
      .from('permissions')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        module:modules(*),
        action:actions(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return result;
  }

  static async deletePermission(id: string): Promise<void> {
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  static async inactivatePermission(id: string): Promise<Permission> {
    return this.updatePermission(id, { is_active: false });
  }

  // Métodos para módulos e ações
  static async getModules(): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      throw new Error(`Erro ao buscar módulos: ${error.message}`);
    }

    return data || [];
  }

  static async createModule(moduleData: {
    name: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .insert({
        name: moduleData.name.toUpperCase(),
        display_name: moduleData.name,
        description: moduleData.description,
        is_active: moduleData.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar módulo: ${error.message}`);
    }

    return data;
  }

  static async updateModule(id: string, moduleData: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<Module> {
    const updateData: any = {};

    if (moduleData.name) {
      updateData.name = moduleData.name.toUpperCase();
      updateData.display_name = moduleData.name;
    }
    if (moduleData.description !== undefined) {
      updateData.description = moduleData.description;
    }
    if (moduleData.is_active !== undefined) {
      updateData.is_active = moduleData.is_active;
    }

    const { data, error } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar módulo: ${error.message}`);
    }

    return data;
  }

  static async deleteModule(id: string): Promise<void> {
    // Primeiro, verificar se há permissões associadas
    const { data: permissions } = await supabase
      .from('permissions')
      .select('id')
      .eq('module_id', id)
      .limit(1);

    if (permissions && permissions.length > 0) {
      throw new Error('Não é possível excluir um módulo que possui permissões associadas');
    }

    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir módulo: ${error.message}`);
    }
  }

  static async getPermissionsByModule(moduleId: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select(`
        *,
        module:modules(*),
        action:actions(*)
      `)
      .eq('module_id', moduleId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Erro ao buscar permissões do módulo: ${error.message}`);
    }

    return data || [];
  }

  static async getActions(): Promise<Action[]> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .order('display_name');

    if (error) {
      throw new Error(`Erro ao buscar ações: ${error.message}`);
    }

    return data || [];
  }

  static async getCampus(): Promise<Campus[]> {
    const { data, error } = await supabase
      .from('campus')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Erro ao buscar campus: ${error.message}`);
    }

    return data || [];
  }

  // Métodos de validação
  static async validateUserAccess(external_id: string): Promise<boolean> {
    const user = await this.getAuthorizedUser(external_id);
    return user !== null && user.status === UserStatus.APPROVED && user.is_active;
  }

  static async checkUserPermission(
    external_id: string,
    module: string,
    action: string,
    campus_id?: string
  ): Promise<boolean> {
    const summary = await this.getUserPermissionSummary(external_id);
    if (!summary) return false;

    const hasPermission = summary.permissions.some(p => {
      const moduleMatch = p.permission.module.name === module;
      const actionMatch = p.permission.action.name === action;

      // Lógica de verificação de campus:
      // - Se campus_ids está vazio ([]), a permissão é válida para todos os campus
      // - Se campus_id não foi fornecido, verifica apenas módulo e ação
      // - Se campus_id foi fornecido, verifica se está na lista ou se a lista está vazia
      const campusMatch = !campus_id ||
        p.campus_ids.length === 0 ||
        p.campus_ids.includes(campus_id);

      const isActive = p.is_active && p.permission.is_active;
      const notExpired = !p.expires_at || new Date(p.expires_at) > new Date();

      return moduleMatch && actionMatch && campusMatch && isActive && notExpired;
    });

    return hasPermission;
  }

  // Novo método para verificar permissões com múltiplos campus
  static async checkUserPermissionForCampuses(
    external_id: string,
    module: string,
    action: string,
    campus_ids?: string[]
  ): Promise<boolean> {
    const summary = await this.getUserPermissionSummary(external_id);
    if (!summary) return false;

    // Se não foram especificados campus, verifica apenas módulo e ação
    if (!campus_ids || campus_ids.length === 0) {
      return this.checkUserPermission(external_id, module, action);
    }

    // Verifica se o usuário tem permissão para pelo menos um dos campus especificados
    const hasPermission = summary.permissions.some(p => {
      const moduleMatch = p.permission.module.name === module;
      const actionMatch = p.permission.action.name === action;

      // Se a permissão é para todos os campus (array vazio), é válida
      // Caso contrário, verifica se há interseção entre os campus da permissão e os solicitados
      const campusMatch = p.campus_ids.length === 0 ||
        campus_ids.some(campusId => p.campus_ids.includes(campusId));

      const isActive = p.is_active && p.permission.is_active;
      const notExpired = !p.expires_at || new Date(p.expires_at) > new Date();

      return moduleMatch && actionMatch && campusMatch && isActive && notExpired;
    });

    return hasPermission;
  }

  // Método para obter os campus onde o usuário tem uma permissão específica
  static async getUserCampusForPermission(
    external_id: string,
    module: string,
    action: string
  ): Promise<string[]> {
    const summary = await this.getUserPermissionSummary(external_id);
    if (!summary) return [];

    const campusIds = new Set<string>();

    summary.permissions.forEach(p => {
      const moduleMatch = p.permission.module.name === module;
      const actionMatch = p.permission.action.name === action;
      const isActive = p.is_active && p.permission.is_active;
      const notExpired = !p.expires_at || new Date(p.expires_at) > new Date();

      if (moduleMatch && actionMatch && isActive && notExpired) {
        // Se campus_ids está vazio, significa todos os campus
        if (p.campus_ids.length === 0) {
          return []; // Retorna array vazio indicando "todos os campus"
        }

        // Adiciona os campus específicos
        p.campus_ids.forEach(campusId => campusIds.add(campusId));
      }
    });

    return Array.from(campusIds);
  }
}