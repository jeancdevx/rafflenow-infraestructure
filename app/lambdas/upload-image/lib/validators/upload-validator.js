import { ValidationError } from '../errors.js'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

const MAX_FILE_SIZE_MB = 10

export function validateUploadRequest(body) {
  const { fileName, fileType, fileSize } = body

  if (!fileName || !fileType) {
    throw new ValidationError('fileName and fileType are required')
  }

  if (typeof fileName !== 'string' || typeof fileType !== 'string') {
    throw new ValidationError('fileName and fileType must be strings')
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400,
      { allowedTypes: ALLOWED_MIME_TYPES }
    )
  }

  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension) {
    throw new ValidationError('File name must have an extension')
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new ValidationError(
      `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      400,
      { extension }
    )
  }

  if (fileSize) {
    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024

    if (fileSize > maxSizeBytes) {
      throw new ValidationError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
        400,
        { maxSizeMB: MAX_FILE_SIZE_MB }
      )
    }
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

  return {
    sanitizedName,
    extension
  }
}
