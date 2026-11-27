export const serviceTemplate = (featureName, pascalName, camelName) => `import { supabase } from '@/lib/supabase';

// Tipos
export interface ${pascalName}Data {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Create${pascalName}Data {
  name: string;
  description?: string;
}

export interface Update${pascalName}Data {
  name?: string;
  description?: string;
}

// Service
class ${pascalName}Service {
  private tableName = '${featureName}'; // TODO: Ajustar nome da tabela conforme necessário

  /**
   * Buscar todos os registros
   */
  async getAll(): Promise<${pascalName}Data[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar ${featureName}:', error);
        throw new Error('Erro ao buscar registros');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no service getAll:', error);
      throw error;
    }
  }

  /**
   * Buscar registro por ID
   */
  async getById(id: string): Promise<${pascalName}Data | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Registro não encontrado
        }
        console.error('Erro ao buscar ${featureName} por ID:', error);
        throw new Error('Erro ao buscar registro');
      }

      return data;
    } catch (error) {
      console.error('Erro no service getById:', error);
      throw error;
    }
  }

  /**
   * Criar novo registro
   */
  async create(data: Create${pascalName}Data): Promise<${pascalName}Data> {
    try {
      const { data: newRecord, error } = await supabase
        .from(this.tableName)
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ${featureName}:', error);
        throw new Error('Erro ao criar registro');
      }

      return newRecord;
    } catch (error) {
      console.error('Erro no service create:', error);
      throw error;
    }
  }

  /**
   * Atualizar registro
   */
  async update(id: string, data: Update${pascalName}Data): Promise<${pascalName}Data> {
    try {
      const { data: updatedRecord, error } = await supabase
        .from(this.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar ${featureName}:', error);
        throw new Error('Erro ao atualizar registro');
      }

      return updatedRecord;
    } catch (error) {
      console.error('Erro no service update:', error);
      throw error;
    }
  }

  /**
   * Excluir registro
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir ${featureName}:', error);
        throw new Error('Erro ao excluir registro');
      }
    } catch (error) {
      console.error('Erro no service delete:', error);
      throw error;
    }
  }

  /**
   * Buscar com filtros
   */
  async search(filters: {
    name?: string;
    limit?: number;
    offset?: number;
  }): Promise<${pascalName}Data[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*');

      // Aplicar filtros
      if (filters.name) {
        query = query.ilike('name', \`%\${filters.name}%\`);
      }

      // Paginação
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      // Ordenação
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar ${featureName} com filtros:', error);
        throw new Error('Erro ao buscar registros');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no service search:', error);
      throw error;
    }
  }

  /**
   * Contar total de registros
   */
  async count(filters?: { name?: string }): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters?.name) {
        query = query.ilike('name', \`%\${filters.name}%\`);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Erro ao contar ${featureName}:', error);
        throw new Error('Erro ao contar registros');
      }

      return count || 0;
    } catch (error) {
      console.error('Erro no service count:', error);
      throw error;
    }
  }
}

// Instância singleton
export const ${camelName}Service = new ${pascalName}Service();

// Mock data para desenvolvimento (remover quando conectar com banco real)
export const mock${pascalName}Data: ${pascalName}Data[] = [
  {
    id: '1',
    name: 'Exemplo 1',
    description: 'Descrição do exemplo 1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Exemplo 2',
    description: 'Descrição do exemplo 2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];`;