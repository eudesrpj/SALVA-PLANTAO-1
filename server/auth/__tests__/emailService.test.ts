import { describe, it, expect } from 'vitest'
import { generateCode, generateToken } from '../emailService'

describe('emailService', () => {
  describe('generateCode', () => {
    it('deve gerar um código com 6 dígitos', () => {
      const code = generateCode()
      expect(code).toHaveLength(6)
      expect(/^\d{6}$/.test(code)).toBe(true)
    })

    it('deve gerar códigos diferentes', () => {
      const code1 = generateCode()
      const code2 = generateCode()
      expect(code1).not.toBe(code2)
    })

    it('deve estar entre 100000 e 999999', () => {
      const code = generateCode()
      const num = parseInt(code)
      expect(num).toBeGreaterThanOrEqual(100000)
      expect(num).toBeLessThanOrEqual(999999)
    })
  })

  describe('generateToken', () => {
    it('deve gerar um token hexadecimal com 64 caracteres (32 bytes)', () => {
      const token = generateToken()
      expect(token).toHaveLength(64)
      expect(/^[a-f0-9]{64}$/.test(token)).toBe(true)
    })

    it('deve gerar tokens diferentes', () => {
      const token1 = generateToken()
      const token2 = generateToken()
      expect(token1).not.toBe(token2)
    })

    it('deve conter apenas caracteres hexadecimais', () => {
      const token = generateToken()
      const hexRegex = /^[a-f0-9]{64}$/
      expect(hexRegex.test(token)).toBe(true)
    })
  })
})
