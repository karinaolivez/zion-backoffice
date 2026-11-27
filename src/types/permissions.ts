// Enums para os módulos do sistema
export enum PermissionModule {
  USUARIOS = 'USUARIOS',
  PERMISSOES = 'PERMISSOES',
  CAMPUS = 'CAMPUS'
}

// Enums para as ações possíveis
export enum PermissionAction {
  VER = 'VER',
  CRIAR = 'CRIAR',
  EDITAR = 'EDITAR',
  REMOVER = 'REMOVER',
  LISTAR = 'LISTAR'
}

// Status do usuário autorizado
export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE'
}

// Interface para usuário autorizado
export interface AuthorizedUser {
  id: string;
  external_id: string;
  username: string;
  full_name: string;
  email?: string;
  avatar?: string;
  document_type?: string;
  document_value?: string;
  status: UserStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
}

// Interface para módulo
export interface Module {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para módulo com suas permissões
export interface ModuleWithPermissions extends Module {
  permissions: Permission[];
}

// Interface para ação
export interface Action {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
}

// Interface para permissão
export interface Permission {
  id: string;
  module_id: string;
  action_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  module?: Module;
  action?: Action;
}

// Interface para campus
export interface Campus {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para permissão de usuário
export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  campus_ids: string[];
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  permission?: Permission;
  user?: AuthorizedUser;
  campus?: Campus[];
}

// Interface para permissão com detalhes completos
export interface PermissionWithDetails extends Permission {
  module: Module;
  action: Action;
}

// Interface para permissão de usuário com detalhes
export interface UserPermissionWithDetails extends UserPermission {
  permission: PermissionWithDetails;
  user: AuthorizedUser;
  campus: Campus[];
}

// Interface para resumo de permissões do usuário
export interface UserPermissionSummary {
  user: AuthorizedUser;
  permissions: UserPermissionWithDetails[];
  modules: string[];
  actions: string[];
  campus_ids: string[];
}

// Interface para filtros de permissão
export interface PermissionFilter {
  module?: PermissionModule;
  action?: PermissionAction;
  is_active?: boolean;
  search?: string;
}

// Interface para filtros de usuário
export interface UserFilter {
  status?: UserStatus;
  is_active?: boolean;
  search?: string;
}

// Interface para dados de solicitação de acesso
export interface AccessRequestData {
  external_id: string;
  username: string;
  full_name: string;
  avatar?: string;
  document_type?: string;
  document_value?: string;
}

// Interface para resposta de API paginada
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Interface para contexto de permissões
export interface PermissionsContextType {
  user: AuthorizedUser | null;
  permissions: UserPermissionSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkPermission: (module: PermissionModule, action: PermissionAction, campusId?: string) => boolean;
  hasModuleAccess: (module: PermissionModule) => boolean;
  getUserCampusIds: (module?: PermissionModule) => string[];
  refreshPermissions: () => Promise<void>;
}

// Interface para erro de autenticação
export interface AuthenticationError extends Error {
  code: string;
  details?: any;
}

// Interface para dados de login
export interface LoginData {
  username: string;
  password: string;
}

// Interface para resposta de login
export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: any;
  permissions?: UserPermissionSummary;
  message?: string;
  requiresAccess?: boolean;
}

// Interface para dados de criação de permissão
export interface CreatePermissionData {
  module_id: string;
  action_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

// Interface para dados de atualização de permissão
export interface UpdatePermissionData extends Partial<CreatePermissionData> {
  is_active?: boolean;
}

// Interface para dados de criação de permissão de usuário
export interface CreateUserPermissionData {
  user_id: string;
  permission_id: string;
  campus_ids: string[];
  expires_at?: string;
}

// Interface para dados de atualização de permissão de usuário
export interface UpdateUserPermissionData extends Partial<CreateUserPermissionData> {
  is_active?: boolean;
}

// Interface para dados de aprovação de usuário
export interface ApproveUserData {
  user_id: string;
  approved_by: string;
  permissions?: CreateUserPermissionData[];
}

// Tipos utilitários
export type PermissionKey = `${PermissionModule}_${PermissionAction}`;
export type ModulePermissions = Record<PermissionAction, boolean>;
export type UserPermissions = Record<PermissionModule, ModulePermissions>;

// Interface para configuração de permissões
export interface PermissionConfig {
  module: PermissionModule;
  actions: PermissionAction[];
  campus_required: boolean;
  description?: string;
}