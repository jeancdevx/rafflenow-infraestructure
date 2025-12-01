import {
  validateLimit,
  decodeCursor,
  encodeCursor
} from '../lib/validators/pagination-validator.js'
import { ValidationError } from '../lib/errors.js'

describe('validateLimit', () => {
  it('debería retornar 20 por defecto si no se proporciona límite', () => {
    expect(validateLimit(undefined)).toBe(20)
    expect(validateLimit(null)).toBe(20)
  })

  it('debería parsear y retornar el límite cuando es un número válido', () => {
    expect(validateLimit('1')).toBe(1)
    expect(validateLimit('50')).toBe(50)
    expect(validateLimit('100')).toBe(100)
  })

  it('debería lanzar ValidationError si el límite es negativo', () => {
    expect(() => validateLimit('-5')).toThrow(ValidationError)
  })

  it('debería lanzar ValidationError si el límite es cero', () => {
    expect(() => validateLimit('0')).toThrow(ValidationError)
  })

  it('debería lanzar ValidationError si el límite no es numérico', () => {
    expect(() => validateLimit('abc')).toThrow(ValidationError)
  })

  it('debería lanzar ValidationError si el límite excede 100', () => {
    expect(() => validateLimit('101')).toThrow(ValidationError)
    expect(() => validateLimit('500')).toThrow(ValidationError)
  })
})

describe('encodeCursor', () => {
  it('debería retornar null si no hay clave de paginación', () => {
    expect(encodeCursor(null)).toBeNull()
    expect(encodeCursor(undefined)).toBeNull()
  })

  it('debería codificar el objeto en base64', () => {
    const clave = { raffle_id: '123', status: 'active' }
    const cursorCodificado = encodeCursor(clave)

    const decodificado = JSON.parse(
      Buffer.from(cursorCodificado, 'base64').toString('utf-8')
    )
    expect(decodificado).toEqual(clave)
  })
})

describe('decodeCursor', () => {
  it('debería retornar null si no hay cursor', () => {
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor(undefined)).toBeNull()
    expect(decodeCursor('')).toBeNull()
  })

  it('debería decodificar correctamente un cursor válido en base64', () => {
    const claveOriginal = { raffle_id: '456', status: 'closed' }
    const cursor = Buffer.from(JSON.stringify(claveOriginal)).toString('base64')

    expect(decodeCursor(cursor)).toEqual(claveOriginal)
  })

  it('debería lanzar ValidationError si el cursor no es base64 válido', () => {
    expect(() => decodeCursor('!!!invalid!!!')).toThrow(ValidationError)
  })

  it('debería lanzar ValidationError si el contenido decodificado no es JSON', () => {
    const cursorInvalido = Buffer.from('no es json').toString('base64')
    expect(() => decodeCursor(cursorInvalido)).toThrow(ValidationError)
  })
})

describe('encodeCursor y decodeCursor', () => {
  it('deberían ser operaciones inversas que mantienen la integridad de los datos', () => {
    const claveOriginal = { raffle_id: 'abc-123', end_date: '2025-12-31' }

    const codificado = encodeCursor(claveOriginal)
    const decodificado = decodeCursor(codificado)

    expect(decodificado).toEqual(claveOriginal)
  })
})
