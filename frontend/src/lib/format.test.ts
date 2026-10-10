import { describe, it, expect } from 'vitest'
import {
  fmtDateTime,
  fmtDate,
  fmtNum,
  toNum,
  initial,
  ageMinutes,
  ageLabel,
  resultLabel,
  badgeToneForResult,
  nowLocalInput,
  localInputToIso,
  todayInput,
  todayShort,
  todayLong,
} from './format'

describe('todayShort', () => {
  it('retorna la fecha corta en español', () => {
    expect(todayShort()).toMatch(/\d+ de \w+/)
  })
})

describe('todayLong', () => {
  it('retorna la fecha larga en español', () => {
    expect(todayLong()).toContain(',')
  })
})

describe('format', () => {
  describe('fmtDateTime', () => {
    it('formatea fecha ISO correctamente', () => {
      const result = fmtDateTime('2026-09-28T10:30:00Z')
      expect(result).toContain('28')
      expect(result).toMatch(/se[pt]/) // es-PE uses set. or sep. depending on ICU.
    })

    it('maneja null', () => {
      expect(fmtDateTime(null)).toBe('—')
    })

    it('maneja undefined', () => {
      expect(fmtDateTime(undefined)).toBe('—')
    })

    it('maneja fecha inválida', () => {
      expect(fmtDateTime('invalid')).toBe('—')
    })
  })

  describe('fmtDate', () => {
    it('formatea fecha corta (YYYY-MM-DD)', () => {
      const result = fmtDate('2026-09-28')
      expect(result).toContain('28')
      expect(result).toContain('2026')
    })

    it('formatea fecha ISO completa', () => {
      const result = fmtDate('2026-09-28T10:30:00Z')
      expect(result).toContain('28')
    })

    it('maneja null', () => {
      expect(fmtDate(null)).toBe('—')
    })
  })

  describe('fmtNum', () => {
    it('formatea número con decimales', () => {
      expect(fmtNum(1234.567, 2)).toBe('1,234.57')
    })

    it('formatea número sin decimales', () => {
      expect(fmtNum(1234)).toBe('1,234')
    })

    it('maneja null', () => {
      expect(fmtNum(null)).toBe('—')
    })

    it('maneja string vacío', () => {
      expect(fmtNum('')).toBe('—')
    })

    it('maneja string numérico', () => {
      expect(fmtNum('42')).toBe('42')
    })
  })

  describe('toNum', () => {
    it('convierte string a número', () => {
      expect(toNum('42')).toBe(42)
    })

    it('retorna null para string vacío', () => {
      expect(toNum('')).toBeNull()
    })

    it('retorna null para null', () => {
      expect(toNum(null)).toBeNull()
    })

    it('retorna null para NaN', () => {
      expect(toNum('abc')).toBeNull()
    })
  })

  describe('initial', () => {
    it('retorna primera letra mayúscula', () => {
      expect(initial('juan')).toBe('J')
    })

    it('maneja null', () => {
      expect(initial(null)).toBe('?')
    })

    it('maneja string vacío', () => {
      expect(initial('')).toBe('?')
    })
  })

  describe('ageMinutes', () => {
    it('retorna null para null', () => {
      expect(ageMinutes(null)).toBeNull()
    })

    it('retorna null para fecha inválida', () => {
      expect(ageMinutes('invalid')).toBeNull()
    })

    it('calcula minutos correctamente', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
      expect(ageMinutes(fiveMinAgo)).toBe(5)
    })
  })

  describe('ageLabel', () => {
    it('retorna "sin dato" para null', () => {
      expect(ageLabel(null)).toBe('sin dato')
    })

    it('retorna "ahora mismo" para fecha reciente', () => {
      const now = new Date().toISOString()
      expect(ageLabel(now)).toBe('ahora mismo')
    })

    it('retorna "hace X min" para minutos', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
      expect(ageLabel(fiveMinAgo)).toBe('hace 5 min')
    })

    it('retorna "hace X h" para horas', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()
      expect(ageLabel(twoHoursAgo)).toBe('hace 2 h')
    })
  })

  describe('resultLabel', () => {
    it('mapea riega', () => {
      expect(resultLabel('riega')).toBe('Regar')
    })

    it('mapea no', () => {
      expect(resultLabel('no')).toBe('Todo bien')
    })

    it('mapea espera', () => {
      expect(resultLabel('espera')).toBe('Esperar')
    })

    it('mapea incompleta', () => {
      expect(resultLabel('incompleta')).toBe('Revisar datos')
    })

    it('retorna "—" para null', () => {
      expect(resultLabel(null)).toBe('—')
    })

    it('retorna valor original para desconocido', () => {
      expect(resultLabel('desconocido')).toBe('desconocido')
    })
  })

  describe('badgeToneForResult', () => {
    it('retorna "critica" para critical=true', () => {
      expect(badgeToneForResult('riega', true)).toBe('critica')
    })

    it('retorna "riega" para result=riega', () => {
      expect(badgeToneForResult('riega', false)).toBe('riega')
    })

    it('retorna "no" para result=no', () => {
      expect(badgeToneForResult('no', false)).toBe('no')
    })

    it('retorna "espera" para result=espera', () => {
      expect(badgeToneForResult('espera', false)).toBe('espera')
    })

    it('retorna "incompleta" para result=incompleta', () => {
      expect(badgeToneForResult('incompleta', false)).toBe('incompleta')
    })
  })

  describe('nowLocalInput', () => {
    it('retorna formato datetime-local', () => {
      const result = nowLocalInput()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })
  })

  describe('localInputToIso', () => {
    it('convierte datetime-local a ISO', () => {
      const result = localInputToIso('2026-09-28T10:30')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
    })

    it('retorna ISO para string vacío', () => {
      const result = localInputToIso('')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('todayInput', () => {
    it('retorna formato YYYY-MM-DD', () => {
      const result = todayInput()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
