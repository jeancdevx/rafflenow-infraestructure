import {
  validateRaffleId,
  ensureRaffleExists,
  ensureRaffleIsActive,
  ensureRaffleNotExpired,
  ensureNoDuplicateParticipation,
  ensureRaffleHasCapacity
} from '../lib/validators/business-rules.js'

describe('Validación del ID de rifa', () => {
  it('debería retornar el ID cuando existe', () => {
    const evento = { pathParameters: { id: 'rifa-xyz' } }

    expect(validateRaffleId(evento)).toBe('rifa-xyz')
  })

  it('debería lanzar ValidationError si falta el ID', () => {
    expect(() => validateRaffleId({})).toThrow('Missing raffle_id')
  })
})

describe('Verificación de existencia de rifa', () => {
  it('debería permitir si la rifa existe', () => {
    const rifa = { raffle_id: '123', title: 'Test' }

    expect(() => ensureRaffleExists(rifa)).not.toThrow()
  })

  it('debería lanzar NotFoundError si la rifa es null', () => {
    expect(() => ensureRaffleExists(null)).toThrow('not found')
  })

  it('debería lanzar NotFoundError si la rifa es undefined', () => {
    expect(() => ensureRaffleExists(undefined)).toThrow('not found')
  })
})

describe('Verificación de estado activo', () => {
  it('debería permitir si la rifa está activa', () => {
    const rifa = { status: 'active' }

    expect(() => ensureRaffleIsActive(rifa)).not.toThrow()
  })

  it('debería rechazar si la rifa está cerrada', () => {
    const rifa = { status: 'closed' }

    expect(() => ensureRaffleIsActive(rifa)).toThrow('not active')
  })
})

describe('Verificación de expiración de rifa', () => {
  it('debería permitir si la rifa no ha expirado', () => {
    const rifa = { end_date: new Date(Date.now() + 86400000).toISOString() }

    expect(() => ensureRaffleNotExpired(rifa)).not.toThrow()
  })

  it('debería rechazar si la rifa ya expiró', () => {
    const rifa = { end_date: '2020-01-01T23:59:00Z' }

    expect(() => ensureRaffleNotExpired(rifa)).toThrow('has ended')
  })
})

describe('Verificación de participación duplicada', () => {
  it('debería permitir si el usuario no ha participado', () => {
    expect(() => ensureNoDuplicateParticipation(false)).not.toThrow()
  })

  it('debería rechazar si el usuario ya participó', () => {
    expect(() => ensureNoDuplicateParticipation(true)).toThrow(
      'already participated'
    )
  })
})

describe('Verificación de capacidad de la rifa', () => {
  it('debería permitir si hay capacidad disponible', () => {
    const rifa = { current_participants: 50, max_participants: 100 }

    expect(() => ensureRaffleHasCapacity(rifa)).not.toThrow()
  })

  it('debería rechazar si la rifa está llena', () => {
    const rifa = { current_participants: 100, max_participants: 100 }

    expect(() => ensureRaffleHasCapacity(rifa)).toThrow('maximum capacity')
  })

  it('debería rechazar si hay más participantes que el máximo', () => {
    const rifa = { current_participants: 150, max_participants: 100 }

    expect(() => ensureRaffleHasCapacity(rifa)).toThrow('maximum capacity')
  })

  it('debería tratar current_participants undefined como 0', () => {
    const rifa = { max_participants: 100 }

    expect(() => ensureRaffleHasCapacity(rifa)).not.toThrow()
  })
})
