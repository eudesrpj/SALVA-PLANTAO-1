import { describe, it, expect } from 'vitest';

describe('Email Validation', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validEmails = [
    'user@example.com',
    'test.user@example.co.uk',
    'user+tag@example.com',
    'user_name@example.com',
    'user123@example.com',
    'user@subdomain.example.com',
  ];

  const invalidEmails = [
    'user@',
    '@example.com',
    'user@.com',
    'user example@example.com',
    'user@example',
    'user@@example.com',
    '',
    'just-text',
  ];

  describe('Valid emails', () => {
    validEmails.forEach(email => {
      it(`deve aceitar ${email}`, () => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });
  });

  describe('Invalid emails', () => {
    invalidEmails.forEach(email => {
      it(`deve rejeitar "${email}"`, () => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Email normalization', () => {
    it('deve normalizar email com trim', () => {
      const email = '  user@example.com  ';
      const normalized = email.toLowerCase().trim();
      expect(normalized).toBe('user@example.com');
    });

    it('deve converter para minúsculas', () => {
      const email = 'User@Example.COM';
      const normalized = email.toLowerCase();
      expect(normalized).toBe('user@example.com');
    });
  });
});
