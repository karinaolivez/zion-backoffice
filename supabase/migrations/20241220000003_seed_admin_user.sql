-- Migration: Seed Admin User
-- Description: Creates an admin user with full system permissions
-- Author: System
-- Date: 2024-12-20

-- Função para validar CPF brasileiro
CREATE OR REPLACE FUNCTION validate_cpf(cpf TEXT) RETURNS BOOLEAN AS $$
DECLARE
    clean_cpf TEXT;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    -- Remove pontos e hífens
    clean_cpf := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');
    
    -- Verifica se tem 11 dígitos
    IF LENGTH(clean_cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica se não são todos os dígitos iguais
    IF clean_cpf ~ '^(.)\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calcula primeiro dígito verificador
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (SUBSTRING(clean_cpf, i, 1)::INTEGER * (11 - i));
    END LOOP;
    
    digit1 := 11 - (sum1 % 11);
    IF digit1 >= 10 THEN
        digit1 := 0;
    END IF;
    
    -- Calcula segundo dígito verificador
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (SUBSTRING(clean_cpf, i, 1)::INTEGER * (12 - i));
    END LOOP;
    
    digit2 := 11 - (sum2 % 11);
    IF digit2 >= 10 THEN
        digit2 := 0;
    END IF;
    
    -- Verifica se os dígitos calculados conferem
    RETURN (SUBSTRING(clean_cpf, 10, 1)::INTEGER = digit1 AND 
            SUBSTRING(clean_cpf, 11, 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql;

-- Função principal para criar o usuário administrador
DO $$
DECLARE
    admin_user_id UUID;
    admin_external_id VARCHAR(255) := '1e458d25-45fc-48cc-8812-cc6af4b27082';
    admin_username VARCHAR(255) := 'br:50846306093';
    admin_full_name VARCHAR(255) := 'Jesus Cristo';
    admin_document_type VARCHAR(50) := 'br';
    admin_document_value VARCHAR(255) := '508.463.060-93';
    admin_is_active BOOLEAN := true;
    admin_status VARCHAR(20) := 'APPROVED';
    permission_record RECORD;
    user_exists BOOLEAN := false;
BEGIN
    -- Validações dos dados de entrada
    RAISE NOTICE 'Iniciando validações dos dados do usuário administrador...';
    
    -- Validar external_id (deve ser um UUID válido)
    BEGIN
        PERFORM admin_external_id::UUID;
        RAISE NOTICE '✓ External ID válido: %', admin_external_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'External ID inválido: %. Deve ser um UUID válido.', admin_external_id;
    END;
    
    -- Validar username (não pode estar vazio)
    IF admin_username IS NULL OR LENGTH(TRIM(admin_username)) = 0 THEN
        RAISE EXCEPTION 'Username não pode estar vazio';
    END IF;
    RAISE NOTICE '✓ Username válido: %', admin_username;
    
    -- Validar full_name (não pode estar vazio)
    IF admin_full_name IS NULL OR LENGTH(TRIM(admin_full_name)) = 0 THEN
        RAISE EXCEPTION 'Nome completo não pode estar vazio';
    END IF;
    RAISE NOTICE '✓ Nome completo válido: %', admin_full_name;
    
    -- Validar CPF brasileiro
    IF admin_document_type = 'br' THEN
        IF NOT validate_cpf(admin_document_value) THEN
            RAISE EXCEPTION 'CPF inválido: %', admin_document_value;
        END IF;
        RAISE NOTICE '✓ CPF válido: %', admin_document_value;
    END IF;
    
    -- Validar status
    IF admin_status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE') THEN
        RAISE EXCEPTION 'Status inválido: %. Deve ser PENDING, APPROVED, REJECTED ou INACTIVE', admin_status;
    END IF;
    RAISE NOTICE '✓ Status válido: %', admin_status;
    
    -- Verificar se o usuário já existe
    SELECT EXISTS(
        SELECT 1 FROM public.authorized_users 
        WHERE external_id = admin_external_id 
           OR username = admin_username
           OR (document_type = admin_document_type AND document_value = admin_document_value)
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE '⚠️  Usuário já existe no sistema. Verificando dados...';
        
        -- Buscar o usuário existente
        SELECT id INTO admin_user_id 
        FROM public.authorized_users 
        WHERE external_id = admin_external_id 
           OR username = admin_username
           OR (document_type = admin_document_type AND document_value = admin_document_value)
        LIMIT 1;
        
        -- Atualizar dados do usuário existente para garantir consistência
        UPDATE public.authorized_users 
        SET 
            external_id = admin_external_id,
            username = admin_username,
            full_name = admin_full_name,
            document_type = admin_document_type,
            document_value = admin_document_value,
            status = admin_status,
            is_active = admin_is_active,
            updated_at = NOW()
        WHERE id = admin_user_id;
        
        RAISE NOTICE '✓ Dados do usuário existente atualizados com sucesso';
    ELSE
        -- Criar novo usuário administrador
        RAISE NOTICE 'Criando novo usuário administrador...';
        
        INSERT INTO public.authorized_users (
            external_id,
            username,
            full_name,
            document_type,
            document_value,
            status,
            is_active,
            approved_at
        ) VALUES (
            admin_external_id,
            admin_username,
            admin_full_name,
            admin_document_type,
            admin_document_value,
            admin_status,
            admin_is_active,
            CASE WHEN admin_status = 'APPROVED' THEN NOW() ELSE NULL END
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE '✓ Usuário administrador criado com sucesso. ID: %', admin_user_id;
    END IF;
    
    -- Verificar se existem módulos e ações no sistema
    IF NOT EXISTS(SELECT 1 FROM public.modules WHERE is_active = true) THEN
        RAISE EXCEPTION 'Nenhum módulo ativo encontrado no sistema. Execute primeiro as migrações de dados iniciais.';
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM public.actions) THEN
        RAISE EXCEPTION 'Nenhuma ação encontrada no sistema. Execute primeiro as migrações de dados iniciais.';
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM public.permissions WHERE is_active = true) THEN
        RAISE EXCEPTION 'Nenhuma permissão ativa encontrada no sistema. Execute primeiro as migrações de dados iniciais.';
    END IF;
    
    RAISE NOTICE 'Atribuindo permissões administrativas...';
    
    -- Remover permissões existentes do usuário para evitar duplicatas
    DELETE FROM public.user_permissions WHERE user_id = admin_user_id;
    
    -- Atribuir todas as permissões ativas ao usuário administrador
    INSERT INTO public.user_permissions (
        user_id,
        permission_id,
        campus_ids,
        is_active,
        created_by
    )
    SELECT 
        admin_user_id,
        p.id,
        '{}', -- Array vazio significa acesso a todos os campus
        true,
        admin_user_id
    FROM public.permissions p
    WHERE p.is_active = true
    ON CONFLICT (user_id, permission_id) DO UPDATE SET
        is_active = true,
        campus_ids = '{}',
        updated_at = NOW();
    
    -- Contar quantas permissões foram atribuídas
    DECLARE
        permissions_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO permissions_count
        FROM public.user_permissions up
        JOIN public.permissions p ON up.permission_id = p.id
        WHERE up.user_id = admin_user_id AND up.is_active = true;
        
        RAISE NOTICE '✓ % permissões atribuídas ao usuário administrador', permissions_count;
    END;
    
    -- Resumo final
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SEED CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'Usuário ID: %', admin_user_id;
    RAISE NOTICE 'External ID: %', admin_external_id;
    RAISE NOTICE 'Username: %', admin_username;
    RAISE NOTICE 'Nome: %', admin_full_name;
    RAISE NOTICE 'Documento: % - %', admin_document_type, admin_document_value;
    RAISE NOTICE 'Status: %', admin_status;
    RAISE NOTICE 'Ativo: %', admin_is_active;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 PERMISSÕES ADMINISTRATIVAS:';
    RAISE NOTICE '• Acesso total a todos os módulos do sistema';
    RAISE NOTICE '• Gerenciamento completo de usuários';
    RAISE NOTICE '• Configuração de permissionamentos';
    RAISE NOTICE '• Acesso a todos os campus';
    RAISE NOTICE '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao criar usuário administrador: %', SQLERRM;
END;
$$;

-- Limpar função temporária
DROP FUNCTION IF EXISTS validate_cpf(TEXT);

-- Verificação final
DO $$
DECLARE
    admin_user_record RECORD;
    permissions_summary TEXT;
BEGIN
    -- Buscar dados do usuário criado
    SELECT 
        au.id,
        au.external_id,
        au.username,
        au.full_name,
        au.status,
        au.is_active,
        COUNT(up.id) as total_permissions
    INTO admin_user_record
    FROM public.authorized_users au
    LEFT JOIN public.user_permissions up ON au.id = up.user_id AND up.is_active = true
    WHERE au.external_id = '1e458d25-45fc-48cc-8812-cc6af4b27082'
    GROUP BY au.id, au.external_id, au.username, au.full_name, au.status, au.is_active;
    
    IF admin_user_record.id IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '📋 VERIFICAÇÃO FINAL - USUÁRIO ADMINISTRADOR';
        RAISE NOTICE '=============================================';
        RAISE NOTICE 'ID: %', admin_user_record.id;
        RAISE NOTICE 'External ID: %', admin_user_record.external_id;
        RAISE NOTICE 'Username: %', admin_user_record.username;
        RAISE NOTICE 'Nome: %', admin_user_record.full_name;
        RAISE NOTICE 'Status: %', admin_user_record.status;
        RAISE NOTICE 'Ativo: %', admin_user_record.is_active;
        RAISE NOTICE 'Total de Permissões: %', admin_user_record.total_permissions;
        RAISE NOTICE '';
        RAISE NOTICE '✅ Usuário administrador configurado com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Falha na verificação: Usuário administrador não encontrado após criação';
    END IF;
END;
$$;