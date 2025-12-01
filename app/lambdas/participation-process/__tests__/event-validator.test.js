import { validateEventDetail } from '../lib/validators/event-validator.js'

describe('Validación del detalle del evento de participación', () => {
  const eventoValido = {
    raffle_id: 'rifa-123',
    participant_email: 'test@example.com',
    participant_name: 'Juan Pérez',
    user_id: 'user-abc',
    correlation_id: 'corr-xyz'
  }

  describe('cuando el evento es válido', () => {
    it('debería retornar los datos parseados', () => {
      const resultado = validateEventDetail(eventoValido)

      expect(resultado.raffleId).toBe('rifa-123')
      expect(resultado.participantEmail).toBe('test@example.com')
      expect(resultado.participantName).toBe('Juan Pérez')
      expect(resultado.userId).toBe('user-abc')
      expect(resultado.correlationId).toBe('corr-xyz')
    })

    it('debería convertir email a minúsculas', () => {
      const evento = { ...eventoValido, participant_email: 'TEST@EXAMPLE.COM' }

      const resultado = validateEventDetail(evento)

      expect(resultado.participantEmail).toBe('test@example.com')
    })

    it('debería usar fecha actual si participated_at no existe', () => {
      const resultado = validateEventDetail(eventoValido)

      expect(resultado.participatedAt).toBeDefined()
      expect(new Date(resultado.participatedAt)).toBeInstanceOf(Date)
    })

    it('debería usar participated_at si existe', () => {
      const fechaEspecifica = '2024-06-15T12:00:00Z'
      const evento = { ...eventoValido, participated_at: fechaEspecifica }

      const resultado = validateEventDetail(evento)

      expect(resultado.participatedAt).toBe(fechaEspecifica)
    })
  })

  describe('cuando faltan campos requeridos', () => {
    it('debería rechazar si falta raffle_id', () => {
      const evento = { ...eventoValido, raffle_id: undefined }

      expect(() => validateEventDetail(evento)).toThrow('Missing raffle_id')
    })

    it('debería rechazar si falta participant_email', () => {
      const evento = { ...eventoValido, participant_email: undefined }

      expect(() => validateEventDetail(evento)).toThrow(
        'Missing participant_email'
      )
    })

    it('debería rechazar si falta participant_name', () => {
      const evento = { ...eventoValido, participant_name: undefined }

      expect(() => validateEventDetail(evento)).toThrow(
        'Missing participant_name'
      )
    })

    it('debería rechazar si falta user_id', () => {
      const evento = { ...eventoValido, user_id: undefined }

      expect(() => validateEventDetail(evento)).toThrow('Missing user_id')
    })
  })
})
