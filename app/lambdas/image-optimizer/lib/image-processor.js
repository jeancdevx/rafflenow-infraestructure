import sharp from 'sharp'
import { logger } from './powertools.js'

const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 82
const WEBP_EFFORT = 4

export async function optimizeImage(imageBuffer) {
  const metadata = await sharp(imageBuffer).metadata()

  logger.info('Image metadata extracted', {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    size: metadata.size
  })

  const optimizedBuffer = await sharp(imageBuffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: WEBP_EFFORT
    })
    .toBuffer()

  const compressionRatio = (
    (1 - optimizedBuffer.length / imageBuffer.length) *
    100
  ).toFixed(2)

  logger.info('Image optimized', {
    original_size: imageBuffer.length,
    optimized_size: optimizedBuffer.length,
    original_size_kb: (imageBuffer.length / 1024).toFixed(2),
    optimized_size_kb: (optimizedBuffer.length / 1024).toFixed(2),
    compression_ratio: `${compressionRatio}%`,
    format: 'webp',
    quality: WEBP_QUALITY
  })

  return {
    optimizedBuffer: optimizedBuffer,
    metadata: {
      originalFormat: metadata.format,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      originalSize: imageBuffer.length
    },
    compressionRatio: compressionRatio
  }
}
