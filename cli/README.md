# 🚀 Zion CLI - Gerador de Features

CLI para automação da criação de novas páginas e features no projeto Zion.

## 📦 Instalação

```bash
cd cli
npm install
```

## 🎯 Uso

### Criar uma nova feature completa

```bash
node index.js create-feature <nome-da-feature>
```

### Exemplos

```bash
# Criar feature de produtos
node index.js create-feature produtos

# Criar feature de vendas
node index.js create-feature vendas

# Criar feature de relatórios
node index.js create-feature relatorios
```

## 📁 O que é criado

Para cada feature, o CLI cria automaticamente:

- ✅ **Página**: `/src/app/[locale]/(authenticated)/[nome-da-feature]/page.tsx`
- ✅ **Service**: `/src/services/[nome-da-feature]/`
- ✅ **API Route**: `/src/app/api/[nome-da-feature]/route.ts`
- ✅ **Tipos TypeScript**: Definições em `src/types/permissions.ts`
- ✅ **Integração com Sidebar**: Adição automática ao menu
- ✅ **Traduções**: Templates em todos os idiomas

## 🔧 Funcionalidades

- 🎨 **Templates padronizados** seguindo a arquitetura do projeto
- 🔒 **Sistema de permissões** integrado automaticamente
- 🌐 **Internacionalização** com templates de tradução
- ✅ **Validações** de nomes e estruturas
- 📊 **Feedback visual** durante a execução
- 🔄 **Reutilização** de componentes existentes

## 📋 Validações

O CLI valida automaticamente:

- ✅ Nomes válidos (kebab-case)
- ✅ Conflitos com features existentes
- ✅ Estrutura de diretórios
- ✅ Sintaxe dos templates gerados

## 🎯 Próximos Passos

Após executar o CLI:

1. **Instalar dependências** (se necessário)
2. **Executar migrations** no banco de dados
3. **Configurar permissões** no sistema
4. **Testar a nova feature** no navegador

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento com watch
npm run dev

# Executar diretamente
npm start
```