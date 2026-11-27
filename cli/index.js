#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Importar templates
import { pageTemplate } from './templates/page.template.js';
import { serviceTemplate } from './templates/service.template.js';
import { apiTemplate } from './templates/api.template.js';
import { translationsTemplate } from './templates/translations.template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do programa
program
  .name('zion-cli')
  .description('CLI para automação de criação de features no projeto Zion')
  .version('1.0.0');

// Utilitários
const log = {
  success: (msg) => console.log(chalk.green('✅ ' + msg)),
  error: (msg) => console.log(chalk.red('❌ ' + msg)),
  warning: (msg) => console.log(chalk.yellow('⚠️  ' + msg)),
  info: (msg) => console.log(chalk.blue('ℹ️  ' + msg)),
  title: (msg) => console.log(chalk.bold.cyan('\n🚀 ' + msg + '\n')),
};

// Validações
const validateFeatureName = (name) => {
  if (!name) {
    throw new Error('Nome da feature é obrigatório');
  }
  
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(name)) {
    throw new Error('Nome deve estar em kebab-case (ex: minha-feature)');
  }
  
  if (name.length < 3) {
    throw new Error('Nome deve ter pelo menos 3 caracteres');
  }
  
  if (name.length > 30) {
    throw new Error('Nome deve ter no máximo 30 caracteres');
  }
  
  return true;
};

const checkIfFeatureExists = (featureName) => {
  const projectRoot = path.resolve(__dirname, '..');
  const pagePath = path.join(projectRoot, 'src', 'app', '[locale]', '(authenticated)', featureName);
  
  if (fs.existsSync(pagePath)) {
    throw new Error(`Feature '${featureName}' já existe. Use --force para sobrescrever.`);
  }
};

// Conversores de nomenclatura
const toPascalCase = (str) => {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const toCamelCase = (str) => {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const toUpperSnakeCase = (str) => {
  return str.replace(/-/g, '_').toUpperCase();
};

const toTitleCase = (str) => {
  return str.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Templates de código usando arquivos separados
class TemplateGenerator {
  constructor(featureName) {
    this.featureName = featureName;
    this.pascalName = toPascalCase(featureName);
    this.camelName = toCamelCase(featureName);
    this.upperSnakeName = toUpperSnakeCase(featureName);
    this.titleName = toTitleCase(featureName);
    this.projectRoot = path.resolve(__dirname, '..');
  }

  generatePageTemplate() {
    return pageTemplate(this.featureName, this.pascalName, this.camelName, this.titleName);
  }

  generateServiceTemplate() {
    return serviceTemplate(this.featureName, this.pascalName, this.camelName);
  }

  generateServiceIndexTemplate() {
    return `export * from './${this.featureName}.service';`;
  }

  generateApiRouteTemplate() {
    return apiTemplate(this.featureName, this.pascalName, this.camelName, this.upperSnakeName);
  }

  generateTranslations() {
    return {
      pt: translationsTemplate.pt(this.featureName, this.titleName),
      en: translationsTemplate.en(this.featureName, this.titleName),
      es: translationsTemplate.es(this.featureName, this.titleName)
    };
  }
}

// Comando principal
program
  .command('create-feature')
  .description('Criar uma nova feature completa')
  .argument('<feature-name>', 'Nome da feature em kebab-case')
  .option('-f, --force', 'Forçar criação mesmo se já existir')
  .action(async (featureName, options) => {
    try {
      log.title(`Criando feature: ${featureName}`);

      // Validações
      const spinner = ora('Validando parâmetros...').start();
      
      validateFeatureName(featureName);
      
      if (!options.force) {
        checkIfFeatureExists(featureName);
      }
      
      spinner.succeed('Validações concluídas');

      // Confirmação
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Deseja criar a feature '${featureName}'?`,
            default: true,
          },
        ]);

        if (!confirm) {
          log.warning('Operação cancelada pelo usuário');
          return;
        }
      }

      // Inicializar gerador
      const generator = new TemplateGenerator(featureName);
      const projectRoot = generator.projectRoot;

      // Criar diretórios
      const createSpinner = ora('Criando estrutura de diretórios...').start();
      
      const pagePath = path.join(projectRoot, 'src', 'app', '[locale]', '(authenticated)', featureName);
      const servicePath = path.join(projectRoot, 'src', 'services', featureName);
      const apiPath = path.join(projectRoot, 'src', 'app', 'api', featureName);

      shell.mkdir('-p', pagePath);
      shell.mkdir('-p', servicePath);
      shell.mkdir('-p', apiPath);
      
      createSpinner.succeed('Diretórios criados');

      // Gerar arquivos
      const filesSpinner = ora('Gerando arquivos...').start();

      // Página
      const pageFile = path.join(pagePath, 'page.tsx');
      fs.writeFileSync(pageFile, generator.generatePageTemplate());

      // Service
      const serviceFile = path.join(servicePath, `${featureName}.service.ts`);
      const serviceIndexFile = path.join(servicePath, 'index.ts');
      fs.writeFileSync(serviceFile, generator.generateServiceTemplate());
      fs.writeFileSync(serviceIndexFile, generator.generateServiceIndexTemplate());

      // API Route
      const apiFile = path.join(apiPath, 'route.ts');
      fs.writeFileSync(apiFile, generator.generateApiRouteTemplate());

      filesSpinner.succeed('Arquivos gerados');

      // Atualizar traduções
      const translationSpinner = ora('Atualizando traduções...').start();
      
      const translations = generator.generateTranslations();
      const messagesPath = path.join(projectRoot, 'messages');

      ['pt', 'en', 'es'].forEach(lang => {
        const filePath = path.join(messagesPath, `${lang}.json`);
        if (fs.existsSync(filePath)) {
          const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const updated = { ...existing, ...translations[lang] };
          fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
        }
      });

      translationSpinner.succeed('Traduções atualizadas');

      // Sucesso
      log.success(`Feature '${featureName}' criada com sucesso!`);
      
      console.log(chalk.cyan('\n📁 Arquivos criados:'));
      console.log(chalk.gray(`   • ${pageFile}`));
      console.log(chalk.gray(`   • ${serviceFile}`));
      console.log(chalk.gray(`   • ${serviceIndexFile}`));
      console.log(chalk.gray(`   • ${apiFile}`));
      
      console.log(chalk.cyan('\n📋 Próximos passos:'));
      console.log(chalk.yellow('   1. Adicionar módulo e permissões em src/types/permissions.ts'));
      console.log(chalk.yellow('   2. Adicionar item ao sidebar em src/hooks/use-navigation-items.ts'));
      console.log(chalk.yellow('   3. Criar tabela no banco de dados (se necessário)'));
      console.log(chalk.yellow('   4. Configurar permissões no sistema'));
      console.log(chalk.yellow('   5. Testar a nova feature'));

    } catch (error) {
      log.error(error.message);
      process.exit(1);
    }
  });

// Comando de ajuda
program
  .command('help')
  .description('Mostrar ajuda detalhada')
  .action(() => {
    console.log(chalk.bold.cyan('\n🚀 Zion CLI - Gerador de Features\n'));
    
    console.log(chalk.yellow('Uso:'));
    console.log('  node index.js create-feature <nome-da-feature>\n');
    
    console.log(chalk.yellow('Exemplos:'));
    console.log('  node index.js create-feature produtos');
    console.log('  node index.js create-feature vendas');
    console.log('  node index.js create-feature relatorios\n');

    console.log(chalk.yellow('Opções:'));
    console.log('  -f, --force    Forçar criação mesmo se já existir');
    console.log('  -h, --help     Mostrar ajuda\n');
  });

// Executar programa
program.parse();

// Mostrar ajuda se nenhum comando for fornecido
if (!process.argv.slice(2).length) {
  program.outputHelp();
}