# 🤖 Prompt para TRAE.ai - Criação de Nova Funcionalidade

## 🎯 Objetivo

Criar uma nova funcionalidade chamada `[NOME_DA_FEATURE]` que inclua:
- ✅ Página frontend com interface completa
- ✅ Service para integração com API
- ✅ API Route para backend
- ✅ Integração com sistema de permissões
- ✅ Item no sidebar com proteção
- ✅ Proteção de rotas

## 📁 Estrutura de Arquivos a Criar

```
src/
├── app/
│   ├── [locale]/(authenticated)/[nome-da-feature]/
│   │   └── page.tsx                    # Página principal
│   └── api/[nome-da-feature]/
│       └── route.ts                    # API Route
└── services/
    └── [nome-da-feature]/
        ├── index.ts                    # Exportações do service
        └── [nome-da-feature].service.ts # Service principal
```

## 🔧 Implementação Detalhada

### 1. **Definição de Módulo e Permissões**

**PRIMEIRO PASSO OBRIGATÓRIO**: Adicione o novo módulo e permissões em `src/types/permissions.ts`:

```typescript
// Adicionar no enum PermissionModule
export enum PermissionModule {
  // ... módulos existentes
  [NOME_MODULO_UPPER_CASE] = '[nome-modulo-kebab-case]',
}

// Adicionar no tipo ModulePermissions
export type ModulePermissions = {
  // ... outros módulos
  '[nome-modulo-kebab-case]': {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
};
```

### 2. **Criação da API Route**

Arquivo: `src/app/api/[nome-da-feature]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

// GET - Listar registros
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissão
    const { data: userPermissions } = await supabase
      .from('user_permissions')
      .select(`
        permission:permissions(module, action)
      `)
      .eq('user_id', session.user.id);

    const hasViewPermission = userPermissions?.some(
      (up: any) => up.permission.module === '[nome-modulo-kebab-case]' && up.permission.action === 'view'
    );

    if (!hasViewPermission) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar dados
    const { data, error } = await supabase
      .from('[nome_tabela]')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar novo registro
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const body = await request.json();

    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissão de criação
    const { data: userPermissions } = await supabase
      .from('user_permissions')
      .select(`
        permission:permissions(module, action)
      `)
      .eq('user_id', session.user.id);

    const hasCreatePermission = userPermissions?.some(
      (up: any) => up.permission.module === '[nome-modulo-kebab-case]' && up.permission.action === 'create'
    );

    if (!hasCreatePermission) {
      return NextResponse.json({ error: 'Sem permissão para criar' }, { status: 403 });
    }

    // Criar registro
    const { data, error } = await supabase
      .from('[nome_tabela]')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
```

### 3. **Criação do Service**

Arquivo: `src/services/[nome-da-feature]/[nome-da-feature].service.ts`

```typescript
import { httpClient } from '../http-client';

export interface [NomeDaFeature]Data {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Create[NomeDaFeature]Data {
  name: string;
  description?: string;
}

export interface Update[NomeDaFeature]Data {
  name?: string;
  description?: string;
}

class [NomeDaFeature]Service {
  private readonly baseUrl = '/api/[nome-da-feature]';

  /**
   * Busca todos os registros
   */
  async getAll(): Promise<[NomeDaFeature]Data[]> {
    const response = await httpClient.get<{ data: [NomeDaFeature]Data[] }>(this.baseUrl);
    return response.data;
  }

  /**
   * Busca um registro por ID
   */
  async getById(id: string): Promise<[NomeDaFeature]Data> {
    const response = await httpClient.get<{ data: [NomeDaFeature]Data }>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Cria um novo registro
   */
  async create(data: Create[NomeDaFeature]Data): Promise<[NomeDaFeature]Data> {
    const response = await httpClient.post<{ data: [NomeDaFeature]Data }>(this.baseUrl, data);
    return response.data;
  }

  /**
   * Atualiza um registro
   */
  async update(id: string, data: Update[NomeDaFeature]Data): Promise<[NomeDaFeature]Data> {
    const response = await httpClient.put<{ data: [NomeDaFeature]Data }>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  /**
   * Remove um registro
   */
  async delete(id: string): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const [nomeDaFeature]Service = new [NomeDaFeature]Service();
```

Arquivo: `src/services/[nome-da-feature]/index.ts`

```typescript
export * from './[nome-da-feature].service';
```

### 4. **Criação da Página**

Arquivo: `src/app/[locale]/(authenticated)/[nome-da-feature]/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { LoadingSpinner } from '@/components/loading-spinner';
import { [nomeDaFeature]Service, [NomeDaFeature]Data } from '@/services/[nome-da-feature]';

export default function [NomeDaFeature]Page() {
  const t = useTranslations('[nome-da-feature]');
  const { toast } = useToast();
  
  const [data, setData] = useState<[NomeDaFeature]Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const result = await [nomeDaFeature]Service.getAll();
      setData(result);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar dados
  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleCreate = () => {
    // Implementar modal/formulário de criação
    console.log('Criar novo registro');
  };

  const handleEdit = (item: [NomeDaFeature]Data) => {
    // Implementar modal/formulário de edição
    console.log('Editar:', item);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    
    try {
      await [nomeDaFeature]Service.delete(id);
      toast({
        title: 'Sucesso',
        description: 'Registro excluído com sucesso',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir registro',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        
        <PermissionGuard 
          module="[nome-modulo-kebab-case]" 
          action="create"
        >
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('create')}
          </Button>
        </PermissionGuard>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de dados */}
      <div className="grid gap-4">
        {filteredData.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">{t('no_data')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {new Date(item.created_at!).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <PermissionGuard 
                    module="[nome-modulo-kebab-case]" 
                    action="edit"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  
                  <PermissionGuard 
                    module="[nome-modulo-kebab-case]" 
                    action="delete"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
```

### 5. **Adição ao Sidebar**

Editar arquivo: `src/hooks/use-navigation-items.ts`

```typescript
// Adicionar no array navigationItems
{
  id: '[nome-da-feature]',
  label: '[Nome da Feature]',
  href: '/[nome-da-feature]',
  icon: [IconeEscolhido], // Importar ícone do lucide-react
  permissions: {
    module: '[nome-modulo-kebab-case]' as PermissionModule,
    action: 'view' as PermissionAction,
  },
},
```

### 6. **Adição das Traduções**

Adicionar em `messages/pt.json`, `messages/en.json`, `messages/es.json`:

```json
{
  "[nome-da-feature]": {
    "title": "[Título da Feature]",
    "description": "[Descrição da feature]",
    "create": "Criar Novo",
    "edit": "Editar",
    "delete": "Excluir",
    "filters": "Filtros",
    "search_placeholder": "Buscar...",
    "no_data": "Nenhum registro encontrado"
  }
}
```

## ✅ Checklist de Implementação

- [ ] **1. Definir módulo e permissões** em `src/types/permissions.ts`
- [ ] **2. Criar API Route** com proteção de permissões
- [ ] **3. Criar Service** com todos os métodos CRUD
- [ ] **4. Criar página** seguindo padrões de design
- [ ] **5. Adicionar item ao sidebar** com proteção
- [ ] **6. Adicionar traduções** em todos os idiomas
- [ ] **7. Testar todas as permissões** (view, create, edit, delete)
- [ ] **8. Verificar responsividade** da página
- [ ] **9. Validar integração** com sistema existente

## 🎨 Padrões de Design

### Componentes Obrigatórios a Usar:
- `Card`, `CardContent`, `CardHeader`, `CardTitle` para containers
- `Button` para ações
- `Input` para campos de texto
- `Badge` para status/tags
- `PermissionGuard` para proteção de elementos
- `LoadingSpinner` para estados de carregamento
- `useToast` para notificações

### Layout Padrão:
1. **Header**: Título + descrição + botão de ação principal
2. **Filtros**: Card com campos de busca/filtro
3. **Lista/Grid**: Cards com dados + ações por item
4. **Estados vazios**: Mensagem quando não há dados

## 🔒 Segurança

### Verificações Obrigatórias:
- ✅ Autenticação em todas as API routes
- ✅ Verificação de permissões específicas por ação
- ✅ Proteção de componentes com `PermissionGuard`
- ✅ Proteção de rotas com middleware
- ✅ Validação de dados de entrada
- ✅ Tratamento de erros adequado

## 📝 Exemplo de Uso do Prompt

**Para criar uma funcionalidade de "Produtos":**

Substitua os placeholders:
- `[NOME_DA_FEATURE]` → `produtos`
- `[nome-da-feature]` → `produtos`
- `[NomeDaFeature]` → `Produto`
- `[nomeDaFeature]` → `produto`
- `[NOME_MODULO_UPPER_CASE]` → `PRODUCTS`
- `[nome-modulo-kebab-case]` → `products`
- `[nome_tabela]` → `products`
- `[IconeEscolhido]` → `Package`

## 🚀 Comandos Úteis

```bash
# Testar a aplicação
npm run dev

# Verificar tipos
npm run type-check

# Executar linting
npm run lint

# Executar testes
npm run test
```

---

**⚠️ IMPORTANTE**: Sempre siga a estrutura e padrões existentes no projeto. Reutilize componentes, mantenha consistência de código e teste todas as funcionalidades antes de considerar a implementação completa.