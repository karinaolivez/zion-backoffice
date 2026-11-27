# Módulo de Solicitação de Projetos

Fluxo para líderes pedirem projetos/automações ao time de tecnologia.

```
Líder (formulário)  ──►  Moderação (líder de tecnologia + head)  ──►  Kanban do time de tecnologia
  /projetos/solicitar        /projetos/moderacao                       /tech-board
```

## 1. Solicitar projeto — `/[locale]/projetos/solicitar`

- Só aparece no menu para quem tem `SOLICITACAO_PROJETOS_CRIAR`.
- Nome e e-mail vêm do cadastro (somente leitura). O WhatsApp é pré-preenchido quando o perfil tem telefone e pode ser corrigido.
- Campos: área (lista de `church_areas`), título, descrição (com orientações: problema atual, o que resolver, quantas pessoas são impactadas, como é feito hoje) e WhatsApp.
- A API grava o nome do solicitante a partir do usuário logado, não do corpo da requisição.

## 2. Moderação — `/[locale]/projetos/moderacao`

- Só para quem tem `SOLICITACAO_PROJETOS_LISTAR` (o líder de tecnologia e o head dele).
- Lista agrupada por área, cada área abre e fecha. Cada item mostra título, data e quem pediu.
- Ao abrir uma solicitação (`SOLICITACAO_PROJETOS_VER`), ela passa de **Nova** para **Em análise** e registra quem viu e quando.
- Com `SOLICITACAO_PROJETOS_EDITAR`: **Aprovar e enviar ao Kanban** (cria o card no Backlog) ou **Recusar**, com anotações.
- Atalho para o WhatsApp e e-mail do líder, para levar o assunto ao líder da área.

## 3. Kanban do time de tecnologia — `/[locale]/tech-board`

- Fica fora do layout do backoffice: sem sidebar e sem login Zion.
- Acesso por **senha compartilhada do time** (`TECH_BOARD_PASSWORD`). A sessão é um cookie httpOnly de 30 dias. Trocar a senha desloga todo mundo.
- Colunas: Backlog, A fazer, Em andamento, Em revisão, Concluído. Arrastar e soltar, ou trocar a coluna dentro do card.
- Responsável é texto livre. "Pegar pra mim" usa o nome salvo no navegador.
- O time também pode criar cards manuais.
- **Prazo** por card. O selo fica vermelho "Em atraso" quando o prazo passou e o card não está em Concluído (amarelo para "Vence hoje" e prazos próximos). Botão "Em atraso (N)" no topo filtra só os atrasados.
- Botões rápidos no card: **Iniciar (Em andamento)** e **Marcar como concluído**. As datas de início e conclusão ficam gravadas.
- **Histórico e comentários**: toda mudança de coluna, responsável e prazo fica registrada com data/hora e quem fez; o time comenta no próprio card.
- Mesmo banco do backoffice, então o que é aprovado na moderação aparece direto no Backlog. Se quiserem um endereço próprio (ex.: `kanban.zion...`), basta apontar o subdomínio para `/pt/tech-board`.

## Banco de dados

Migrations: `supabase/migrations/20261127000001_create_project_requests_module.sql` e `20261127000002_tech_board_history_and_due_dates.sql`

| Tabela | Para quê |
| --- | --- |
| `church_areas` | Áreas/ministérios da igreja (lista inicial no seed; edite inserindo ou desativando linhas) |
| `project_requests` | Solicitações, status (`NOVA`, `EM_ANALISE`, `APROVADA`, `RECUSADA`), quem viu e quem decidiu |
| `tech_board_cards` | Cards do Kanban, com vínculo opcional à solicitação, prazo (`due_date`), `started_at` e `completed_at` |
| `tech_board_card_events` | Histórico (criação, movimentações, responsável, prazo, edição) e comentários de cada card |

As tabelas têm RLS sem políticas para `anon`/`authenticated`: só as API Routes (service role) leem e escrevem.

## Permissões

A migration cria o módulo `SOLICITACAO_PROJETOS` com as 5 ações padrão. Atribua em **Administração → Usuários**:

| Quem | Permissões |
| --- | --- |
| Líderes de área, heads, pastores | `SOLICITACAO_PROJETOS_CRIAR` |
| Líder de tecnologia e o head dele | `SOLICITACAO_PROJETOS_LISTAR`, `_VER`, `_EDITAR` |

## Variáveis de ambiente

```env
# Senha compartilhada do time de tecnologia para o Kanban
TECH_BOARD_PASSWORD=troque-esta-senha
# Opcional: chave para assinar o cookie do Kanban (padrão: a própria senha)
TECH_BOARD_SESSION_SECRET=
# Opcional: service role só no servidor (se não existir, usa NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
SUPABASE_SERVICE_ROLE_KEY=
```

## API

| Rota | Permissão |
| --- | --- |
| `GET /api/church-areas` | `CRIAR` ou `LISTAR` |
| `POST /api/project-requests` | `CRIAR` |
| `GET /api/project-requests?status=OPEN\|NOVA\|...` | `LISTAR` |
| `GET /api/project-requests/:id` (marca "em análise") | `VER` |
| `PATCH /api/project-requests/:id` | `EDITAR` |
| `GET/POST/DELETE /api/tech-board/session` | senha do time |
| `GET/POST /api/tech-board/cards`, `PATCH/DELETE /api/tech-board/cards/:id` | cookie do Kanban |
| `GET/POST /api/tech-board/cards/:id/events` (histórico / comentar) | cookie do Kanban |

As rotas do módulo validam o token da sessão Supabase (`Authorization: Bearer`) e a permissão no servidor.
