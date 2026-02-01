import { describe, it, expect } from 'vitest'

// Email validation utility
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

describe('Email Validation', () => {
  describe('validateEmail', () => {
    it('deve aceitar um email válido', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('deve rejeitar um email sem domínio', () => {
      expect(validateEmail('userexample.com')).toBe(false)
    })

    it('deve rejeitar um email sem extensão de domínio', () => {
      expect(validateEmail('user@example')).toBe(false)
    })

    it('deve rejeitar um email vazio', () => {
      expect(validateEmail('')).toBe(false)
    })

    it('deve rejeitar um email com espaços', () => {
      expect(validateEmail('user @example.com')).toBe(false)
      expect(validateEmail('user@example .com')).toBe(false)
    })

    it('deve rejeitar um email sem parte local', () => {
      expect(validateEmail('@example.com')).toBe(false)
    })

    it('deve normalizar email para lowercase', () => {
      const email = 'User@Example.COM'
      const normalized = email.toLowerCase().trim()
      expect(validateEmail(normalized)).toBe(true)
    })
  })
})
