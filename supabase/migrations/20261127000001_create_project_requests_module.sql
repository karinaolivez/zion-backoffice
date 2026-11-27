-- Migration: Módulo de Solicitação de Projetos
-- Description:
--   1. church_areas        -> áreas/ministérios da igreja (Mídia, Louvor, Kids...)
--   2. project_requests    -> solicitações enviadas pelos líderes ao time de tecnologia
--   3. tech_board_cards    -> cards do Kanban do time de tecnologia
--   4. Módulo SOLICITACAO_PROJETOS + permissões (VER, CRIAR, EDITAR, REMOVER, LISTAR)
--
-- Todas as tabelas novas são acessadas SOMENTE pelas API Routes (service role).
-- O RLS fica habilitado e sem políticas para anon/authenticated, então o
-- navegador não consegue ler/escrever direto nessas tabelas.

-- ---------------------------------------------------------------------------
-- 1. Áreas da igreja
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.church_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_church_areas_updated_at ON public.church_areas;
CREATE TRIGGER update_church_areas_updated_at
    BEFORE UPDATE ON public.church_areas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.church_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.church_areas
    FOR ALL USING (auth.role() = 'service_role');

-- Lista inicial (ajuste livremente: basta inserir/desativar linhas)
INSERT INTO public.church_areas (name, slug) VALUES
('Mídia / Multimídia', 'midia-multimidia'),
('Louvor', 'louvor'),
('Kids', 'kids'),
('Jovens', 'jovens'),
('Recepção', 'recepcao'),
('Intercessão', 'intercessao'),
('Comunicação', 'comunicacao'),
('Células / Grupos', 'celulas-grupos'),
('Ação Social', 'acao-social'),
('Secretaria', 'secretaria'),
('Financeiro', 'financeiro'),
('Cozinha / Cantina', 'cozinha-cantina'),
('Pastoral', 'pastoral'),
('Tecnologia', 'tecnologia')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Solicitações de projetos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID NOT NULL REFERENCES public.church_areas(id),

    -- Quem pediu (copiado do cadastro no momento do envio)
    requester_user_id UUID REFERENCES public.authorized_users(id) ON DELETE SET NULL,
    requester_external_id VARCHAR(255) NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255),
    requester_whatsapp VARCHAR(30) NOT NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'NOVA'
        CHECK (status IN ('NOVA', 'EM_ANALISE', 'APROVADA', 'RECUSADA')),

    -- Primeira visualização pela moderação (marca "em análise")
    viewed_at TIMESTAMP WITH TIME ZONE,
    viewed_by UUID REFERENCES public.authorized_users(id) ON DELETE SET NULL,
    viewed_by_name VARCHAR(255),

    -- Decisão da moderação
    moderator_notes TEXT,
    decided_at TIMESTAMP WITH TIME ZONE,
    decided_by UUID REFERENCES public.authorized_users(id) ON DELETE SET NULL,
    decided_by_name VARCHAR(255),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_requests_area_id ON public.project_requests(area_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_status ON public.project_requests(status);
CREATE INDEX IF NOT EXISTS idx_project_requests_requester ON public.project_requests(requester_external_id);
CREATE INDEX IF NOT EXISTS idx_project_requests_created_at ON public.project_requests(created_at DESC);

DROP TRIGGER IF EXISTS update_project_requests_updated_at ON public.project_requests;
CREATE TRIGGER update_project_requests_updated_at
    BEFORE UPDATE ON public.project_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.project_requests
    FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. Kanban do time de tecnologia
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tech_board_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID UNIQUE REFERENCES public.project_requests(id) ON DELETE SET NULL,

    title VARCHAR(150) NOT NULL,
    description TEXT,
    area_name VARCHAR(255),
    requester_name VARCHAR(255),
    requester_whatsapp VARCHAR(30),

    assignee VARCHAR(255),
    column_key VARCHAR(20) NOT NULL DEFAULT 'BACKLOG'
        CHECK (column_key IN ('BACKLOG', 'A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDO')),
    position DOUBLE PRECISION NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_board_cards_column ON public.tech_board_cards(column_key, position);

DROP TRIGGER IF EXISTS update_tech_board_cards_updated_at ON public.tech_board_cards;
CREATE TRIGGER update_tech_board_cards_updated_at
    BEFORE UPDATE ON public.tech_board_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tech_board_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON public.tech_board_cards
    FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. Módulo e permissões
--    CRIAR  -> líderes/heads/pastores (abrem solicitações)
--    LISTAR -> líder de tecnologia e o head dele (veem a moderação)
--    VER    -> líder de tecnologia e o head dele (abrem a solicitação)
--    EDITAR -> líder de tecnologia e o head dele (aprovam/recusam)
-- ---------------------------------------------------------------------------
INSERT INTO public.modules (name, display_name, description) VALUES
('SOLICITACAO_PROJETOS', 'Solicitação de Projetos', 'Solicitações de projetos/automação enviadas pelos líderes ao time de tecnologia')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.permissions (module_id, action_id, name, description)
SELECT
    m.id AS module_id,
    a.id AS action_id,
    CONCAT(m.name, '_', a.name) AS name,
    CONCAT(a.display_name, ' ', m.display_name) AS description
FROM public.modules m
CROSS JOIN public.actions a
WHERE m.name = 'SOLICITACAO_PROJETOS'
  AND m.is_active = true
ON CONFLICT (module_id, action_id) DO NOTHING;
