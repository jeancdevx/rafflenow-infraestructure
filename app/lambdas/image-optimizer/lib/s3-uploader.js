import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import { logger, tracer } from './powertools.js'

const s3Client = tracer.captureAWSv3Client(new S3Client({}))

export async function uploadOptimizedImage(params) {
  const {
    bucketName,
    optimizedKey,
    optimizedBuffer,
    originalKey,
    metadata,
    compressionRatio
  } = params

  logger.info('Uploading optimized image to S3', {
    bucket: bucketName,
    key: optimizedKey,
    size_bytes: optimizedBuffer.length
  })

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: optimizedKey,
    Body: optimizedBuffer,
    ContentType: 'image/webp',
    Metadata: {
      originalKey: originalKey,
      optimizedAt: new Date().toISOString(),
      originalSize: metadata.originalSize.toString(),
      optimizedSize: optimizedBuffer.length.toString(),
      compressionRatio: compressionRatio,
      originalFormat: metadata.originalFormat || 'unknown',
      originalWidth: metadata.originalWidth?.toString() || 'unknown',
      originalHeight: metadata.originalHeight?.toString() || 'unknown'
    }
  })

  await s3Client.send(putObjectCommand)

  logger.info('Optimized image uploaded successfully', {
    bucket: bucketName,
    key: optimizedKey
  })
}
