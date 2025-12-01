import {
  extractClaims,
  ensureIsAdmin,
  getUserEmail
} from '../lib/validators/auth.js'

describe('Extracción de claims del evento', () => {
  describe('cuando los claims existen', () => {
    it('debería retornar los claims del authorizer', () => {
      const evento = {
        requestContext: {
          authorizer: {
            claims: { sub: '123', email: 'test@example.com' }
          }
        }
      }

      const claims = extractClaims(evento)

      expect(claims.sub).toBe('123')
      expect(claims.email).toBe('test@example.com')
    })
  })

  describe('cuando los claims no existen', () => {
    it('debería lanzar UnauthorizedError si no hay authorizer', () => {
      const evento = { requestContext: {} }

      expect(() => extractClaims(evento)).toThrow('Authentication required')
    })

    it('debería lanzar UnauthorizedError si no hay requestContext', () => {
      const evento = {}

      expect(() => extractClaims(evento)).toThrow('Authentication required')
    })

    it('debería lanzar UnauthorizedError si claims es null', () => {
      const evento = { requestContext: { authorizer: { claims: null } } }

      expect(() => extractClaims(evento)).toThrow('Authentication required')
    })
  })
})

describe('Verificación de rol de administrador', () => {
  describe('cuando el usuario es administrador', () => {
    it('debería permitir si cognito:groups es string "Admin"', () => {
      const claims = { 'cognito:groups': 'Admin' }

      expect(() => ensureIsAdmin(claims)).not.toThrow()
    })

    it('debería permitir si cognito:groups es array que incluye "Admin"', () => {
      const claims = { 'cognito:groups': ['User', 'Admin'] }

      expect(() => ensureIsAdmin(claims)).not.toThrow()
    })
  })

  describe('cuando el usuario no es administrador', () => {
    it('debería rechazar si no hay cognito:groups', () => {
      const claims = { sub: '123' }

      expect(() => ensureIsAdmin(claims)).toThrow('Admin role required')
    })

    it('debería rechazar si el grupo no es Admin', () => {
      const claims = { 'cognito:groups': 'User' }

      expect(() => ensureIsAdmin(claims)).toThrow('Admin role required')
    })

    it('debería rechazar si el array no incluye Admin', () => {
      const claims = { 'cognito:groups': ['User', 'Guest'] }

      expect(() => ensureIsAdmin(claims)).toThrow('Admin role required')
    })

    it('debería rechazar si claims es null', () => {
      expect(() => ensureIsAdmin(null)).toThrow('Admin role required')
    })
  })
})

describe('Obtención de email del usuario', () => {
  it('debería retornar el email cuando existe', () => {
    const claims = { email: 'admin@rafflenow.es' }

    expect(getUserEmail(claims)).toBe('admin@rafflenow.es')
  })

  it('debería retornar "unknown" cuando no hay email', () => {
    const claims = { sub: '123' }

    expect(getUserEmail(claims)).toBe('unknown')
  })

  it('debería retornar "unknown" cuando claims es null', () => {
    expect(getUserEmail(null)).toBe('unknown')
  })
})
