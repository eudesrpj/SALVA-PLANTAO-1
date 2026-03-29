#!/usr/bin/env node

/**
 * 🎯 PROVISIONAR BANCO - Salva Plantão
 * Tenta automaticamente as melhores opções disponíveis
 * 
 * Uso: node provision-db.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');

function log(msg, type = 'info') {
  const icons = { info: '📝', success: '✅', error: '❌', wait: '⏳', rocket: '🚀' };
  console.log(`${icons[type] || '•'} ${msg}`);
}

function updateEnv(key, value) {
  let content = fs.readFileSync(envPath, 'utf-8');
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(envPath, content);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function tryDocker() {
  try {
    log('🐳 Tentando Docker Compose...', 'wait');
    execSync('docker --version', { stdio: 'pipe' });
    log('  Docker encontrado', 'info');
    
    // Verificar se docker-compose.yml existe
    if (!fs.existsSync(path.join(process.cwd(), 'docker-compose.yml'))) {
      log('  docker-compose.yml não encontrado', 'error');
      return false;
    }

    // Iniciar containers
    execSync('docker-compose down 2>&1 || true', { stdio: 'pipe' });
    log('  Iniciando PostgreSQL container...', 'wait');
    execSync('docker-compose up -d', { stdio: 'pipe' });

    // Aguardar postgres ficar saudável
    for (let i = 0; i < 30; i++) {
      try {
        execSync('docker exec salva_plantao_db pg_isready -U postgres 2>&1', { stdio: 'pipe' });
        log('  ✅ PostgreSQL pronto via Docker', 'success');
        updateEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salva_plantao?sslmode=disable');
        log('✅ .env atualizado com DATABASE_URL', 'success');
        return true;
      } catch {
        if (i % 5 === 0) log(`  Aguardando... (${i}s)`, 'wait');
        await sleep(1000);
      }
    }

    log('  Timeout esperando PostgreSQL', 'error');
    return false;
  } catch {
    log('  Docker não disponível', 'error');
    return false;
  }
}

async function tryPostgresLocal() {
  try {
    log('🗄️  Tentando PostgreSQL Local...', 'wait');
    execSync('psql --version', { stdio: 'pipe' });
    log('  PostgreSQL encontrado', 'info');

    // Criar banco
    try {
      execSync('psql -U postgres -c "CREATE DATABASE salva_plantao;" 2>&1', { stdio: 'pipe' });
      log('  ✅ Banco criado/verificado', 'success');
    } catch (e) {
      if (!e.toString().includes('already exists')) {
        throw e;
      }
      log('  Banco já existe', 'info');
    }

    // Testar conexão
    execSync('psql -U postgres -d salva_plantao -c "SELECT 1;" 2>&1', { stdio: 'pipe' });
    log('✅ PostgreSQL Local funcionando', 'success');
    updateEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/salva_plantao?sslmode=disable');
    log('✅ .env atualizado com DATABASE_URL', 'success');
    return true;
  } catch (e) {
    log(`  PostgreSQL Local falhou: ${e.toString().split('\n')[0]}`, 'error');
    return false;
  }
}

async function trySQLiteDevOnly() {
  try {
    log('💾 Ativando SQLite (para desenvolvimento apenas)...', 'wait');
    
    // SQLite via better-sqlite3 ou drizzle-orm
    // Por hora vamos apenas configurar como fallback
    const dbUrl = 'file:./dev.db?mode=rwc';
    updateEnv('DATABASE_URL', dbUrl);
    log('✅ SQLite ativado (limitado)', 'success');
    log('  ⚠️  NOTA: Muitos features podem não funcionar com SQLite', 'info');
    log('  Instale PostgreSQL depois para funcionalidade completa', 'info');
    return true;
  } catch (e) {
    log(`  SQLite falhou: ${e.toString()}`, 'error');
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  🚀 PROVISIONAR BANCO DE DADOS         ║');
  console.log('║  Tentando opções automaticamente       ║');
  console.log('╚════════════════════════════════════════╝\n');

  log('Iniciando descoberta automática...', 'rocket');
  console.log('');

  // Try options em ordem de preferência
  const strategies = [
    { name: 'Docker Compose', fn: tryDocker },
    { name: 'PostgreSQL Local', fn: tryPostgresLocal },
    { name: 'SQLite (dev only)', fn: trySQLiteDevOnly }
  ];

  for (const { name, fn } of strategies) {
    const success = await fn();
    if (success) {
      console.log('\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ');
      log('PRÓXIMOS PASSOS:', 'rocket');
      log('1. npm run db:push       # Criar tabelas', 'info');
      log('2. npm run dev            # Iniciar servidor', 'info');
      log('3. http://localhost:5173  # Abrir app', 'info');
      console.log('');
      process.exit(0);
    }
  }

  // Nenhuma opção funcionou
  console.log('\n─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ');
  log('❌ Nenhuma opção automática funcionou', 'error');
  console.log(`
⚠️  Opções Manuais:

1️⃣  NEON.TECH (Recomendado - Cloud Grátis)
   • Acesse: https://console.neon.tech
   • Crie projeto
   • Copie connection string
   • Edite .env e adicione: DATABASE_URL=<string_copiada>
   • Depois: npm run db:push

2️⃣  POSTGRESQL MANUAL
   • Instale: https://www.postgresql.org/download/windows/
   • Crie banco: psql -U postgres -c "CREATE DATABASE salva_plantao;"
   • Edite .env com sua senha
   • npm run db:push

3️⃣  DOCKER MANUAL
   • Instale: https://www.docker.com/products/docker-desktop/
   • Rode: node provision-db.mjs (novamente)

4️⃣  OFFLINE MODE
   • npm run dev (sem dados persistentes)
   • Apenas frontend funciona
   • Configure banco depois
  `);

  process.exit(1);
}

main().catch(e => {
  log(`Erro fatal: ${e.message}`, 'error');
  process.exit(1);
});
