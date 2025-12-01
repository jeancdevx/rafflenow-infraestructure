import { buildPaginatedResponse } from '../lib/services/pagination-service.js'

describe('buildPaginatedResponse', () => {
  it('retorna respuesta con has_more false cuando no hay más items', () => {
    const items = [{ raffle_id: '1' }, { raffle_id: '2' }]

    const resultado = buildPaginatedResponse(items, null, 2)

    expect(resultado.raffles).toEqual(items)
    expect(resultado.count).toBe(2)
    expect(resultado.has_more).toBe(false)
    expect(resultado.next_cursor).toBeNull()
  })

  it('retorna respuesta con has_more true cuando hay más items', () => {
    const items = [{ raffle_id: '1' }]
    const lastKey = { raffle_id: '1', status: 'active' }

    const resultado = buildPaginatedResponse(items, lastKey, 5)

    expect(resultado.has_more).toBe(true)
    expect(resultado.next_cursor).not.toBeNull()
    expect(resultado.scanned_count).toBe(5)
  })

  it('retorna count correcto basado en items', () => {
    const items = [{ raffle_id: '1' }, { raffle_id: '2' }, { raffle_id: '3' }]

    const resultado = buildPaginatedResponse(items, null, 3)

    expect(resultado.count).toBe(3)
  })

  it('retorna lista vacía cuando no hay items', () => {
    const resultado = buildPaginatedResponse([], null, 0)

    expect(resultado.raffles).toEqual([])
    expect(resultado.count).toBe(0)
    expect(resultado.has_more).toBe(false)
  })

  it('incluye scanned_count en la respuesta', () => {
    const items = [{ raffle_id: '1' }]

    const resultado = buildPaginatedResponse(items, null, 10)

    expect(resultado.scanned_count).toBe(10)
  })
})
