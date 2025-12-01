import { formatCurrency, formatDate } from '../lib/utils.js'

describe('Formateo de moneda (PEN)', () => {
  it('debería formatear números con 2 decimales', () => {
    expect(formatCurrency(1000)).toBe('1,000.00')
  })

  it('debería formatear valores decimales', () => {
    expect(formatCurrency(1234.56)).toBe('1,234.56')
  })

  it('debería retornar "0.00" para valores falsy', () => {
    expect(formatCurrency(null)).toBe('0.00')
    expect(formatCurrency(undefined)).toBe('0.00')
    expect(formatCurrency(0)).toBe('0.00')
  })

  it('debería formatear valores grandes con separador de miles', () => {
    expect(formatCurrency(1000000)).toBe('1,000,000.00')
  })
})

describe('Formateo de fecha en español (Perú)', () => {
  it('debería formatear fecha en formato largo en español', () => {
    const resultado = formatDate('2024-06-15T12:00:00Z')

    expect(resultado).toContain('2024')
    expect(resultado).toContain('15')
  })

  it('debería retornar cadena vacía para valores falsy', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDate('')).toBe('')
  })
})
