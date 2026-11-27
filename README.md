# 🚀 Zion Backoffice Boilerplate

Um boilerplate moderno e completo para criação de plataformas de backoffice da **Zion Global**, construído com Next.js 15, TypeScript e as melhores práticas de desenvolvimento.

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização
- Sistema completo de login com validação
- Contexto de autenticação global
- Proteção de rotas automática
- Gerenciamento de tokens JWT
- Suporte a múltiplas nacionalidades

### 🌍 Internacionalização (i18n)
- Suporte completo a múltiplos idiomas
- Português (pt), Inglês (en) e Espanhol (es)
- Roteamento baseado em locale
- Seletor de idioma integrado
- Mensagens traduzidas para toda a aplicação

### 🎨 Interface Moderna
- Design system baseado em Figma
- Componentes reutilizáveis com Radix UI
- Tema escuro/claro automático
- Responsivo e acessível
- Animações suaves com Tailwind CSS

### 📊 Visualização de Dados
- Gráficos interativos com Nivo
- Componentes de tabela avançados
- Cards informativos com estatísticas
- Sistema de abas customizável

### 🛠️ Arquitetura Robusta
- TypeScript para type safety
- Validação com Zod
- Gerenciamento de estado eficiente
- API routes integradas
- Middleware personalizado

## 🏗️ Tecnologias Utilizadas

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização utilitária
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones modernos
- **Next Themes** - Gerenciamento de temas

### Internacionalização
- **next-intl** - Internacionalização para Next.js
- **flag-icons** - Bandeiras dos países

### Visualização de Dados
- **@nivo/bar** - Gráficos de barras interativos
- **@nivo/core** - Core do Nivo para visualizações

### Formulários e Validação
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **@hookform/resolvers** - Integração Zod + RHF

### Estado e Requisições
- **Axios** - Cliente HTTP
- **js-cookie** - Gerenciamento de cookies
- **Sonner** - Notificações toast

### Desenvolvimento
- **ESLint** - Linting de código
- **PostCSS** - Processamento CSS
- **Turbopack** - Bundler rápido

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### 1. Clone o repositório
```bash
git clone https://github.com/zion-developers/zion-backoffice-boilerplate.git
cd zion-backoffice-boilerplate
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:
```env
NEXT_PUBLIC_NEXT_PUBLIC_API_BASE_URL=https://api.exemplo.com
NEXT_PUBLIC_APP_NAME=Zion Backoffice
```

### 4. Execute o projeto
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── [locale]/          # Rotas internacionalizadas
│   │   ├── login/         # Página de login
│   │   ├── profile/       # Perfil do usuário
│   │   └── zion-links/    # Dashboard principal
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globais
├── components/            # Componentes reutilizáveis
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes de interface
├── contexts/             # Contextos React
├── hooks/                # Custom hooks
├── i18n/                 # Configuração de internacionalização
├── lib/                  # Utilitários e configurações
├── services/             # Serviços de API
└── types/                # Definições de tipos TypeScript
```

## 🎯 Páginas Principais

### 🔐 Login (`/[locale]/login`)
- Formulário de autenticação
- Validação de documentos por nacionalidade
- Seletor de país integrado
- Redirecionamento automático

### 👤 Perfil (`/[locale]/profile`)
- Informações do usuário
- Configurações da conta
- Histórico de atividades

### 📊 Dashboard (`/[locale]/zion-links`)
- Visão geral com estatísticas
- Gráficos interativos
- Sistema de abas (Visão Geral, Gráficos, Configurações)
- Cards informativos

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção

# Linting
npm run lint         # Executa ESLint
```

## 🌐 Suporte a Idiomas

O projeto suporta três idiomas:

- **Português (pt)** - Idioma padrão
- **Inglês (en)** - English
- **Espanhol (es)** - Español

### Adicionando novos idiomas

1. Crie um novo arquivo em `messages/[locale].json`
2. Adicione o locale em `src/i18n/routing.ts`
3. Configure as rotas no middleware

## 🎨 Customização

### Temas
O projeto suporta tema claro e escuro automaticamente. Para customizar:

1. Edite `tailwind.config.ts` para cores personalizadas
2. Modifique `src/app/globals.css` para variáveis CSS
3. Use `next-themes` para controle programático

### Componentes
Todos os componentes seguem o padrão:

- **Radix UI** para funcionalidade
- **Tailwind CSS** para estilização
- **TypeScript** para tipagem
- **Variantes** com class-variance-authority

## 🔒 Segurança

- Validação de entrada com Zod
- Sanitização de dados
- Proteção CSRF
- Headers de segurança
- Autenticação JWT

## 📈 Performance

- **Turbopack** para builds rápidos
- **Next.js 15** com otimizações automáticas
- **Lazy loading** de componentes
- **Code splitting** automático
- **Otimização de imagens**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da **Zion Global** e está licenciado sob os termos internos da empresa.

## 🆘 Suporte

Para suporte técnico ou dúvidas sobre o boilerplate:

- **Email**: dev-team@zionglobal.com
- **Slack**: #zion-backoffice-support
- **Documentação**: [docs.zionglobal.com](https://docs.zionglobal.com)

---

**Desenvolvido com ❤️ pela equipe Zion Global**
