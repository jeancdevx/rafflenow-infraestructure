import {
  ensureRaffleIsActive,
  validateRaffleId
} from '../lib/validators/business-rules.js'

describe('Validación del ID de rifa', () => {
  it('debería retornar el ID cuando existe en pathParameters', () => {
    const evento = { pathParameters: { id: 'rifa-abc-123' } }

    expect(validateRaffleId(evento)).toBe('rifa-abc-123')
  })

  it('debería lanzar ValidationError si no hay pathParameters', () => {
    const evento = {}

    expect(() => validateRaffleId(evento)).toThrow('Missing raffle_id')
  })

  it('debería lanzar ValidationError si id es undefined', () => {
    const evento = { pathParameters: {} }

    expect(() => validateRaffleId(evento)).toThrow('Missing raffle_id')
  })
})

describe('Verificación de estado activo de la rifa', () => {
  it('debería permitir cerrar una rifa activa', () => {
    const rifa = { raffle_id: '123', status: 'active' }

    expect(() => ensureRaffleIsActive(rifa)).not.toThrow()
  })

  it('debería rechazar una rifa con estado "closed"', () => {
    const rifa = { raffle_id: '123', status: 'closed' }

    expect(() => ensureRaffleIsActive(rifa)).toThrow('not active')
  })

  it('debería rechazar una rifa con estado "processing"', () => {
    const rifa = { raffle_id: '123', status: 'processing' }

    expect(() => ensureRaffleIsActive(rifa)).toThrow('not active')
  })

  it('debería rechazar una rifa con estado "completed"', () => {
    const rifa = { raffle_id: '123', status: 'completed' }

    expect(() => ensureRaffleIsActive(rifa)).toThrow('not active')
  })
})
