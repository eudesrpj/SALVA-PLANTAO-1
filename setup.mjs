#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE SETUP AUTOMÁTICO - Salva Plantão
 * 
 * Detecta a melhor opção de banco disponível e configura auomaticamente
 * Sem essa opção ficará offline (apenas frontend funciona)
 * 
 * Uso: node setup.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function log(msg, type = 'info') {
  const icons = { info: '📝', success: '✅', error: '❌', warning: '⚠️ ', wait: '⏳' };
  console.log(`\n${icons[type]} ${msg}`);
}

function logTable(header, items) {
  console.log(`\n${header}`);
  console.log('─'.repeat(50));
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
}

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     🚀 SALVA PLANTÃO - SETUP AUTOMÁTICO            ║');
  console.log('║     Auto-configure banco de dados                  ║');
  console.log('╚═══════════════════════════════════════════════════╝');

  log('🔍 Detectando opções de banco disponíveis...', 'wait');

  const options = [];

  // Verificar Docker
  try {
    execSync('docker --version', { stdio: 'ignore' });
    options.push('Docker + PostgreSQL (container)');
  } catch {
    // Docker não disponível
  }

  // Verificar PostgreSQL local
  try {
    execSync('psql --version', { stdio: 'ignore' });
    options.push('PostgreSQL Local');
  } catch {
    // PostgreSQL não disponível
  }

  // Sempre oferecer Neon.tech e manual
  options.push('Neon.tech Cloud (gratuito)');
  options.push('Configurar Manualmente (advanced)');
  options.push('Passar esta etapa (offline mode)');

  logTable('Opções Disponíveis:', options);

  const choice = await ask('\n👉 Escolha uma opção (1-' + options.length + '): ');
  const selected = parseInt(choice) - 1;

  if (selected < 0 || selected >= options.length) {
    log('❌ Opção inválida', 'error');
    process.exit(1);
  }

  const selectedOption = options[selected].split(' ')[0]; // Ex: "Docker" => "Docker"

  console.log('\n');

  switch (selectedOption) {
    case 'Docker':
      await setupDocker();
      break;
    case 'PostgreSQL':
      await setupPostgresLocal();
      break;
    case 'Neon.tech':
      await setupNeon();
      break;
    case 'Configurar':
      await setupManual();
      break;
    default:
      await setupOffline();
  }

  rl.close();
}

async function setupDocker() {
  log('Iniciando Docker Compose...', 'wait');

  try {
    execSync('docker-compose up -d', { cwd: process.cwd(), stdio: 'ignore' });
    log('✓ Container PostgreSQL iniciado!', 'success');

    // Aguardar postgres ficar pronto
    log('Aguardando PostgreSQL estar pronto...', 'wait');
    for (let i = 0; i < 10; i++) {
      try {
        execSync('docker exec salva_plantao_db pg_isready -U postgres', { stdio: 'ignore' });
        log('✓ PostgreSQL pronto!', 'success');
        break;
      } catch {
        if (i === 9) throw new Error('PostgreSQL não ficou pronto');
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    updateEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salva_plantao?sslmode=disable');
    log('✓ Arquivo .env atualizado', 'success');
    log('Próximo: npm run db:push', 'info');
    log('Depois: npm run dev', 'info');
  } catch (e) {
    log(`Erro ao iniciar Docker: ${e.message}`, 'error');
  }
}

async function setupPostgresLocal() {
  log('Criando banco PostgreSQL local...', 'wait');

  try {
    execSync('psql -U postgres -c "CREATE DATABASE salva_plantao;" 2>&1 || true', { stdio: 'ignore' });
    log('✓ Banco criado/verificado', 'success');

    const password = await ask('Digite a senha do PostgreSQL (default: postgres): ');
    const dbUrl = `postgresql://postgres:${password || 'postgres'}@localhost:5432/salva_plantao?sslmode=disable`;

    updateEnv('DATABASE_URL', dbUrl);
    log('✓ Arquivo .env atualizado', 'success');
    log('Próximo: npm run db:push', 'info');
    log('Depois: npm run dev', 'info');
  } catch (e) {
    log(`Erro ao configurar PostgreSQL local: ${e.message}`, 'error');
  }
}

async function setupNeon() {
  log('Neon.tech Setup (Requer Conta)', 'info');
  console.log(`
  1. Acesse: https://console.neon.tech
  2. Faça login ou crie conta (gratuito)
  3. Crie novo projeto
  4. Copie a "Connection String"
  5. Cole abaixo quando solicitado
  `);

  const dbUrl = await ask('Cole a string de conexão do Neon: ');

  if (!dbUrl || !dbUrl.includes('@')) {
    log('❌ String inválida', 'error');
    process.exit(1);
  }

  updateEnv('DATABASE_URL', dbUrl);
  log('✓ Arquivo .env atualizado', 'success');
  log('Próximo: npm run db:push', 'info');
  log('Depois: npm run dev', 'info');
}

async function setupManual() {
  log('Configuração Manual', 'info');
  console.log(`
  1. Instale PostgreSQL em qualquer lugar
  2. Obtenha a string de conexão
  3. Edite .env manualmente
  4. Execute: npm run db:push
  5. Execute: npm run dev
  `);
}

async function setupOffline() {
  log('Modo Offline Ativado', 'warning');
  console.log(`
  A aplicação vai funcionar sem persistência.
  
  Funciona:
  ✅ Frontend (UI)
  ✅ Login (sem salvamento)
  ✅ Autenticação
  
  Não funciona:
  ❌ Salvamento de dados
  ❌ Prescrições, protocolos, etc
  ❌ Admin functions
  
  Para ativar banco depois:
  1. Configure DATABASE_URL em .env
  2. Execute: npm run db:push
  3. Reinicie: npm run dev
  `);
}

function updateEnv(key, value) {
  const envPath = path.join(process.cwd(), '.env');
  let content = fs.readFileSync(envPath, 'utf-8');

  const regex = new RegExp(`^${key}=.*$`, 'm');
  content = content.replace(regex, `${key}=${value}`);

  fs.writeFileSync(envPath, content);
}

main().catch(console.error);
