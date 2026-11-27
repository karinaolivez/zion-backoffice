-- Migration: Insert Initial Data for Auth System
-- Description: Inserts initial modules, actions, and permissions data

-- Inserir módulos iniciais
INSERT INTO public.modules (name, display_name, description) VALUES
('USUARIOS', 'Usuários', 'Gerenciamento de usuários do sistema'),
('PERMISSOES', 'Permissões', 'Gerenciamento de permissões e acessos'),
('FINANCEIRO', 'Financeiro', 'Módulo financeiro e relatórios'),
('LINKS', 'Links', 'Gerenciamento de links e recursos'),
('NOTIFICACOES', 'Notificações', 'Sistema de notificações'),
('CAMPUS', 'Campus', 'Gerenciamento de campus'),
('RELATORIOS', 'Relatórios', 'Geração e visualização de relatórios')
ON CONFLICT (name) DO NOTHING;

-- Inserir ações possíveis
INSERT INTO public.actions (name, display_name, description) VALUES
('VER', 'Visualizar', 'Permissão para visualizar dados'),
('CRIAR', 'Criar', 'Permissão para criar novos registros'),
('EDITAR', 'Editar', 'Permissão para editar registros existentes'),
('REMOVER', 'Remover', 'Permissão para remover registros'),
('LISTAR', 'Listar', 'Permissão para listar registros')
ON CONFLICT (name) DO NOTHING;

-- Criar permissões para cada módulo e ação
INSERT INTO public.permissions (module_id, action_id, name, description)
SELECT 
    m.id as module_id,
    a.id as action_id,
    CONCAT(m.name, '_', a.name) as name,
    CONCAT(a.display_name, ' ', m.display_name) as description
FROM public.modules m
CROSS JOIN public.actions a
WHERE m.is_active = true
ON CONFLICT (module_id, action_id) DO NOTHING;