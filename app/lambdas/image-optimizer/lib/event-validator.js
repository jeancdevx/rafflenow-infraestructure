import { logger } from "./powertools.js";

export function validateSqsRecord(record) {
  try {
    const messageBody = JSON.parse(record.body);
    const s3Event = messageBody.detail || messageBody;

    const bucketName = s3Event.bucket?.name;
    const objectKey = s3Event.object?.key;

    if (!bucketName || !objectKey) {
      return {
        valid: false,
        s3Event: null,
        error: "Missing bucket name or object key in event",
      };
    }

    return {
      valid: true,
      s3Event: {
        bucketName: bucketName,
        objectKey: objectKey,
      },
      error: null,
    };
  } catch (error) {
    logger.error("Error parsing SQS record", {
      error: error.message,
      record_id: record.messageId,
    });
    return {
      valid: false,
      s3Event: null,
      error: `Invalid JSON in message body: ${error.message}`,
    };
  }
}

export function isPrizeImage(objectKey) {
  return objectKey.startsWith("prizes/");
}

export function generateOptimizedKey(originalKey) {
  const fileName = originalKey.split("/").pop();
  const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  return `optimized/${fileNameWithoutExt}.webp`;
}
