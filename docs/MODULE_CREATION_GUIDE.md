# 📋 Guia Completo: Criação de Módulos e Permissões

Este documento detalha o processo completo para criar um novo módulo e suas permissões no sistema, incluindo implementação técnica, boas práticas e exemplos práticos.

## 📑 Índice

1. [Visão Geral do Sistema](#-visão-geral-do-sistema)
2. [Passo a Passo para Cadastrar um Novo Módulo](#-passo-a-passo-para-cadastrar-um-novo-módulo)
3. [Implementação Técnica](#-implementação-técnica)
4. [Boas Práticas](#-boas-práticas)
5. [Exemplos Práticos](#-exemplos-práticos)
6. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Visão Geral do Sistema

### Arquitetura de Permissões

O sistema utiliza uma arquitetura baseada em **Módulos** e **Ações**, onde:

- **Módulos**: Representam funcionalidades ou seções do sistema (ex: USUARIOS, PERMISSOES, FINANCEIRO)
- **Ações**: Representam operações que podem ser realizadas (VER, CRIAR, EDITAR, REMOVER, LISTAR)
- **Permissões**: Combinação de um módulo + ação (ex: USUARIOS_VER, FINANCEIRO_CRIAR)

### Estrutura do Banco de Dados

```sql
-- Tabela de módulos
modules (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,     -- Nome técnico (UPPERCASE)
  display_name VARCHAR(255),    -- Nome para exibição
  description TEXT,
  is_active BOOLEAN DEFAULT true
)

-- Tabela de ações
actions (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,     -- VER, CRIAR, EDITAR, etc.
  display_name VARCHAR(255),    -- Visualizar, Criar, Editar, etc.
  description TEXT
)

-- Tabela de permissões (módulo + ação)
permissions (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  action_id UUID REFERENCES actions(id),
  name VARCHAR(255),            -- USUARIOS_VER, FINANCEIRO_CRIAR, etc.
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(module_id, action_id)
)

-- Tabela de permissões de usuários
user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES authorized_users(id),
  permission_id UUID REFERENCES permissions(id),
  campus_ids UUID[],            -- Array de campus (vazio = todos)
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, permission_id)
)
```

---

## 📝 Passo a Passo para Cadastrar um Novo Módulo

### 1. Definição do Nome e Identificador Único

#### 1.1 Escolha do Nome Técnico
- Use **MAIÚSCULAS** e **SNAKE_CASE**
- Seja descritivo e conciso
- Evite caracteres especiais

```typescript
// ❌ Exemplos incorretos
'financeiro'
'Relatórios'
'MÓDULO-VENDAS'

// ✅ Exemplos corretos
'FINANCEIRO'
'RELATORIOS'
'VENDAS'
'RECURSOS_HUMANOS'
```

#### 1.2 Nome de Exibição
- Use capitalização adequada
- Pode conter acentos e espaços
- Seja amigável ao usuário

```typescript
// Exemplos de mapeamento
'FINANCEIRO' → 'Financeiro'
'RELATORIOS' → 'Relatórios'
'RECURSOS_HUMANOS' → 'Recursos Humanos'
```

### 2. Atualização dos Enums TypeScript

#### 2.1 Adicionar ao Enum PermissionModule

Edite o arquivo `src/types/permissions.ts`:

```typescript
// Adicione o novo módulo ao enum
export enum PermissionModule {
  USUARIOS = 'USUARIOS',
  PERMISSOES = 'PERMISSOES',
  CAMPUS = 'CAMPUS',
  FINANCEIRO = 'FINANCEIRO',        // ← Novo módulo
  RELATORIOS = 'RELATORIOS',        // ← Novo módulo
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS' // ← Novo módulo
}
```

### 3. Criação da Migration na Aplicação

Acesse a plataforma com o usuário admin e crie um novo módulo em:

`http://localhost:3000/pt/admin/modules-permissions`

depois, crie as permissões básicas baseadas em ações CRUD:

- `FINANCEIRO_VER` - Visualizar dados financeiros
- `FINANCEIRO_CRIAR` - Criar novos registros financeiros
- `FINANCEIRO_EDITAR` - Editar registros existentes
- `FINANCEIRO_REMOVER` - Remover registros
- `FINANCEIRO_LISTAR` - Listar registros financeiros

---

## 🔧 Implementação Técnica

### 1. Proteção de Rotas no Backend

#### 1.1 Middleware de Autenticação

O middleware já está configurado em `src/middleware.ts` para proteger rotas administrativas:

```typescript
// Routes que requerem autenticação
const protectedRoutes = ['/dashboard', '/profile', '/admin', '/settings'];

// O middleware automaticamente:
// 1. Verifica se o usuário está autenticado
// 2. Redireciona para login se não estiver
// 3. Permite acesso se estiver autenticado
```

#### 1.2 Proteção de Páginas com RouteGuard

Use o componente `RouteGuard` para proteger páginas específicas:

```typescript
// src/app/[locale]/(authenticated)/financeiro/page.tsx
'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { PermissionModule, PermissionAction } from '@/types/permissions';

export default function FinanceiroPage() {
  return (
    <RouteGuard 
      module={PermissionModule.FINANCEIRO} 
      action={PermissionAction.VER}
    >
      <div>
        <h1>Módulo Financeiro</h1>
        {/* Conteúdo da página */}
      </div>
    </RouteGuard>
  );
}
```

#### 1.3 Proteção de Componentes Específicos

Para proteger componentes individuais:

```typescript
// Componente de botão para criar registros financeiros
import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';

const CreateFinanceButton = () => {
  const { hasPermission } = useAuthPermissions();
  
  // Verificar se o usuário tem permissão para criar
  const canCreate = hasPermission(
    PermissionModule.FINANCEIRO, 
    PermissionAction.CRIAR
  );
  
  if (!canCreate) {
    return null; // Não renderiza o botão
  }
  
  return (
    <button onClick={handleCreate}>
      Criar Registro Financeiro
    </button>
  );
};
```

#### 1.4 Proteção de API Routes

Para APIs que precisam verificar permissões:

```typescript
// src/app/api/financeiro/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PermissionsService } from '@/services/permissions.service';

export async function GET(request: NextRequest) {
  try {
    // Obter usuário da sessão
    const user = await getCurrentUser(request);
    
    // Verificar permissão
    const hasPermission = await PermissionsService.checkUserPermission(
      user.id,
      'FINANCEIRO',
      'VER'
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Lógica da API...
    return NextResponse.json({ data: [] });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
```

### 2. Adaptação do Sidebar

#### 2.1 Adicionar Item ao Navigation

Edite `src/hooks/use-navigation-items.ts`:

```typescript
export const useNavigationItems = ({ currentPath, hasAdminAccess }: UseNavigationItemsProps) => {
  const t = useTranslations();

  const navigationItems: NavigationSection[] = [
    {
      section: t('navigation.explore'),
      items: [
        {
          icon: Home,
          label: t('navigation.home'),
          path: '/',
          active: currentPath === '/'
        },
        {
          icon: Link,
          label: t('navigation.analytics'),
          path: '/zion-links',
          active: currentPath === '/zion-links'
        },
        // ✅ Novo item do módulo financeiro
        {
          icon: DollarSign, // Importe de lucide-react
          label: t('navigation.financeiro'),
          path: '/financeiro',
          active: currentPath?.startsWith('/financeiro') || false,
          permission: {
            module: PermissionModule.FINANCEIRO,
            action: PermissionAction.VER
          }
        }
      ]
    },
    // ... resto da configuração
  ];

  return { navigationItems };
};
```

#### 2.2 Filtro de Permissões no Sidebar

O hook `usePermissionFilter` já filtra automaticamente os itens baseado nas permissões:

```typescript
// src/hooks/use-permission-filter.ts
export const usePermissionFilter = () => {
  const { hasPermission } = useAuthPermissions();

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter(item => {
      // Se o item tem permissão definida, verificar
      if (item.permission) {
        return hasPermission(item.permission.module, item.permission.action);
      }
      // Se não tem permissão definida, mostrar sempre
      return true;
    });
  };

  // ... resto da implementação
};
```

#### 2.3 Adicionar Traduções

Adicione as traduções nos arquivos de idioma:

```json
// src/i18n/messages/pt.json
{
  "navigation": {
    "financeiro": "Financeiro",
    // ... outras traduções
  }
}

// src/i18n/messages/en.json
{
  "navigation": {
    "financeiro": "Financial",
    // ... outras traduções
  }
}
```

### 3. Integração com Sistema Existente

#### 3.1 Serviços de Permissão

O `PermissionsService` já possui métodos para trabalhar com módulos:

```typescript
// Buscar módulos
const modules = await PermissionsService.getModules();

// Criar novo módulo
const newModule = await PermissionsService.createModule({
  name: 'FINANCEIRO',
  description: 'Módulo de gestão financeira'
});

// Buscar permissões de um módulo
const permissions = await PermissionsService.getPermissionsByModule(moduleId);
```

#### 3.2 Context de Permissões

O `AuthPermissionsProvider` já gerencia automaticamente as permissões:

```typescript
// Usar no componente
const { 
  hasPermission, 
  hasModuleAccess, 
  getUserCampusIds 
} = useAuthPermissions();

// Verificar acesso ao módulo
const hasFinanceAccess = hasModuleAccess(PermissionModule.FINANCEIRO);

// Verificar permissão específica
const canCreateFinance = hasPermission(
  PermissionModule.FINANCEIRO, 
  PermissionAction.CRIAR
);
```

---

## 📋 Boas Práticas

### 1. Padrões de Nomenclatura

#### 1.1 Módulos
```typescript
// ✅ Correto
'USUARIOS'
'FINANCEIRO'
'RELATORIOS'
'RECURSOS_HUMANOS'

// ❌ Incorreto
'usuarios'
'Financeiro'
'relatórios'
'recursos-humanos'
```

#### 1.2 Permissões
```typescript
// Padrão: {MODULO}_{ACAO}
'FINANCEIRO_VER'
'FINANCEIRO_CRIAR'
'USUARIOS_EDITAR'
'RELATORIOS_REMOVER'
```

#### 1.3 Arquivos e Componentes
```typescript
// Páginas
'src/app/[locale]/(authenticated)/financeiro/page.tsx'
'src/app/[locale]/(authenticated)/financeiro/relatorios/page.tsx'

// Componentes
'src/components/financeiro/FinanceiroCard.tsx'
'src/components/financeiro/RelatoriosList.tsx'

// Serviços
'src/services/financeiro.service.ts'

// Hooks
'src/hooks/use-financeiro.ts'
```

### 2. Documentação Interna do Código

#### 2.1 Comentários em Componentes

```typescript
/**
 * Componente principal do módulo financeiro
 * 
 * Funcionalidades:
 * - Exibir dashboard financeiro
 * - Filtrar por período
 * - Exportar relatórios
 * 
 * Permissões necessárias:
 * - FINANCEIRO_VER: Para visualizar o dashboard
 * - FINANCEIRO_CRIAR: Para criar novos registros (opcional)
 * 
 * @example
 * <FinanceiroDashboard />
 */
export const FinanceiroDashboard = () => {
  // Implementação...
};
```

#### 2.2 Documentação de Permissões

```typescript
/**
 * Configuração de permissões do módulo financeiro
 */
export const FINANCEIRO_PERMISSIONS = {
  // Visualizar dados financeiros básicos
  VER: {
    module: PermissionModule.FINANCEIRO,
    action: PermissionAction.VER,
    description: 'Permite visualizar relatórios e dados financeiros'
  },
  
  // Criar novos registros financeiros
  CRIAR: {
    module: PermissionModule.FINANCEIRO,
    action: PermissionAction.CRIAR,
    description: 'Permite criar novos lançamentos e registros financeiros'
  },
  
  // Editar registros existentes
  EDITAR: {
    module: PermissionModule.FINANCEIRO,
    action: PermissionAction.EDITAR,
    description: 'Permite editar lançamentos e registros existentes'
  }
} as const;
```

#### 2.3 JSDoc para Funções

```typescript
/**
 * Verifica se o usuário tem acesso completo ao módulo financeiro
 * 
 * @param userId - ID do usuário a ser verificado
 * @param campusId - ID do campus (opcional)
 * @returns Promise<boolean> - true se tem acesso completo
 * 
 * @example
 * ```typescript
 * const hasAccess = await checkFinanceiroAccess('user-123', 'campus-456');
 * if (hasAccess) {
 *   // Permitir acesso
 * }
 * ```
 */
export async function checkFinanceiroAccess(
  userId: string, 
  campusId?: string
): Promise<boolean> {
  // Implementação...
}
```

### 3. Testes de Permissões

#### 3.1 Testes Unitários

```typescript
// src/__tests__/permissions/financeiro.test.ts
import { render, screen } from '@testing-library/react';
import { FinanceiroPage } from '@/app/[locale]/(authenticated)/financeiro/page';
import { mockAuthPermissions } from '@/test-utils/mocks';

describe('Financeiro Module Permissions', () => {
  it('should render page when user has VER permission', () => {
    mockAuthPermissions({
      hasPermission: jest.fn().mockReturnValue(true)
    });
    
    render(<FinanceiroPage />);
    
    expect(screen.getByText('Módulo Financeiro')).toBeInTheDocument();
  });
  
  it('should show access denied when user lacks VER permission', () => {
    mockAuthPermissions({
      hasPermission: jest.fn().mockReturnValue(false)
    });
    
    render(<FinanceiroPage />);
    
    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
  });
});
```

#### 3.2 Testes de Integração

```typescript
// src/__tests__/integration/financeiro-flow.test.ts
describe('Financeiro Module Integration', () => {
  it('should complete full CRUD flow with proper permissions', async () => {
    // 1. Login com usuário que tem todas as permissões
    await loginAsAdmin();
    
    // 2. Navegar para módulo financeiro
    await navigateTo('/financeiro');
    
    // 3. Verificar se página carregou
    expect(screen.getByText('Dashboard Financeiro')).toBeVisible();
    
    // 4. Criar novo registro
    await clickButton('Novo Lançamento');
    await fillForm({ valor: 1000, descricao: 'Teste' });
    await clickButton('Salvar');
    
    // 5. Verificar se foi criado
    expect(screen.getByText('Lançamento criado com sucesso')).toBeVisible();
    
    // 6. Editar registro
    await clickButton('Editar');
    await updateForm({ valor: 1500 });
    await clickButton('Salvar');
    
    // 7. Verificar se foi editado
    expect(screen.getByText('1500')).toBeVisible();
  });
});
```

#### 3.3 Checklist de Testes Manuais

```markdown
## ✅ Checklist de Testes - Módulo Financeiro

### Autenticação e Autorização
- [ ] Usuário sem permissão não consegue acessar `/financeiro`
- [ ] Usuário com `FINANCEIRO_VER` consegue visualizar a página
- [ ] Usuário sem `FINANCEIRO_CRIAR` não vê botão "Novo"
- [ ] Usuário sem `FINANCEIRO_EDITAR` não vê botão "Editar"
- [ ] Usuário sem `FINANCEIRO_REMOVER` não vê botão "Excluir"

### Navegação
- [ ] Item "Financeiro" aparece no sidebar para usuários autorizados
- [ ] Item "Financeiro" NÃO aparece para usuários não autorizados
- [ ] Navegação entre subpáginas funciona corretamente
- [ ] Breadcrumb mostra caminho correto

### Funcionalidades
- [ ] Dashboard carrega dados corretamente
- [ ] Filtros funcionam adequadamente
- [ ] CRUD completo funciona conforme permissões
- [ ] Exportação de relatórios (se aplicável)
- [ ] Validações de formulário funcionam
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Módulo de Recursos Humanos

#### 1. Definição
```typescript
// Nome técnico: RECURSOS_HUMANOS
// Nome de exibição: Recursos Humanos
// Descrição: Gestão de funcionários e departamentos
```

#### 2. Migration
```sql
-- supabase/migrations/20241221_add_recursos_humanos_module.sql
INSERT INTO public.modules (name, display_name, description) VALUES
('RECURSOS_HUMANOS', 'Recursos Humanos', 'Gestão de funcionários e departamentos')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (module_id, action_id, name, description)
SELECT 
    m.id as module_id,
    a.id as action_id,
    CONCAT(m.name, '_', a.name) as name,
    CONCAT(a.display_name, ' ', m.display_name) as description
FROM public.modules m
CROSS JOIN public.actions a
WHERE m.name = 'RECURSOS_HUMANOS'
  AND m.is_active = true
ON CONFLICT (module_id, action_id) DO NOTHING;
```

#### 3. Enum TypeScript
```typescript
export enum PermissionModule {
  // ... módulos existentes
  RECURSOS_HUMANOS = 'RECURSOS_HUMANOS'
}
```

#### 4. Página Principal
```typescript
// src/app/[locale]/(authenticated)/recursos-humanos/page.tsx
'use client';

import { RouteGuard } from '@/components/auth/RouteGuard';
import { PermissionModule, PermissionAction } from '@/types/permissions';
import { Users, UserPlus, Building } from 'lucide-react';

export default function RecursosHumanosPage() {
  return (
    <RouteGuard 
      module={PermissionModule.RECURSOS_HUMANOS} 
      action={PermissionAction.VER}
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Recursos Humanos</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FuncionariosCard />
          <DepartamentosCard />
          <RelatoriosCard />
        </div>
      </div>
    </RouteGuard>
  );
}
```

#### 5. Componente com Permissões
```typescript
// src/components/recursos-humanos/FuncionariosCard.tsx
import { useAuthPermissions } from '@/contexts/permission-context';
import { PermissionModule, PermissionAction } from '@/types/permissions';

export const FuncionariosCard = () => {
  const { hasPermission } = useAuthPermissions();
  
  const canCreate = hasPermission(
    PermissionModule.RECURSOS_HUMANOS, 
    PermissionAction.CRIAR
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Funcionários</h3>
      
      <div className="space-y-4">
        <p className="text-gray-600">Gerencie os funcionários da empresa</p>
        
        {canCreate && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Novo Funcionário
          </button>
        )}
        
        <div className="text-sm text-gray-500">
          Total: 150 funcionários
        </div>
      </div>
    </div>
  );
};
```

#### 6. Navigation Item
```typescript
// Adicionar em use-navigation-items.ts
{
  icon: Users,
  label: t('navigation.recursosHumanos'),
  path: '/recursos-humanos',
  active: currentPath?.startsWith('/recursos-humanos') || false,
  permission: {
    module: PermissionModule.RECURSOS_HUMANOS,
    action: PermissionAction.VER
  }
}
```

### Exemplo 2: Módulo de Vendas com Subpermissões

#### 1. Estrutura Avançada
```typescript
// Permissões específicas por tipo de venda
export const VENDAS_PERMISSIONS = {
  // Vendas básicas
  VER_VENDAS: 'VENDAS_VER',
  CRIAR_VENDAS: 'VENDAS_CRIAR',
  
  // Vendas de alto valor (podem precisar de permissão especial)
  APROVAR_VENDAS_ALTO_VALOR: 'VENDAS_APROVAR_ALTO_VALOR',
  
  // Relatórios de vendas
  VER_RELATORIOS_VENDAS: 'VENDAS_VER_RELATORIOS',
  
  // Comissões
  CALCULAR_COMISSOES: 'VENDAS_CALCULAR_COMISSOES'
} as const;
```

#### 2. Verificação Condicional
```typescript
export const VendasDashboard = () => {
  const { hasPermission, getUserCampusIds } = useAuthPermissions();
  
  // Verificar permissões básicas
  const canViewSales = hasPermission(
    PermissionModule.VENDAS, 
    PermissionAction.VER
  );
  
  // Verificar campus específicos
  const userCampusIds = getUserCampusIds(PermissionModule.VENDAS);
  const hasAllCampusAccess = userCampusIds.length === 0;
  
  // Lógica condicional baseada em permissões
  const showHighValueSales = hasPermission(
    PermissionModule.VENDAS, 
    'APROVAR_ALTO_VALOR' as PermissionAction
  );
  
  if (!canViewSales) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <h1>Dashboard de Vendas</h1>
      
      {hasAllCampusAccess ? (
        <AllCampusSalesView />
      ) : (
        <SpecificCampusSalesView campusIds={userCampusIds} />
      )}
      
      {showHighValueSales && (
        <HighValueSalesSection />
      )}
    </div>
  );
};
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Módulo não aparece no sidebar
```typescript
// ✅ Verificações:
// 1. Enum foi atualizado?
export enum PermissionModule {
  NOVO_MODULO = 'NOVO_MODULO' // ← Adicionado?
}

// 2. Item foi adicionado ao navigation?
{
  icon: Icon,
  label: 'Novo Módulo',
  path: '/novo-modulo',
  permission: {
    module: PermissionModule.NOVO_MODULO, // ← Correto?
    action: PermissionAction.VER
  }
}

// 3. Usuário tem a permissão?
const hasPermission = hasPermission(
  PermissionModule.NOVO_MODULO, 
  PermissionAction.VER
);
console.log('Has permission:', hasPermission);
```

#### 2. Erro "Permission not found"
```sql
-- Verificar se as permissões foram criadas
SELECT 
  m.name as module_name,
  a.name as action_name,
  p.name as permission_name
FROM permissions p
JOIN modules m ON p.module_id = m.id
JOIN actions a ON p.action_id = a.id
WHERE m.name = 'SEU_MODULO';

-- Se não existir, executar a migration novamente
```

#### 3. Usuário não consegue acessar página
```typescript
// Debug de permissões
const DebugPermissions = () => {
  const { permissions, user } = useAuthPermissions();
  
  console.log('User:', user);
  console.log('Permissions:', permissions);
  
  return (
    <div>
      <h3>Debug de Permissões</h3>
      <pre>{JSON.stringify(permissions, null, 2)}</pre>
    </div>
  );
};
```

#### 4. Migration falhou
```bash
# Verificar status das migrations
supabase migration list

# Reverter migration se necessário
supabase migration repair --status reverted

# Executar novamente
supabase db push
```

### Logs Úteis

#### 1. Verificar permissões no console
```typescript
// Adicionar em qualquer componente para debug
useEffect(() => {
  console.log('=== DEBUG PERMISSIONS ===');
  console.log('User:', user);
  console.log('Has MODULO_VER:', hasPermission(PermissionModule.MODULO, PermissionAction.VER));
  console.log('User Campus IDs:', getUserCampusIds());
  console.log('========================');
}, [user, hasPermission, getUserCampusIds]);
```

#### 2. Verificar dados no Supabase
```sql
-- Verificar usuário e suas permissões
SELECT 
  u.full_name,
  u.status,
  p.name as permission_name,
  up.is_active,
  up.campus_ids
FROM authorized_users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE u.username = 'SEU_USERNAME';
```

---

## 📚 Recursos Adicionais

### Arquivos de Referência

- **Tipos**: `src/types/permissions.ts`
- **Contexto**: `src/contexts/permission-context.tsx`
- **Serviços**: `src/services/permissions.service.ts`
- **Guards**: `src/components/auth/RouteGuard.tsx`
- **Navigation**: `src/hooks/use-navigation-items.ts`
- **Migrations**: `supabase/migrations/`

### Comandos Úteis

```bash
# Executar migrations
supabase db push

# Verificar status
supabase migration list

# Gerar tipos TypeScript
supabase gen types typescript --local > src/types/supabase.ts

# Executar testes
npm run test

# Executar servidor de desenvolvimento
npm run dev
```

### Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Guia de Testes](./TESTING_GUIDE.md)
- [Guia do Administrador](./ADMIN_SEED_GUIDE.md)

---

**📝 Nota**: Este documento deve ser atualizado sempre que novos padrões ou funcionalidades forem implementados no sistema de permissões.