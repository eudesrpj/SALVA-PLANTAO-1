#!/usr/bin/env node

/**
 * Setup Database Quick Script
 * Detecta a melhor opção de DB disponível e configura automaticamente
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.resolve('.env');

function log(msg, type = 'info') {
  const icons = {
    info: '📝',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
  };
  console.log(`${icons[type]} ${msg}`);
}

async function main() {
  log('Começando setup de banco de dados...', 'info');

  // 1. Verificar Docker
  try {
    execSync('docker --version', { stdio: 'ignore' });
    log('Docker detectado! Vou usar Docker Compose + PostgreSQL', 'success');
    log('Execute: docker-compose up -d', 'info');
    log('Depois: npm run db:push', 'info');
    log('Depois: npm run dev', 'info');
    process.exit(0);
  } catch {
    log('Docker não encontrado', 'warning');
  }

  // 2. Verificar PostgreSQL local
  try {
    execSync('psql --version', { stdio: 'ignore' });
    log('PostgreSQL local detectado!', 'success');
    log('Crie banco com: psql -U postgres -c "CREATE DATABASE salva_plantao;"', 'info');
    log('Depois configure .env com DATABASE_URL', 'info');
    log('Depois: npm run db:push', 'info');
    process.exit(0);
  } catch {
    log('PostgreSQL local não encontrado', 'warning');
  }

  // 3. Recomendar banco cloud
  log('Nenhuma opção local encontrada', 'warning');
  log('', 'info');
  log('SOLUÇÃO RÁPIDA: Use Neon.tech (gratuito, 0.5 segundos)', 'info');
  log('', 'info');
  log('1. Acesse: https://console.neon.tech', 'info');
  log('2. Crie conta (grátis)', 'info');
  log('3. Crie novo banco', 'info');
  log('4. Copie a connection string (tipo: postgresql://user:pass@...)', 'info');
  log('5. Cole aqui em .env como DATABASE_URL', 'info');
  log('', 'info');
  log('OU use Render.com:', 'info');
  log('1. https://render.com', 'info');
  log('2. New → PostgreSQL', 'info');
  log('3. Copie External Database URL', 'info');
  log('4. Adicione em .env', 'info');
}

main().catch(console.error);
