import {
  validateTitle,
  validateDescription,
  validatePrizeValue,
  validatePrizeImages,
  validateDuration,
  calculateCategory,
  calculateMaxParticipants,
  calculateDefaultDuration
} from '../lib/validators/business-rules.js'

describe('Validación del título', () => {
  describe('cuando el título es válido', () => {
    it('debería aceptar un título de 10 caracteres (mínimo)', () => {
      expect(() => validateTitle('1234567890')).not.toThrow()
    })

    it('debería aceptar un título de 200 caracteres (máximo)', () => {
      const titulo = 'a'.repeat(200)
      expect(() => validateTitle(titulo)).not.toThrow()
    })
  })

  describe('cuando el título es inválido', () => {
    it('debería rechazar un título menor a 10 caracteres', () => {
      expect(() => validateTitle('corto')).toThrow('at least 10')
    })

    it('debería rechazar un título mayor a 200 caracteres', () => {
      const titulo = 'a'.repeat(201)
      expect(() => validateTitle(titulo)).toThrow('cannot exceed 200')
    })

    it('debería rechazar un título que no sea string', () => {
      expect(() => validateTitle(12345)).toThrow('must be a string')
    })

    it('debería rechazar espacios en blanco como título válido', () => {
      expect(() => validateTitle('         ')).toThrow('at least 10')
    })
  })
})

describe('Validación de la descripción', () => {
  describe('cuando la descripción es válida', () => {
    it('debería aceptar una descripción de 50 caracteres (mínimo)', () => {
      const descripcion = 'a'.repeat(50)
      expect(() => validateDescription(descripcion)).not.toThrow()
    })

    it('debería aceptar una descripción de 2000 caracteres (máximo)', () => {
      const descripcion = 'a'.repeat(2000)
      expect(() => validateDescription(descripcion)).not.toThrow()
    })
  })

  describe('cuando la descripción es inválida', () => {
    it('debería rechazar una descripción menor a 50 caracteres', () => {
      expect(() => validateDescription('muy corta')).toThrow('at least 50')
    })

    it('debería rechazar una descripción mayor a 2000 caracteres', () => {
      const descripcion = 'a'.repeat(2001)
      expect(() => validateDescription(descripcion)).toThrow(
        'cannot exceed 2000'
      )
    })

    it('debería rechazar una descripción que no sea string', () => {
      expect(() => validateDescription(['array'])).toThrow('must be a string')
    })
  })
})

describe('Validación del valor del premio', () => {
  describe('cuando el valor es válido', () => {
    it('debería aceptar el valor mínimo de 100', () => {
      expect(validatePrizeValue(100)).toBe(100)
    })

    it('debería aceptar el valor máximo de 3,000,000', () => {
      expect(validatePrizeValue(3000000)).toBe(3000000)
    })

    it('debería aceptar valores intermedios', () => {
      expect(validatePrizeValue(5000)).toBe(5000)
    })
  })

  describe('cuando el valor es inválido', () => {
    it('debería rechazar valores menores a 100', () => {
      expect(() => validatePrizeValue(99)).toThrow('at least 100')
    })

    it('debería rechazar valores mayores a 3,000,000', () => {
      expect(() => validatePrizeValue(3000001)).toThrow('cannot exceed')
    })

    it('debería rechazar valores negativos', () => {
      expect(() => validatePrizeValue(-100)).toThrow('positive number')
    })

    it('debería rechazar valores que no sean números', () => {
      expect(() => validatePrizeValue('1000')).toThrow('positive number')
    })

    it('debería rechazar cero', () => {
      expect(() => validatePrizeValue(0)).toThrow('positive number')
    })
  })
})

describe('Validación de imágenes del premio', () => {
  describe('cuando las imágenes son válidas', () => {
    it('debería aceptar 1 imagen (mínimo)', () => {
      expect(() =>
        validatePrizeImages(['https://example.com/img.jpg'])
      ).not.toThrow()
    })

    it('debería aceptar 5 imágenes (máximo)', () => {
      const imagenes = Array(5).fill('https://example.com/img.jpg')
      expect(() => validatePrizeImages(imagenes)).not.toThrow()
    })
  })

  describe('cuando las imágenes son inválidas', () => {
    it('debería rechazar un array vacío', () => {
      expect(() => validatePrizeImages([])).toThrow('At least 1')
    })

    it('debería rechazar más de 5 imágenes', () => {
      const imagenes = Array(6).fill('https://example.com/img.jpg')
      expect(() => validatePrizeImages(imagenes)).toThrow('Cannot exceed 5')
    })

    it('debería rechazar si no es un array', () => {
      expect(() => validatePrizeImages('url')).toThrow('must be an array')
    })

    it('debería rechazar URLs vacías en el array', () => {
      expect(() =>
        validatePrizeImages(['', 'https://valid.com/img.jpg'])
      ).toThrow('valid URL strings')
    })

    it('debería rechazar null', () => {
      expect(() => validatePrizeImages(null)).toThrow('must be an array')
    })
  })
})

describe('Validación de duración de la rifa', () => {
  const fechaBase = new Date('2024-01-01T00:00:00Z')

  describe('cuando la duración es válida', () => {
    it('debería aceptar una duración de 7 días (mínimo)', () => {
      const fechaFin = new Date('2024-01-08T00:00:00Z')
      expect(validateDuration(fechaBase, fechaFin)).toBe(7)
    })

    it('debería aceptar una duración de 60 días (máximo)', () => {
      const fechaFin = new Date('2024-03-01T00:00:00Z')
      expect(validateDuration(fechaBase, fechaFin)).toBe(60)
    })
  })

  describe('cuando la duración es inválida', () => {
    it('debería rechazar una duración menor a 7 días', () => {
      const fechaFin = new Date('2024-01-06T00:00:00Z')
      expect(() => validateDuration(fechaBase, fechaFin)).toThrow('at least 7')
    })

    it('debería rechazar una duración mayor a 60 días', () => {
      const fechaFin = new Date('2024-03-15T00:00:00Z')
      expect(() => validateDuration(fechaBase, fechaFin)).toThrow(
        'more than 60'
      )
    })
  })
})

describe('Cálculo de categoría según valor del premio', () => {
  it('debería clasificar como "pequeño" si el valor es menor a 500', () => {
    expect(calculateCategory(100)).toBe('pequeño')
    expect(calculateCategory(499)).toBe('pequeño')
  })

  it('debería clasificar como "mediano" si el valor está entre 500 y 4999', () => {
    expect(calculateCategory(500)).toBe('mediano')
    expect(calculateCategory(4999)).toBe('mediano')
  })

  it('debería clasificar como "grande" si el valor está entre 5000 y 49999', () => {
    expect(calculateCategory(5000)).toBe('grande')
    expect(calculateCategory(49999)).toBe('grande')
  })

  it('debería clasificar como "premium" si el valor es 50000 o más', () => {
    expect(calculateCategory(50000)).toBe('premium')
    expect(calculateCategory(1000000)).toBe('premium')
  })
})

describe('Cálculo de máximo de participantes según categoría', () => {
  it('debería calcular 3600 para categoría pequeño (3000 * 1.2)', () => {
    expect(calculateMaxParticipants(100)).toBe(3600)
  })

  it('debería calcular 60000 para categoría mediano (50000 * 1.2)', () => {
    expect(calculateMaxParticipants(500)).toBe(60000)
  })

  it('debería calcular 300000 para categoría grande (250000 * 1.2)', () => {
    expect(calculateMaxParticipants(5000)).toBe(300000)
  })

  it('debería calcular 1800000 para categoría premium (1500000 * 1.2)', () => {
    expect(calculateMaxParticipants(50000)).toBe(1800000)
  })
})

describe('Cálculo de duración por defecto según categoría', () => {
  it('debería retornar 7 días para categoría pequeño', () => {
    expect(calculateDefaultDuration(100)).toBe(7)
  })

  it('debería retornar 14 días para categoría mediano', () => {
    expect(calculateDefaultDuration(500)).toBe(14)
  })

  it('debería retornar 30 días para categoría grande', () => {
    expect(calculateDefaultDuration(5000)).toBe(30)
  })

  it('debería retornar 60 días para categoría premium', () => {
    expect(calculateDefaultDuration(50000)).toBe(60)
  })
})
