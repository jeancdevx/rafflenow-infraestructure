import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { extractClaims, isAdmin, getUserEmail } from "./lib/auth-validator.js";
import { validateUploadRequest } from "./lib/upload-validator.js";
import {
  generatePresignedUrl,
  buildUploadResponse,
} from "./lib/s3-presigner.js";

export const handler = async (event, context) => {
  try {
    logger.addContext(context);

    const claims = extractClaims(event);

    if (!claims) {
      logger.warn("Unauthorized upload attempt");
      metrics.addMetric("UnauthorizedAttempt", MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      return buildErrorResponse(401, "Unauthorized", "Authentication required");
    }

    if (!isAdmin(claims)) {
      logger.warn("Forbidden: non-admin user attempted to upload image", {
        user_email: getUserEmail(claims),
      });
      metrics.addMetric("ForbiddenAttempt", MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      return buildErrorResponse(
        403,
        "Forbidden",
        "Admin role required to upload images"
      );
    }

    const userEmail = getUserEmail(claims);
    logger.appendKeys({ admin_email: userEmail });

    logger.info("Processing image upload request");

    const body = JSON.parse(event.body);
    const { fileName, fileType, fileSize } = body;

    const validation = validateUploadRequest({ fileName, fileType, fileSize });
    if (!validation.valid) {
      logger.warn("Validation error", { error: validation.error });
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
      return buildErrorResponse(400, "Validation error", validation.error, {
        allowedTypes: validation.allowedTypes,
      });
    }

    const uploadData = await generatePresignedUrl({
      sanitizedFileName: validation.sanitizedName,
      fileType: fileType,
      userEmail: userEmail,
    });

    const response = buildUploadResponse({
      ...uploadData,
      sanitizedFileName: validation.sanitizedName,
      fileType: fileType,
    });

    metrics.addMetric("PresignedUrlGenerated", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logger.error("Error generating presigned URL", {
      error: error.message,
      stack: error.stack,
    });

    metrics.addMetric("PresignedUrlError", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return buildErrorResponse(
      500,
      "Error generating presigned URL",
      error.message
    );
  }
};

function buildErrorResponse(
  statusCode,
  message,
  error = null,
  additionalData = {}
) {
  const body = {
    message,
    ...additionalData,
  };

  if (error) {
    body.error = error;
  }

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
