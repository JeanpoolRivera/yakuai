import { describe, it, expect } from 'vitest'
import { isFarmerRole, isStaffRole, roleLabel } from './permissions'

describe('permissions', () => {
  describe('isFarmerRole', () => {
    it('retorna true para agricultor', () => {
      expect(isFarmerRole('agricultor')).toBe(true)
    })

    it('retorna false para admin', () => {
      expect(isFarmerRole('admin')).toBe(false)
    })

    it('retorna false para tecnico', () => {
      expect(isFarmerRole('tecnico')).toBe(false)
    })

    it('retorna false para null', () => {
      expect(isFarmerRole(null)).toBe(false)
    })
  })

  describe('isStaffRole', () => {
    it('retorna true para admin', () => {
      expect(isStaffRole('admin')).toBe(true)
    })

    it('retorna true para tecnico', () => {
      expect(isStaffRole('tecnico')).toBe(true)
    })

    it('retorna false para agricultor', () => {
      expect(isStaffRole('agricultor')).toBe(false)
    })

    it('retorna false para rol desconocido', () => {
      expect(isStaffRole('soporte')).toBe(false)
    })

    it('retorna false para null', () => {
      expect(isStaffRole(null)).toBe(false)
    })
  })

  describe('roleLabel', () => {
    it('retorna "Administrador" para admin', () => {
      expect(roleLabel('admin')).toBe('Administrador')
    })

    it('retorna "Técnico" para tecnico', () => {
      expect(roleLabel('tecnico')).toBe('Técnico')
    })

    it('retorna "Agricultor" para agricultor', () => {
      expect(roleLabel('agricultor')).toBe('Agricultor')
    })

    it('retorna "Sesión" para null', () => {
      expect(roleLabel(null)).toBe('Sesión')
    })

    it('retorna "Sesión" para rol desconocido', () => {
      expect(roleLabel('desconocido')).toBe('Sesión')
    })
  })
})
