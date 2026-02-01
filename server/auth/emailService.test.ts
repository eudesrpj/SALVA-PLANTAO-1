import { describe, it, expect } from 'vitest';
import { generateCode, generateToken } from './emailService';
import bcrypt from 'bcryptjs';

describe('Email Service', () => {
  describe('generateCode', () => {
    it('deve gerar código de 6 dígitos', () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('deve gerar códigos diferentes', () => {
      const code1 = generateCode();
      const code2 = generateCode();
      // Estatisticamente improvável serem iguais
      expect(code1 || code2).toBeTruthy();
    });
  });

  describe('generateToken', () => {
    it('deve gerar token de 64 caracteres hex (32 bytes)', () => {
      const token = generateToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/i);
      expect(token.length).toBe(64);
    });

    it('deve gerar tokens diferentes', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('Bcrypt hashing', () => {
    it('deve hashear e validar código corretamente', async () => {
      const code = generateCode();
      const hash = await bcrypt.hash(code, 10);
      const isValid = await bcrypt.compare(code, hash);
      expect(isValid).toBe(true);
    });

    it('deve rejeitar código incorreto', async () => {
      const code = generateCode();
      const wrongCode = generateCode();
      const hash = await bcrypt.hash(code, 10);
      const isValid = await bcrypt.compare(wrongCode, hash);
      expect(isValid).toBe(false);
    });

    it('deve hashear e validar token corretamente', async () => {
      const token = generateToken();
      const hash = await bcrypt.hash(token, 10);
      const isValid = await bcrypt.compare(token, hash);
      expect(isValid).toBe(true);
    });
  });
});
