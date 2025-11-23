import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger, tracer, metrics } from "./lib/powertools.js";
import {
  validateSqsRecord,
  isPrizeImage,
  generateOptimizedKey,
} from "./lib/event-validator.js";
import { downloadImage } from "./lib/s3-downloader.js";
import { optimizeImage } from "./lib/image-processor.js";
import { uploadOptimizedImage } from "./lib/s3-uploader.js";

export const handler = async (event, context) => {
  logger.addContext(context);

  const recordCount = event.Records?.length || 0;
  logger.info("Starting batch processing", {
    record_count: recordCount,
  });

  const batchItemFailures = [];
  let successCount = 0;
  let skippedCount = 0;

  for (const record of event.Records) {
    const messageId = record.messageId;

    try {
      logger.info("Processing SQS record", {
        message_id: messageId,
      });

      const validation = validateSqsRecord(record);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const { bucketName, objectKey } = validation.s3Event;

      if (!isPrizeImage(objectKey)) {
        logger.warn("Skipping non-prize image", {
          key: objectKey,
        });
        skippedCount++;
        continue;
      }

      const imageBuffer = await downloadImage(bucketName, objectKey);

      const { optimizedBuffer, metadata, compressionRatio } =
        await optimizeImage(imageBuffer);

      const optimizedKey = generateOptimizedKey(objectKey);

      await uploadOptimizedImage({
        bucketName: bucketName,
        optimizedKey: optimizedKey,
        optimizedBuffer: optimizedBuffer,
        originalKey: objectKey,
        metadata: metadata,
        compressionRatio: compressionRatio,
      });

      tracer.putAnnotation("optimizedKey", optimizedKey);
      tracer.putAnnotation("compressionRatio", compressionRatio);

      logger.info("Image optimization completed successfully", {
        message_id: messageId,
        original_key: objectKey,
        optimized_key: optimizedKey,
        compression_ratio: `${compressionRatio}%`,
      });

      metrics.addMetric("ImageOptimized", MetricUnit.Count, 1);
      metrics.addMetric(
        "CompressionRatio",
        MetricUnit.Percent,
        parseFloat(compressionRatio)
      );
      successCount++;
    } catch (error) {
      logger.error("Error processing image", {
        message_id: messageId,
        error: error.message,
        stack: error.stack,
      });

      metrics.addMetric("ImageOptimizationError", MetricUnit.Count, 1);

      batchItemFailures.push({
        itemIdentifier: messageId,
      });
    }
  }

  metrics.addMetric("ImagesProcessed", MetricUnit.Count, recordCount);
  metrics.addMetric("ImagesSucceeded", MetricUnit.Count, successCount);
  metrics.addMetric("ImagesFailed", MetricUnit.Count, batchItemFailures.length);
  metrics.addMetric("ImagesSkipped", MetricUnit.Count, skippedCount);
  metrics.publishStoredMetrics();

  logger.info("Batch processing completed", {
    total_processed: recordCount,
    successful: successCount,
    failed: batchItemFailures.length,
    skipped: skippedCount,
  });

  return {
    batchItemFailures,
  };
};
