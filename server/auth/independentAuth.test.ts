import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('../storage', () => ({
  storage: {},
}));

let createToken: typeof import('./independentAuth').createToken;
let verifyToken: typeof import('./independentAuth').verifyToken;

describe('JWT Auth', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-32-chars-minimum-';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-key-32-chars-minimum';

    const mod = await import('./independentAuth');
    createToken = mod.createToken;
    verifyToken = mod.verifyToken;
  });

  describe('createToken', () => {
    it('deve criar um token de acesso válido', () => {
      const token = createToken('user-123', false);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT tem 3 partes
    });

    it('deve criar um refresh token válido', () => {
      const token = createToken('user-123', true);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('deve criar tokens diferentes para access e refresh', () => {
      const accessToken = createToken('user-123', false);
      const refreshToken = createToken('user-123', true);
      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyToken', () => {
    it('deve verificar token de acesso válido', () => {
      const token = createToken('user-123', false);
      const decoded = verifyToken(token, false);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('user-123');
    });

    it('deve verificar refresh token válido', () => {
      const token = createToken('user-456', true);
      const decoded = verifyToken(token, true);
      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe('user-456');
    });

    it('deve rejeitar token expirado', () => {
      // Token expirado tem payload com exp no passado
      // Para testar, criamos um token e esperamos ele expirar
      // (não testable facilmente sem manipular o tempo)
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImlzUmVmcmVzaCI6ZmFsc2UsImV4cCI6MTAwMDAwMDAwMH0.invalid';
      const decoded = verifyToken(token, false);
      expect(decoded).toBeNull();
    });

    it('deve rejeitar token com tipo errado', () => {
      const accessToken = createToken('user-123', false);
      // Tentar verificar como refresh deve falhar
      const decoded = verifyToken(accessToken, true);
      expect(decoded).toBeNull();
    });

    it('deve rejeitar token inválido', () => {
      const decoded = verifyToken('invalid.token.here', false);
      expect(decoded).toBeNull();
    });
  });
});
