import {
  generateOptimizedKey,
  isPrizeImage,
  validateSqsRecord
} from '../lib/event-validator.js'

describe('Validación de registro SQS', () => {
  describe('cuando el registro es válido', () => {
    it('debería extraer bucket y key de un evento S3', () => {
      const record = {
        body: JSON.stringify({
          bucket: { name: 'mi-bucket' },
          object: { key: 'prizes/foto.jpg' }
        })
      }

      const resultado = validateSqsRecord(record)

      expect(resultado.valid).toBe(true)
      expect(resultado.s3Event.bucketName).toBe('mi-bucket')
      expect(resultado.s3Event.objectKey).toBe('prizes/foto.jpg')
      expect(resultado.error).toBeNull()
    })

    it('debería extraer de evento con wrapper detail', () => {
      const record = {
        body: JSON.stringify({
          detail: {
            bucket: { name: 'otro-bucket' },
            object: { key: 'prizes/imagen.png' }
          }
        })
      }

      const resultado = validateSqsRecord(record)

      expect(resultado.valid).toBe(true)
      expect(resultado.s3Event.bucketName).toBe('otro-bucket')
    })
  })

  describe('cuando el registro es inválido', () => {
    it('debería rechazar si falta bucket name', () => {
      const record = {
        body: JSON.stringify({
          object: { key: 'foto.jpg' }
        })
      }

      const resultado = validateSqsRecord(record)

      expect(resultado.valid).toBe(false)
      expect(resultado.error).toContain('Missing bucket')
    })

    it('debería rechazar si falta object key', () => {
      const record = {
        body: JSON.stringify({
          bucket: { name: 'bucket' }
        })
      }

      const resultado = validateSqsRecord(record)

      expect(resultado.valid).toBe(false)
      expect(resultado.error).toContain('Missing')
    })

    it('debería rechazar si el body no es JSON válido', () => {
      const record = { body: 'no es json', messageId: '123' }

      const resultado = validateSqsRecord(record)

      expect(resultado.valid).toBe(false)
      expect(resultado.error).toContain('Invalid JSON')
    })
  })
})

describe('Verificación de imagen de premio', () => {
  it('debería retornar true para imágenes en carpeta prizes/', () => {
    expect(isPrizeImage('prizes/foto.jpg')).toBe(true)
    expect(isPrizeImage('prizes/subcarpeta/imagen.png')).toBe(true)
  })

  it('debería retornar false para otras rutas', () => {
    expect(isPrizeImage('optimized/foto.webp')).toBe(false)
    expect(isPrizeImage('avatars/user.jpg')).toBe(false)
    expect(isPrizeImage('foto.jpg')).toBe(false)
  })
})

describe('Generación de clave para imagen optimizada', () => {
  it('debería convertir ruta de prizes/ a optimized/ con extensión webp', () => {
    expect(generateOptimizedKey('prizes/foto.jpg')).toBe('optimized/foto.webp')
  })

  it('debería eliminar la extensión original y agregar .webp', () => {
    expect(generateOptimizedKey('prizes/imagen.png')).toBe(
      'optimized/imagen.webp'
    )
    expect(generateOptimizedKey('prizes/banner.jpeg')).toBe(
      'optimized/banner.webp'
    )
  })

  it('debería manejar archivos en subcarpetas', () => {
    expect(generateOptimizedKey('prizes/2024/enero/foto.gif')).toBe(
      'optimized/foto.webp'
    )
  })
})
