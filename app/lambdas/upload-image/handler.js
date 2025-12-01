import { MetricUnit } from '@aws-lambda-powertools/metrics'

import { logger, metrics } from './lib/powertools.js'

import {
  ensureIsAdmin,
  extractClaims,
  getUserEmail
} from './lib/validators/auth.js'
import { validateUploadRequest } from './lib/validators/upload-validator.js'

import { buildUploadResponse } from './lib/services/response-builder.js'
import { generatePresignedUrl } from './lib/services/s3-service.js'

const Actions = {
  AUTH_VALIDATED: 'AUTH_VALIDATED',
  INPUT_VALIDATED: 'INPUT_VALIDATED',
  URL_GENERATED: 'URL_GENERATED'
}

export async function handleImageUpload(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const userEmail = getUserEmail(claims)
  logger.appendKeys({ admin_email: userEmail })

  logger.info('Admin authenticated for upload', {
    action: Actions.AUTH_VALIDATED
  })

  const body = JSON.parse(event.body)

  const { sanitizedName } = validateUploadRequest(body)

  logger.info('Upload request validated', {
    action: Actions.INPUT_VALIDATED,
    file_type: body.fileType,
    file_size: body.fileSize || 'not_provided'
  })

  const uploadData = await generatePresignedUrl({
    sanitizedFileName: sanitizedName,
    fileType: body.fileType,
    userEmail: userEmail
  })

  logger.info('Presigned URL generated', {
    action: Actions.URL_GENERATED,
    s3_key: uploadData.key
  })

  metrics.addMetric('PresignedUrlGenerated', MetricUnit.Count, 1)

  return buildUploadResponse(uploadData)
}
