import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'

vi.mock('../storage', () => ({
  storage: {},
}))

let createToken: typeof import('../independentAuth').createToken
let verifyToken: typeof import('../independentAuth').verifyToken

beforeAll(async () => {
  const mod = await import('../independentAuth')
  createToken = mod.createToken
  verifyToken = mod.verifyToken
})

// Configurar variáveis de ambiente de teste
beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret-key-12345'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345'
})

afterEach(() => {
  delete process.env.JWT_SECRET
  delete process.env.JWT_REFRESH_SECRET
})

describe('JWT Auth', () => {
  describe('createToken', () => {
    it('deve criar um token JWT válido', () => {
      const token = createToken('user-123', false)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT tem 3 partes
    })

    it('deve criar um refresh token válido', () => {
      const token = createToken('user-456', true)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })

    it('deve retornar null se JWT_SECRET não está configurado', async () => {
      const originalSecret = process.env.JWT_SECRET
      const originalRefresh = process.env.JWT_REFRESH_SECRET

      delete process.env.JWT_SECRET
      delete process.env.JWT_REFRESH_SECRET

      vi.resetModules()
      const mod = await import('../independentAuth')
      expect(() => mod.createToken('user-123', false)).toThrow()

      process.env.JWT_SECRET = originalSecret
      process.env.JWT_REFRESH_SECRET = originalRefresh
      vi.resetModules()
      const reloaded = await import('../independentAuth')
      createToken = reloaded.createToken
      verifyToken = reloaded.verifyToken
    })
  })

  describe('verifyToken', () => {
    it('deve verificar um token válido', () => {
      const token = createToken('user-789', false)
      const decoded = verifyToken(token, false)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe('user-789')
    })

    it('deve retornar null para um token inválido', () => {
      const decoded = verifyToken('invalid-token', false)
      expect(decoded).toBeNull()
    })

    it('deve rejeitar um refresh token quando esperado access token', () => {
      const refreshToken = createToken('user-123', true)
      const decoded = verifyToken(refreshToken, false)
      expect(decoded).toBeNull()
    })

    it('deve aceitar um refresh token quando verificado como refresh', () => {
      const refreshToken = createToken('user-456', true)
      const decoded = verifyToken(refreshToken, true)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe('user-456')
    })

    it('deve lançar erro se JWT_SECRET não está configurado', async () => {
      const originalSecret = process.env.JWT_SECRET
      const originalRefresh = process.env.JWT_REFRESH_SECRET

      delete process.env.JWT_SECRET
      delete process.env.JWT_REFRESH_SECRET

      vi.resetModules()
      const mod = await import('../independentAuth')
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImlzUmVmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNjc4NzIwMH0.xxx'
      expect(mod.verifyToken(token, false)).toBeNull()

      process.env.JWT_SECRET = originalSecret
      process.env.JWT_REFRESH_SECRET = originalRefresh
      vi.resetModules()
      const reloaded = await import('../independentAuth')
      createToken = reloaded.createToken
      verifyToken = reloaded.verifyToken
    })
  })
})
