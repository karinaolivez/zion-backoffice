require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Dados do usuário
const userData = {
    external_id: '98f56172-a22f-4890-983a-ab595f9cd1ba', // ID no ZGP
    username: 'br:47003226839', // CPF sem formatação
    full_name: 'Victor Caetano', // Nome padrão
    document_type: 'br',
    document_value: '470.032.268-39',
    email: 'victorsax12@gmail.com', // Email temporário para autenticação
    password: 'User123!@#', // Senha temporária
    status: 'APPROVED',
    is_active: true
};

async function createUser() {
    try {
        console.log('🔐 CRIANDO USUÁRIO');
        console.log('==========================================\n');

        // Configurar Supabase com service role key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('❌ Variáveis de ambiente do Supabase não encontradas');
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);


        console.log('📋 1. Verificando se o usuário já existe no Auth...');

        // Verificar se já existe no Auth
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Erro ao listar usuários: ${listError.message}`);
        }

        const existingAuthUser = existingUsers.users.find(user =>
            user.user_metadata?.username === userData.username ||
            user.email === userData.email
        );

        let authUserId;

        if (existingAuthUser) {
            console.log('⚠️  Usuário já existe no Supabase Auth:');
            console.log(`   - ID: ${existingAuthUser.id}`);
            console.log(`   - Email: ${existingAuthUser.email}`);
            console.log(`   - Username: ${existingAuthUser.user_metadata?.username}`);

            authUserId = existingAuthUser.id;

            // Atualizar metadados se necessário
            console.log('\n📋 2. Atualizando metadados do usuário...');
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingAuthUser.id,
                {
                    user_metadata: {
                        username: userData.username,
                        full_name: userData.full_name,
                        document_value: userData.document_value,
                        external_id: userData.external_id
                    }
                }
            );

            if (updateError) {
                console.log('❌ Erro ao atualizar metadados:', updateError.message);
            } else {
                console.log('✅ Metadados atualizados com sucesso!');
            }
        } else {
            console.log('📋 2. Criando novo usuário no Supabase Auth...');

            // Criar usuário no Auth
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                email_confirm: true, // Confirmar email automaticamente
                user_metadata: {
                    username: userData.username,
                    full_name: userData.full_name,
                    document_value: userData.document_value,
                    external_id: userData.external_id
                }
            });

            if (createError) {
                throw new Error(`Erro ao criar usuário: ${createError.message}`);
            }

            authUserId = newUser.user.id;

            console.log('✅ Usuário criado no Supabase Auth com sucesso!');
            console.log(`   - ID: ${newUser.user.id}`);
            console.log(`   - Email: ${newUser.user.email}`);
            console.log(`   - Username: ${newUser.user.user_metadata?.username}`);
        }

        console.log('\n📋 3. Verificando usuário na tabela authorized_users...');

        // Verificar se existe na tabela authorized_users
        const { data: existingDbUser, error: selectError } = await supabase
            .from('authorized_users')
            .select('*')
            .or(`external_id.eq.${userData.external_id},username.eq.${userData.username},and(document_type.eq.${userData.document_type},document_value.eq.${userData.document_value})`)
            .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
            throw new Error(`Erro ao verificar usuário na tabela: ${selectError.message}`);
        }

        if (existingDbUser) {
            console.log('⚠️  Usuário já existe na tabela authorized_users:');
            console.log(`   - ID: ${existingDbUser.id}`);
            console.log(`   - Username: ${existingDbUser.username}`);
            console.log(`   - Status: ${existingDbUser.status}`);

            // Atualizar dados se necessário
            console.log('\n📋 4. Atualizando dados na tabela authorized_users...');
            const { error: updateDbError } = await supabase
                .from('authorized_users')
                .update({
                    external_id: authUserId, // Usar o ID do Auth como external_id
                    full_name: userData.full_name,
                    status: userData.status,
                    is_active: userData.is_active,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingDbUser.id);

            if (updateDbError) {
                throw new Error(`Erro ao atualizar usuário na tabela: ${updateDbError.message}`);
            }

            console.log('✅ Usuário atualizado na tabela authorized_users!');
        } else {
            console.log('📋 4. Inserindo usuário na tabela authorized_users...');

            // Inserir na tabela authorized_users
            const { data: newDbUser, error: insertError } = await supabase
                .from('authorized_users')
                .insert({
                    external_id: authUserId, // Usar o ID do Auth como external_id
                    username: userData.username,
                    full_name: userData.full_name,
                    document_type: userData.document_type,
                    document_value: userData.document_value,
                    status: userData.status,
                    is_active: userData.is_active
                })
                .select()
                .single();

            if (insertError) {
                throw new Error(`Erro ao inserir usuário na tabela: ${insertError.message}`);
            }

            console.log('✅ Usuário inserido na tabela authorized_users com sucesso!');
            console.log(`   - ID: ${newDbUser.id}`);
            console.log(`   - External ID: ${newDbUser.external_id}`);
            console.log(`   - Username: ${newDbUser.username}`);
        }

        console.log('\n📋 5. Configurando permissões básicas...');

        // Buscar o usuário na tabela para obter o ID
        const { data: dbUser, error: getUserError } = await supabase
            .from('authorized_users')
            .select('id')
            .eq('username', userData.username)
            .single();

        if (getUserError) {
            throw new Error(`Erro ao buscar usuário: ${getUserError.message}`);
        }

        // Buscar algumas permissões básicas para atribuir
        const { data: basicPermissions, error: getPermissionsError } = await supabase
            .from('permissions')
            .select('id, name')
            .in('name', [
                'USUARIOS_VER',
                'USUARIOS_EDITAR',
                'USUARIOS_LISTAR',
                'USUARIOS_CRIAR',
                'USUARIOS_REMOVER',
                'PERMISSOES_VER',
                'PERMISSOES_EDITAR',
                'PERMISSOES_LISTAR',
                'PERMISSOES_CRIAR',
                'PERMISSOES_REMOVER',
                'CAMPUS_VER',
                'CAMPUS_LISTAR'
            ])
            .eq('is_active', true);

        if (getPermissionsError) {
            console.log('⚠️  Erro ao buscar permissões básicas:', getPermissionsError.message);
        } else if (basicPermissions && basicPermissions.length > 0) {
            // Inserir permissões do usuário
            const userPermissions = basicPermissions.map(permission => ({
                user_id: dbUser.id,
                permission_id: permission.id,
                is_active: true
            }));

            const { error: insertPermissionsError } = await supabase
                .from('user_permissions')
                .upsert(userPermissions, {
                    onConflict: 'user_id,permission_id',
                    ignoreDuplicates: false
                });

            if (insertPermissionsError) {
                console.log('⚠️  Erro ao inserir permissões:', insertPermissionsError.message);
            } else {
                console.log(`✅ ${basicPermissions.length} permissões básicas configuradas!`);
                basicPermissions.forEach(perm => {
                    console.log(`   - ${perm.name}`);
                });
            }
        }

        console.log('\n🎉 USUÁRIO CRIADO COM SUCESSO!');
        console.log('===============================');
        console.log(`📧 Email: ${userData.email}`);
        console.log(`🔑 Senha: ${userData.password}`);
        console.log(`👤 Username: ${userData.username}`);
        console.log(`📄 CPF: ${userData.document_value}`);
        console.log(`✅ Status: ${userData.status}`);
        console.log('\n⚠️  IMPORTANTE: Altere a senha no primeiro login!');

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        process.exit(1);
    }
}

// Executar o script
createUser();