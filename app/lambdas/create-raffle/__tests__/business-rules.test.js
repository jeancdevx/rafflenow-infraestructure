import {
  validateTitle,
  validateDescription,
  validatePrizeImages,
  validatePrizeValue,
  calculateCategory,
  calculateDefaultDuration,
  calculateMaxParticipants,
  calculateEndDate,
  validateRequiredFields
} from '../lib/validators/business-rules.js'
import { ValidationError } from '../lib/errors.js'

describe('Validaciones de Título', () => {
  describe('validateTitle', () => {
    it('debería aceptar un título válido entre 10 y 200 caracteres', () => {
      const tituloValido = 'Sorteo de iPhone 15 Pro Max'
      expect(() => validateTitle(tituloValido)).not.toThrow()
    })

    it('debería rechazar un título con menos de 10 caracteres', () => {
      const tituloCorto = 'Sorteo'
      expect(() => validateTitle(tituloCorto)).toThrow(ValidationError)
      expect(() => validateTitle(tituloCorto)).toThrow(
        'Title must be at least 10 characters'
      )
    })

    it('debería rechazar un título con más de 200 caracteres', () => {
      const tituloLargo = 'A'.repeat(201)
      expect(() => validateTitle(tituloLargo)).toThrow(ValidationError)
      expect(() => validateTitle(tituloLargo)).toThrow(
        'Title cannot exceed 200 characters'
      )
    })

    it('debería rechazar un título que no sea string', () => {
      const tituloInvalido = 12345
      expect(() => validateTitle(tituloInvalido)).toThrow(ValidationError)
      expect(() => validateTitle(tituloInvalido)).toThrow(
        'Title must be a string'
      )
    })

    it('debería considerar espacios en blanco al validar longitud', () => {
      const tituloConEspacios = '   Sorteo   '
      expect(() => validateTitle(tituloConEspacios)).toThrow(ValidationError)
    })
  })
})

describe('Validaciones de Descripción', () => {
  describe('validateDescription', () => {
    it('debería aceptar una descripción válida entre 50 y 2000 caracteres', () => {
      const descripcionValida =
        'Esta es una descripción válida del sorteo con más de 50 caracteres para pasar la validación correctamente.'
      expect(() => validateDescription(descripcionValida)).not.toThrow()
    })

    it('debería rechazar una descripción con menos de 50 caracteres', () => {
      const descripcionCorta = 'Descripción muy corta'
      expect(() => validateDescription(descripcionCorta)).toThrow(
        ValidationError
      )
      expect(() => validateDescription(descripcionCorta)).toThrow(
        'Description must be at least 50 characters'
      )
    })

    it('debería rechazar una descripción con más de 2000 caracteres', () => {
      const descripcionLarga = 'A'.repeat(2001)
      expect(() => validateDescription(descripcionLarga)).toThrow(
        ValidationError
      )
      expect(() => validateDescription(descripcionLarga)).toThrow(
        'Description cannot exceed 2000 characters'
      )
    })

    it('debería rechazar una descripción que no sea string', () => {
      const descripcionInvalida = { texto: 'descripcion' }
      expect(() => validateDescription(descripcionInvalida)).toThrow(
        ValidationError
      )
    })
  })
})

describe('Validaciones de Imágenes del Premio', () => {
  describe('validatePrizeImages', () => {
    it('debería aceptar un array de 1 a 5 URLs válidas', () => {
      const imagenesValidas = [
        'https://cdn.rafflenow.pe/prizes/img1.webp',
        'https://cdn.rafflenow.pe/prizes/img2.webp'
      ]
      expect(() => validatePrizeImages(imagenesValidas)).not.toThrow()
    })

    it('debería rechazar un array vacío', () => {
      const sinImagenes = []
      expect(() => validatePrizeImages(sinImagenes)).toThrow(ValidationError)
      expect(() => validatePrizeImages(sinImagenes)).toThrow(
        'At least 1 prize image is required'
      )
    })

    it('debería rechazar más de 5 imágenes', () => {
      const muchasImagenes = [
        'https://cdn.rafflenow.pe/1.webp',
        'https://cdn.rafflenow.pe/2.webp',
        'https://cdn.rafflenow.pe/3.webp',
        'https://cdn.rafflenow.pe/4.webp',
        'https://cdn.rafflenow.pe/5.webp',
        'https://cdn.rafflenow.pe/6.webp'
      ]
      expect(() => validatePrizeImages(muchasImagenes)).toThrow(ValidationError)
      expect(() => validatePrizeImages(muchasImagenes)).toThrow(
        'Cannot exceed 5 prize images'
      )
    })

    it('debería rechazar si no es un array', () => {
      const noEsArray = 'https://cdn.rafflenow.pe/imagen.webp'
      expect(() => validatePrizeImages(noEsArray)).toThrow(ValidationError)
    })

    it('debería rechazar URLs vacías o inválidas', () => {
      const urlsInvalidas = ['https://cdn.rafflenow.pe/valid.webp', '', '   ']
      expect(() => validatePrizeImages(urlsInvalidas)).toThrow(ValidationError)
      expect(() => validatePrizeImages(urlsInvalidas)).toThrow(
        'All prize images must be valid URL strings'
      )
    })
  })
})

describe('Validaciones de Valor del Premio', () => {
  describe('validatePrizeValue', () => {
    it('debería aceptar un valor entre S/100 y S/3,000,000', () => {
      const valorValido = 5000
      const resultado = validatePrizeValue(valorValido)
      expect(resultado).toBe(5000)
    })

    it('debería rechazar un valor menor a S/100', () => {
      const valorMuyBajo = 50
      expect(() => validatePrizeValue(valorMuyBajo)).toThrow(ValidationError)
      expect(() => validatePrizeValue(valorMuyBajo)).toThrow(
        'prize_value must be at least 100'
      )
    })

    it('debería rechazar un valor mayor a S/3,000,000', () => {
      const valorMuyAlto = 5000000
      expect(() => validatePrizeValue(valorMuyAlto)).toThrow(ValidationError)
      expect(() => validatePrizeValue(valorMuyAlto)).toThrow(
        'prize_value cannot exceed 3,000,000'
      )
    })

    it('debería rechazar valores no numéricos', () => {
      const valorNoNumerico = '5000'
      expect(() => validatePrizeValue(valorNoNumerico)).toThrow(ValidationError)
      expect(() => validatePrizeValue(valorNoNumerico)).toThrow(
        'prize_value must be a positive number'
      )
    })

    it('debería rechazar valores negativos', () => {
      const valorNegativo = -1000
      expect(() => validatePrizeValue(valorNegativo)).toThrow(ValidationError)
    })
  })
})

describe('Cálculo de Categoría del Sorteo', () => {
  describe('calculateCategory', () => {
    it('debería retornar "pequeño" para premios entre S/100 y S/499', () => {
      expect(calculateCategory(100)).toBe('pequeño')
      expect(calculateCategory(250)).toBe('pequeño')
      expect(calculateCategory(499)).toBe('pequeño')
    })

    it('debería retornar "mediano" para premios entre S/500 y S/4,999', () => {
      expect(calculateCategory(500)).toBe('mediano')
      expect(calculateCategory(2500)).toBe('mediano')
      expect(calculateCategory(4999)).toBe('mediano')
    })

    it('debería retornar "grande" para premios entre S/5,000 y S/49,999', () => {
      expect(calculateCategory(5000)).toBe('grande')
      expect(calculateCategory(25000)).toBe('grande')
      expect(calculateCategory(49999)).toBe('grande')
    })

    it('debería retornar "premium" para premios de S/50,000 o más', () => {
      expect(calculateCategory(50000)).toBe('premium')
      expect(calculateCategory(150000)).toBe('premium')
      expect(calculateCategory(3000000)).toBe('premium')
    })
  })
})

describe('Cálculo de Duración por Defecto', () => {
  describe('calculateDefaultDuration', () => {
    it('debería retornar 7 días para sorteos pequeños', () => {
      const valorPequeno = 300
      const duracion = calculateDefaultDuration(valorPequeno)
      expect(duracion).toBe(7)
    })

    it('debería retornar 14 días para sorteos medianos', () => {
      const valorMediano = 2000
      const duracion = calculateDefaultDuration(valorMediano)
      expect(duracion).toBe(14)
    })

    it('debería retornar 30 días para sorteos grandes', () => {
      const valorGrande = 15000
      const duracion = calculateDefaultDuration(valorGrande)
      expect(duracion).toBe(30)
    })

    it('debería retornar 60 días para sorteos premium', () => {
      const valorPremium = 100000
      const duracion = calculateDefaultDuration(valorPremium)
      expect(duracion).toBe(60)
    })
  })
})

describe('Cálculo de Participantes Máximos', () => {
  describe('calculateMaxParticipants', () => {
    it('debería calcular 3,600 participantes para sorteo pequeño (3,000 + 20%)', () => {
      const valorPequeno = 300
      const maxParticipantes = calculateMaxParticipants(valorPequeno)
      expect(maxParticipantes).toBe(3600)
    })

    it('debería calcular 60,000 participantes para sorteo mediano (50,000 + 20%)', () => {
      const valorMediano = 2000
      const maxParticipantes = calculateMaxParticipants(valorMediano)
      expect(maxParticipantes).toBe(60000)
    })

    it('debería calcular 300,000 participantes para sorteo grande (250,000 + 20%)', () => {
      const valorGrande = 15000
      const maxParticipantes = calculateMaxParticipants(valorGrande)
      expect(maxParticipantes).toBe(300000)
    })

    it('debería calcular 1,800,000 participantes para sorteo premium (1,500,000 + 20%)', () => {
      const valorPremium = 100000
      const maxParticipantes = calculateMaxParticipants(valorPremium)
      expect(maxParticipantes).toBe(1800000)
    })
  })
})

describe('Cálculo de Fecha de Finalización', () => {
  describe('calculateEndDate', () => {
    it('debería calcular fecha de fin a 7 días para sorteo pequeño', () => {
      const fechaInicio = new Date('2025-01-01T10:00:00Z')
      const valorPequeno = 300
      const fechaFin = calculateEndDate(fechaInicio, valorPequeno)
      expect(fechaFin.getUTCDate()).toBe(8)
      expect(fechaFin.getUTCHours()).toBe(23)
      expect(fechaFin.getUTCMinutes()).toBe(59)
    })

    it('debería calcular fecha de fin a 14 días para sorteo mediano', () => {
      const fechaInicio = new Date('2025-01-01T10:00:00Z')
      const valorMediano = 2000
      const fechaFin = calculateEndDate(fechaInicio, valorMediano)
      expect(fechaFin.getUTCDate()).toBe(15)
    })

    it('debería siempre establecer la hora a 23:59:00 UTC', () => {
      const fechaInicio = new Date('2025-01-15T08:30:00Z')
      const valorPremio = 5000
      const fechaFin = calculateEndDate(fechaInicio, valorPremio)
      expect(fechaFin.getUTCHours()).toBe(23)
      expect(fechaFin.getUTCMinutes()).toBe(59)
      expect(fechaFin.getUTCSeconds()).toBe(0)
    })

    it('debería rechazar duraciones menores a 7 días', () => {
      const fechaInicio = new Date('2025-01-01T10:00:00Z')
      const valorPremio = 1000
      const duracionInvalida = 5
      expect(() =>
        calculateEndDate(fechaInicio, valorPremio, duracionInvalida)
      ).toThrow(ValidationError)
    })

    it('debería rechazar duraciones mayores a 60 días', () => {
      const fechaInicio = new Date('2025-01-01T10:00:00Z')
      const valorPremio = 1000
      const duracionInvalida = 90
      expect(() =>
        calculateEndDate(fechaInicio, valorPremio, duracionInvalida)
      ).toThrow(ValidationError)
    })
  })
})

describe('Validación de Campos Requeridos', () => {
  describe('validateRequiredFields', () => {
    it('debería pasar cuando todos los campos requeridos están presentes', () => {
      const bodyCompleto = {
        title: 'Sorteo Test',
        description: 'Descripción del sorteo',
        prize_value: 1000,
        prize_images: ['https://cdn.rafflenow.pe/img.webp']
      }
      expect(() => validateRequiredFields(bodyCompleto)).not.toThrow()
    })

    it('debería lanzar error cuando falta el título', () => {
      const sinTitulo = {
        description: 'Descripción',
        prize_value: 1000,
        prize_images: ['https://cdn.rafflenow.pe/img.webp']
      }
      expect(() => validateRequiredFields(sinTitulo)).toThrow(ValidationError)
      expect(() => validateRequiredFields(sinTitulo)).toThrow(
        'Missing required field: title'
      )
    })

    it('debería lanzar error cuando falta la descripción', () => {
      const sinDescripcion = {
        title: 'Sorteo',
        prize_value: 1000,
        prize_images: ['https://cdn.rafflenow.pe/img.webp']
      }
      expect(() => validateRequiredFields(sinDescripcion)).toThrow(
        ValidationError
      )
      expect(() => validateRequiredFields(sinDescripcion)).toThrow(
        'Missing required field: description'
      )
    })

    it('debería lanzar error cuando falta el valor del premio', () => {
      const sinPrizeValue = {
        title: 'Sorteo',
        description: 'Descripción',
        prize_images: ['https://cdn.rafflenow.pe/img.webp']
      }
      expect(() => validateRequiredFields(sinPrizeValue)).toThrow(
        ValidationError
      )
      expect(() => validateRequiredFields(sinPrizeValue)).toThrow(
        'Missing required field: prize_value'
      )
    })

    it('debería lanzar error cuando faltan las imágenes', () => {
      const sinImagenes = {
        title: 'Sorteo',
        description: 'Descripción',
        prize_value: 1000
      }
      expect(() => validateRequiredFields(sinImagenes)).toThrow(ValidationError)
      expect(() => validateRequiredFields(sinImagenes)).toThrow(
        'Missing required field: prize_images'
      )
    })
  })
})
