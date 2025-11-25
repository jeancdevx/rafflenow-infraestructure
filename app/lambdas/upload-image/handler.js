import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import {
  extractClaims,
  ensureIsAdmin,
  getUserEmail
} from './lib/validators/auth.js'
import { validateUploadRequest } from './lib/validators/upload-validator.js'
import { generatePresignedUrl } from './lib/services/s3-service.js'
import { buildUploadResponse } from './lib/services/response-builder.js'

export async function handleImageUpload(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const userEmail = getUserEmail(claims)
  logger.appendKeys({ admin_email: userEmail })

  logger.info('Processing image upload request')

  const body = JSON.parse(event.body)

  const { sanitizedName } = validateUploadRequest(body)

  const uploadData = await generatePresignedUrl({
    sanitizedFileName: sanitizedName,
    fileType: body.fileType,
    userEmail: userEmail
  })

  metrics.addMetric('PresignedUrlGenerated', MetricUnit.Count, 1)

  return buildUploadResponse(uploadData)
}
