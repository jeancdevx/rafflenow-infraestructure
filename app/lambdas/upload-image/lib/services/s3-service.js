import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { s3Client } from '../clients.js'
import { logger } from '../powertools.js'

const PRESIGNED_URL_EXPIRATION = 300
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL

export async function generatePresignedUrl(params) {
  const { sanitizedFileName, fileType, userEmail } = params

  const uniqueId = randomUUID()
  const fileKey = `prizes/${uniqueId}-${sanitizedFileName}`

  logger.info('Generating presigned URL for S3 upload', {
    fileKey: fileKey,
    fileType: fileType,
    uniqueId: uniqueId
  })

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    Metadata: {
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString()
    }
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION
  })

  const fileNameWithoutExt = sanitizedFileName.replace(/\.[^/.]+$/, '')
  const optimizedKey = `optimized/${uniqueId}-${fileNameWithoutExt}.webp`
  const cloudFrontUrl = `${CLOUDFRONT_URL}/${optimizedKey}`
  const originalUrl = `${CLOUDFRONT_URL}/${fileKey}`

  logger.info('Presigned URL generated successfully', {
    fileKey: fileKey,
    expiresIn: PRESIGNED_URL_EXPIRATION,
    cloudFrontUrl: cloudFrontUrl
  })

  return {
    presignedUrl,
    fileKey,
    cloudFrontUrl,
    originalUrl,
    expiresIn: PRESIGNED_URL_EXPIRATION,
    sanitizedFileName,
    fileType
  }
}
