import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { tracer, logger } from './powertools.js'

const s3Client = tracer.captureAWSv3Client(new S3Client({}))

export async function downloadImage(bucketName, objectKey) {
  logger.info('Downloading original image from S3', {
    bucket: bucketName,
    key: objectKey
  })

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey
  })

  const s3Response = await s3Client.send(getObjectCommand)
  const imageBuffer = await streamToBuffer(s3Response.Body)

  logger.info('Original image downloaded', {
    size_bytes: imageBuffer.length,
    size_kb: (imageBuffer.length / 1024).toFixed(2)
  })

  return imageBuffer
}

async function streamToBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
