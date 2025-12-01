import {
  validateRaffleId,
  calculateParticipationPercentage,
  calculateDaysRemaining
} from '../lib/validators/raffle-validator.js'

describe('Validación del ID de rifa', () => {
  describe('cuando el ID existe', () => {
    it('debería retornar el ID desde pathParameters', () => {
      const evento = { pathParameters: { id: 'rifa-123-abc' } }

      expect(validateRaffleId(evento)).toBe('rifa-123-abc')
    })
  })

  describe('cuando el ID no existe', () => {
    it('debería lanzar ValidationError si no hay pathParameters', () => {
      const evento = {}

      expect(() => validateRaffleId(evento)).toThrow('raffle_id is required')
    })

    it('debería lanzar ValidationError si id es undefined', () => {
      const evento = { pathParameters: {} }

      expect(() => validateRaffleId(evento)).toThrow('raffle_id is required')
    })

    it('debería lanzar ValidationError si pathParameters es null', () => {
      const evento = { pathParameters: null }

      expect(() => validateRaffleId(evento)).toThrow('raffle_id is required')
    })
  })
})

describe('Cálculo de porcentaje de participación', () => {
  it('debería calcular 50% cuando hay 500 de 1000 participantes', () => {
    expect(calculateParticipationPercentage(500, 1000)).toBe(50)
  })

  it('debería calcular 100% cuando está lleno', () => {
    expect(calculateParticipationPercentage(1000, 1000)).toBe(100)
  })

  it('debería retornar 0 cuando no hay participantes', () => {
    expect(calculateParticipationPercentage(0, 1000)).toBe(0)
  })

  it('debería retornar 0 cuando maxParticipants es 0', () => {
    expect(calculateParticipationPercentage(100, 0)).toBe(0)
  })

  it('debería retornar 0 cuando maxParticipants es null', () => {
    expect(calculateParticipationPercentage(100, null)).toBe(0)
  })

  it('debería redondear a 2 decimales', () => {
    expect(calculateParticipationPercentage(1, 3)).toBe(33.33)
  })

  it('debería manejar porcentajes mayores a 100 (sobreventa)', () => {
    expect(calculateParticipationPercentage(1200, 1000)).toBe(120)
  })
})

describe('Cálculo de días restantes', () => {
  it('debería retornar días positivos para fecha futura', () => {
    const ahora = new Date()
    const enDiezDias = new Date(ahora.getTime() + 10 * 24 * 60 * 60 * 1000)

    const dias = calculateDaysRemaining(enDiezDias.toISOString())

    expect(dias).toBeGreaterThanOrEqual(10)
    expect(dias).toBeLessThanOrEqual(11)
  })

  it('debería retornar 0 si la fecha ya pasó', () => {
    const fechaPasada = '2020-01-01T23:59:00Z'

    expect(calculateDaysRemaining(fechaPasada)).toBe(0)
  })

  it('debería retornar 0 si endDate es null', () => {
    expect(calculateDaysRemaining(null)).toBe(0)
  })

  it('debería retornar 0 si endDate es undefined', () => {
    expect(calculateDaysRemaining(undefined)).toBe(0)
  })

  it('debería redondear hacia arriba (horas parciales cuentan como día)', () => {
    const ahora = new Date()
    const enUnaHora = new Date(ahora.getTime() + 60 * 60 * 1000)

    expect(calculateDaysRemaining(enUnaHora.toISOString())).toBe(1)
  })
})
