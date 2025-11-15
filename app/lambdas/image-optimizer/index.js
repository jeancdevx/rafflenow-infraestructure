const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const Logger = require("./logger");

const s3Client = new S3Client({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logBatchProcessing(event.Records.length);

  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const s3Event = messageBody.detail || messageBody;

      logger.info("Processing S3 image event", {
        operation: "optimize-image",
        record_id: record.messageId,
        bucket: s3Event.bucket?.name,
        key: s3Event.object?.key,
      });

      const bucketName = s3Event.bucket?.name || process.env.S3_BUCKET_NAME;
      const objectKey = s3Event.object?.key;

      if (!bucketName || !objectKey) {
        throw new Error("Missing bucket name or object key in event");
      }

      if (!objectKey.startsWith("prizes/")) {
        logger.warn("Skipping non-prize image", {
          operation: "optimize-image",
          key: objectKey,
        });
        continue;
      }

      logger.info("Downloading original image from S3", {
        operation: "optimize-image",
        bucket: bucketName,
        key: objectKey,
      });

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      const s3Response = await s3Client.send(getObjectCommand);
      const imageBuffer = await streamToBuffer(s3Response.Body);

      logger.info("Original image downloaded", {
        operation: "optimize-image",
        size_bytes: imageBuffer.length,
      });

      const metadata = await sharp(imageBuffer).metadata();
      logger.info("Image metadata extracted", {
        operation: "optimize-image",
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
      });

      const optimizedBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
          effort: 4,
        })
        .toBuffer();

      const compressionRatio = (
        (1 - optimizedBuffer.length / imageBuffer.length) *
        100
      ).toFixed(2);

      logger.info("Image optimized", {
        operation: "optimize-image",
        original_size: imageBuffer.length,
        optimized_size: optimizedBuffer.length,
        compression_ratio: `${compressionRatio}%`,
      });

      const fileName = objectKey.split("/").pop();
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      const optimizedKey = `optimized/${fileNameWithoutExt}.webp`;

      const putObjectCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: optimizedKey,
        Body: optimizedBuffer,
        ContentType: "image/webp",
        Metadata: {
          originalKey: objectKey,
          optimizedAt: new Date().toISOString(),
          originalSize: imageBuffer.length.toString(),
          optimizedSize: optimizedBuffer.length.toString(),
          compressionRatio: compressionRatio,
        },
      });

      await s3Client.send(putObjectCommand);

      logger.logBatchItemSuccess(record.messageId, {
        original_key: objectKey,
        optimized_key: optimizedKey,
        compression_ratio: `${compressionRatio}%`,
      });
    } catch (error) {
      logger.logBatchItemFailure(record.messageId, error, {
        message_body: record.body,
      });

      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  logger.info("Batch processing completed", {
    operation: "batch-processing",
    total_processed: event.Records.length,
    failures: batchItemFailures.length,
  });

  return {
    batchItemFailures,
  };
};

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
