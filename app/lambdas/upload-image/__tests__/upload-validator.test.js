import { validateUploadRequest } from '../lib/validators/upload-validator.js'

describe('Validación de solicitud de carga de imagen', () => {
  describe('cuando la solicitud es válida', () => {
    it('debería aceptar JPEG', () => {
      const body = { fileName: 'foto.jpg', fileType: 'image/jpeg' }

      const resultado = validateUploadRequest(body)

      expect(resultado.extension).toBe('jpg')
    })

    it('debería aceptar PNG', () => {
      const body = { fileName: 'imagen.png', fileType: 'image/png' }

      const resultado = validateUploadRequest(body)

      expect(resultado.extension).toBe('png')
    })

    it('debería aceptar WebP', () => {
      const body = { fileName: 'foto.webp', fileType: 'image/webp' }

      const resultado = validateUploadRequest(body)

      expect(resultado.extension).toBe('webp')
    })

    it('debería aceptar GIF', () => {
      const body = { fileName: 'animacion.gif', fileType: 'image/gif' }

      const resultado = validateUploadRequest(body)

      expect(resultado.extension).toBe('gif')
    })

    it('debería sanitizar caracteres especiales en el nombre', () => {
      const body = { fileName: 'mi foto (1).jpg', fileType: 'image/jpeg' }

      const resultado = validateUploadRequest(body)

      expect(resultado.sanitizedName).toBe('mi_foto__1_.jpg')
    })

    it('debería aceptar archivos dentro del límite de tamaño', () => {
      const body = {
        fileName: 'foto.jpg',
        fileType: 'image/jpeg',
        fileSize: 5 * 1024 * 1024 // 5MB
      }

      expect(() => validateUploadRequest(body)).not.toThrow()
    })
  })

  describe('cuando faltan campos requeridos', () => {
    it('debería rechazar si falta fileName', () => {
      const body = { fileType: 'image/jpeg' }

      expect(() => validateUploadRequest(body)).toThrow(
        'fileName and fileType are required'
      )
    })

    it('debería rechazar si falta fileType', () => {
      const body = { fileName: 'foto.jpg' }

      expect(() => validateUploadRequest(body)).toThrow(
        'fileName and fileType are required'
      )
    })
  })

  describe('cuando el tipo MIME es inválido', () => {
    it('debería rechazar PDF', () => {
      const body = { fileName: 'doc.pdf', fileType: 'application/pdf' }

      expect(() => validateUploadRequest(body)).toThrow('Invalid file type')
    })

    it('debería rechazar SVG', () => {
      const body = { fileName: 'icono.svg', fileType: 'image/svg+xml' }

      expect(() => validateUploadRequest(body)).toThrow('Invalid file type')
    })
  })

  describe('cuando la extensión es inválida', () => {
    it('debería rechazar archivo sin extensión válida', () => {
      const body = { fileName: 'archivo', fileType: 'image/jpeg' }

      expect(() => validateUploadRequest(body)).toThrow(
        'Invalid file extension'
      )
    })

    it('debería rechazar extensión no permitida', () => {
      const body = { fileName: 'imagen.bmp', fileType: 'image/bmp' }

      expect(() => validateUploadRequest(body)).toThrow('Invalid file')
    })
  })

  describe('cuando el archivo excede el tamaño máximo', () => {
    it('debería rechazar archivos mayores a 10MB', () => {
      const body = {
        fileName: 'foto.jpg',
        fileType: 'image/jpeg',
        fileSize: 25 * 1024 * 1024 // 25MB
      }

      expect(() => validateUploadRequest(body)).toThrow('exceeds maximum')
    })
  })

  describe('cuando los tipos de datos son incorrectos', () => {
    it('debería rechazar fileName que no sea string', () => {
      const body = { fileName: 123, fileType: 'image/jpeg' }

      expect(() => validateUploadRequest(body)).toThrow('must be strings')
    })

    it('debería rechazar fileType que no sea string', () => {
      const body = { fileName: 'foto.jpg', fileType: ['image/jpeg'] }

      expect(() => validateUploadRequest(body)).toThrow('must be strings')
    })
  })
})
