-- Migration: Create Auth Roles and Permissions System
-- Description: Creates tables for user authorization and permissions system in public schema

-- Tabela de usuários autorizados
CREATE TABLE IF NOT EXISTS public.authorized_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar TEXT,
    document_type VARCHAR(50),
    document_value VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES public.authorized_users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de módulos do sistema
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ações possíveis
CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de permissões (combinação módulo + ação)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module_id, action_id)
);

-- Tabela de permissões de usuários
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.authorized_users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    campus_ids UUID[] DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.authorized_users(id),
    UNIQUE(user_id, permission_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_authorized_users_external_id ON public.authorized_users(external_id);
CREATE INDEX IF NOT EXISTS idx_authorized_users_username ON public.authorized_users(username);
CREATE INDEX IF NOT EXISTS idx_authorized_users_status ON public.authorized_users(status);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON public.user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON public.user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_module_id ON public.permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_action_id ON public.permissions(action_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para todas as tabelas com updated_at
DROP TRIGGER IF EXISTS update_authorized_users_updated_at ON public.authorized_users;
CREATE TRIGGER update_authorized_users_updated_at 
    BEFORE UPDATE ON public.authorized_users 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at 
    BEFORE UPDATE ON public.modules 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON public.permissions;
CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON public.permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON public.user_permissions;
CREATE TRIGGER update_user_permissions_updated_at 
    BEFORE UPDATE ON public.user_permissions 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar conforme necessário)
-- Authorized Users
CREATE POLICY "Enable read access for authenticated users" ON public.authorized_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for service role" ON public.authorized_users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Enable update for service role" ON public.authorized_users
    FOR UPDATE USING (auth.role() = 'service_role');

-- Modules
CREATE POLICY "Enable read access for authenticated users" ON public.modules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON public.modules
    FOR ALL USING (auth.role() = 'service_role');

-- Actions
CREATE POLICY "Enable read access for authenticated users" ON public.actions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON public.actions
    FOR ALL USING (auth.role() = 'service_role');

-- Permissions
CREATE POLICY "Enable read access for authenticated users" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON public.permissions
    FOR ALL USING (auth.role() = 'service_role');

-- User Permissions
CREATE POLICY "Enable read access for authenticated users" ON public.user_permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for service role" ON public.user_permissions
    FOR ALL USING (auth.role() = 'service_role');