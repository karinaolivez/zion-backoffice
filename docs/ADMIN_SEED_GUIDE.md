# 🔐 Guia de Seed do Usuário Administrador

Este guia explica como executar o seed para criar um usuário administrador com acesso total ao sistema.

## 📋 Dados do Usuário Administrador

O script criará um usuário com os seguintes dados:

```
External ID: 1e458d25-45fc-48cc-8812-cc6af4b27082
Username: br:50846306093
Nome Completo: Jesus Cristo
Tipo de Documento: br (Brasil)
Documento: 508.463.060-93 (CPF)
Status: APPROVED
Ativo: true
```

## 🚀 Como Executar o Seed

### Opção 1: Usando Supabase CLI (Recomendado)

1. **Certifique-se de que o Supabase está rodando:**
   ```bash
   supabase start
   ```

2. **Execute a migração:**
   ```bash
   supabase db push
   ```
   
   Ou se preferir resetar o banco completamente:
   ```bash
   supabase db reset
   ```

### Opção 2: Usando o Script Node.js

1. **Configure as variáveis de ambiente:**
   ```bash
   # Para desenvolvimento local
   export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   export NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_anonima_aqui"
   
   # Ou use a service role key para mais privilégios
   export NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
   ```

2. **Execute o script:**
   ```bash
   node run-admin-seed.js
   ```

### Opção 3: Execução Manual no Banco

1. **Conecte-se ao banco de dados Supabase**
2. **Execute o arquivo SQL:**
   ```sql
   -- Copie e cole o conteúdo do arquivo:
   -- supabase/migrations/20241220000003_seed_admin_user.sql
   ```

## ✅ Validações Implementadas

O script inclui as seguintes validações:

### 📝 Validação de Dados
- ✅ **External ID**: Deve ser um UUID válido
- ✅ **Username**: Não pode estar vazio
- ✅ **Nome Completo**: Não pode estar vazio
- ✅ **CPF**: Validação completa do algoritmo de CPF brasileiro
- ✅ **Status**: Deve ser um dos valores válidos (PENDING, APPROVED, REJECTED, INACTIVE)

### 🔍 Verificações de Sistema
- ✅ **Usuário Existente**: Verifica se já existe antes de criar
- ✅ **Módulos**: Confirma que existem módulos ativos no sistema
- ✅ **Ações**: Confirma que existem ações cadastradas
- ✅ **Permissões**: Confirma que existem permissões ativas

### 🔄 Comportamento Inteligente
- **Se o usuário já existir**: Atualiza os dados para garantir consistência
- **Se for novo usuário**: Cria com todos os dados fornecidos
- **Permissões**: Remove permissões antigas e atribui todas as permissões ativas
- **Campus**: Acesso a todos os campus (array vazio = acesso total)

## 🔐 Permissões Atribuídas

O usuário administrador receberá **TODAS** as permissões ativas do sistema, incluindo:

### 👥 Módulo de Usuários
- ✅ Visualizar usuários
- ✅ Criar novos usuários
- ✅ Editar usuários existentes
- ✅ Remover usuários
- ✅ Listar usuários

### 🔒 Módulo de Permissões
- ✅ Visualizar permissões
- ✅ Criar novas permissões
- ✅ Editar permissões existentes
- ✅ Remover permissões
- ✅ Listar permissões

### 💰 Módulo Financeiro
- ✅ Acesso completo ao módulo financeiro
- ✅ Visualizar relatórios financeiros
- ✅ Gerenciar dados financeiros

### 🔗 Módulo de Links
- ✅ Gerenciar links do sistema
- ✅ Criar e editar recursos

### 📢 Módulo de Notificações
- ✅ Gerenciar sistema de notificações
- ✅ Enviar e configurar notificações

### 🏫 Módulo de Campus
- ✅ Gerenciar campus
- ✅ Acesso a todos os campus

### 📊 Módulo de Relatórios
- ✅ Gerar relatórios
- ✅ Visualizar todos os relatórios do sistema

## 📊 Saída do Script

Quando executado com sucesso, o script exibirá:

```
🎉 SEED CONCLUÍDO COM SUCESSO!
================================
Usuário ID: [uuid-gerado]
External ID: 1e458d25-45fc-48cc-8812-cc6af4b27082
Username: br:50846306093
Nome: Jesus Cristo
Documento: br - 508.463.060-93
Status: APPROVED
Ativo: true

🔐 PERMISSÕES ADMINISTRATIVAS:
• Acesso total a todos os módulos do sistema
• Gerenciamento completo de usuários
• Configuração de permissionamentos
• Acesso a todos os campus

✅ Usuário administrador configurado com sucesso!
```

## 🚨 Solução de Problemas

### Erro: "Nenhum módulo ativo encontrado"
**Solução**: Execute primeiro as migrações de dados iniciais:
```bash
supabase db push
```

### Erro: "CPF inválido"
**Solução**: O CPF fornecido (508.463.060-93) é válido. Verifique se não há caracteres extras.

### Erro: "Usuário já existe"
**Comportamento Normal**: O script atualizará os dados do usuário existente automaticamente.

### Erro: "Variável de ambiente não encontrada"
**Solução**: Configure as variáveis de ambiente do Supabase:
```bash
export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_aqui"
```

## 🔒 Segurança

- ✅ **Validação de CPF**: Implementa algoritmo completo de validação
- ✅ **Sanitização**: Todos os dados são validados antes da inserção
- ✅ **Transações**: Operações são executadas em transação para garantir consistência
- ✅ **Logs Detalhados**: Todas as operações são logadas para auditoria

## 📁 Arquivos Relacionados

- `supabase/migrations/20241220000003_seed_admin_user.sql` - Script SQL principal
- `run-admin-seed.js` - Script Node.js para execução automatizada
- `ADMIN_SEED_GUIDE.md` - Este guia de instruções

## 🎯 Próximos Passos

Após executar o seed com sucesso:

1. **Teste o Login**: Use as credenciais do usuário administrador
2. **Verifique Permissões**: Acesse todas as áreas do sistema
3. **Configure Outros Usuários**: Use o painel admin para gerenciar outros usuários
4. **Backup**: Faça backup do banco após configurar o ambiente

---

**⚠️ Importante**: Este usuário terá acesso total ao sistema. Use apenas em ambiente de desenvolvimento ou com extrema cautela em produção.