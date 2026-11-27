import { createClient } from '@supabase/supabase-js';
import { authNewService } from '@/services/auth/auth-new.service';
import { PermissionsService } from '@/services/permissions.service';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface UserData {
  id: string;
  email: string;
  phone: string;
  username: string;
  unmaskedEmail: string;
  unmaskedPhone: string;
}

export interface CreateUserRequest {
  document: string;
  nationalityId: string;
  name: string;
}

export interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    external_id: string;
    username: string;
    full_name: string;
    document_type: string;
    document_value: string;
    status: string;
  };
  error?: string;
}

class UserService {
  /**
   * Verifica se o usuário existe na plataforma global da Zion
   */
  async checkUserInGlobalPlatform(document: string, nationalityId: string): Promise<UserData> {
    try {
      const response = await authNewService.checkUser(`${nationalityId}:${document}`);

      if (!response.success || !response.user) {
        throw new Error('User not found in global platform');
      }

      return {
        id: response.user.id,
        email: response.user.email ?? '',
        phone: response.user.phone ?? '',
        username: response.user.username ?? '',
        unmaskedEmail: response.user.unmaskedEmail ?? '',
        unmaskedPhone: response.user.unmaskedPhone ?? '',
      };
    } catch (error) {
      throw new Error('User not found in global platform');
    }
  }

  /**
   * Cria um usuário no Supabase Auth
   */
  async createSupabaseAuthUser(userData: UserData, password?: string): Promise<string> {
    try {
      // Gera uma senha temporária se não fornecida
      const tempPassword = password || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.unmaskedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          username: userData.username,
          external_id: userData.id,
          phone: userData.phone,
          unmasked_email: userData.unmaskedEmail,
          unmasked_phone: userData.unmaskedPhone,
        }
      });

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('Failed to create auth user: No user returned');
      }

      return authUser.user.id;
    } catch (error) {
      throw new Error(`Failed to create Supabase Auth user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cria um usuário na tabela authorized_users
   */
  async createAuthorizedUser(
    userData: UserData,
    createUserRequest: CreateUserRequest,
    authUserId: string
  ): Promise<any> {
    try {
      const { data: authorizedUser, error } = await supabase
        .from('authorized_users')
        .insert([
          {
            external_id: userData.id,
            username: userData.username,
            full_name: createUserRequest.name,
            document_type: createUserRequest.nationalityId,
            document_value: createUserRequest.document,
            status: 'APPROVED', // Usuário aprovado automaticamente
            is_active: true,
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create authorized user: ${error.message}`);
      }

      return authorizedUser;
    } catch (error) {
      throw new Error(`Failed to create authorized user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Processo completo de criação de usuário
   */
  async createUser(createUserRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // 1. Verificar se o usuário existe na plataforma global
      const globalUserData = await this.checkUserInGlobalPlatform(
        createUserRequest.document,
        createUserRequest.nationalityId
      );

      // 2. Verificar se o usuário já existe na tabela authorized_users
      const { data: existingUser } = await supabase
        .from('authorized_users')
        .select('id, external_id')
        .eq('external_id', globalUserData.id)
        .single();

      if (existingUser) {
        throw new Error('User already exists in the system');
      }

      // 3. Criar usuário no Supabase Auth
      const authUserId = await this.createSupabaseAuthUser(globalUserData);

      // 4. Criar usuário na tabela authorized_users
      const authorizedUser = await this.createAuthorizedUser(
        globalUserData,
        createUserRequest,
        authUserId
      );

      return {
        success: true,
        user: {
          id: authorizedUser.id,
          external_id: authorizedUser.external_id,
          username: authorizedUser.username,
          full_name: authorizedUser.full_name,
          document_type: authorizedUser.document_type,
          document_value: authorizedUser.document_value,
          status: authorizedUser.status,
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verifica se um usuário já existe no sistema
   */
  async checkUserExists(document: string, nationalityId: string): Promise<boolean> {
    try {
      const globalUserData = await this.checkUserInGlobalPlatform(document, nationalityId);

      const { data: existingUser } = await supabase
        .from('authorized_users')
        .select('id')
        .eq('external_id', globalUserData.id)
        .single();

      return !!existingUser;
    } catch (error) {
      return false;
    }
  }
}

export const userService = new UserService();