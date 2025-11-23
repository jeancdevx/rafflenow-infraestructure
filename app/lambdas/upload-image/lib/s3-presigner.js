import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { tracer, logger } from "./powertools.js";

const s3Client = tracer.captureAWSv3Client(new S3Client({}));

const PRESIGNED_URL_EXPIRATION = 300;

export async function generatePresignedUrl(params) {
  const { sanitizedFileName, fileType, userEmail } = params;

  const uniqueId = randomUUID();
  const fileKey = `prizes/${uniqueId}-${sanitizedFileName}`;

  logger.info("Generating presigned URL for S3 upload", {
    fileKey: fileKey,
    fileType: fileType,
    uniqueId: uniqueId,
  });

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    Metadata: {
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString(),
    },
  });

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  });

  const fileNameWithoutExt = sanitizedFileName.replace(/\.[^/.]+$/, "");
  const optimizedKey = `optimized/${uniqueId}-${fileNameWithoutExt}.webp`;
  const cloudFrontUrl = `${process.env.CLOUDFRONT_URL}/${optimizedKey}`;
  const originalUrl = `${process.env.CLOUDFRONT_URL}/${fileKey}`;

  logger.info("Presigned URL generated successfully", {
    fileKey: fileKey,
    expiresIn: PRESIGNED_URL_EXPIRATION,
    cloudFrontUrl: cloudFrontUrl,
  });

  return {
    presignedUrl: presignedUrl,
    fileKey: fileKey,
    cloudFrontUrl: cloudFrontUrl,
    originalUrl: originalUrl,
    expiresIn: PRESIGNED_URL_EXPIRATION,
  };
}

export function buildUploadResponse(uploadData) {
  const {
    presignedUrl,
    fileKey,
    cloudFrontUrl,
    originalUrl,
    expiresIn,
    sanitizedFileName,
    fileType,
  } = uploadData;

  return {
    message: "Presigned URL generated successfully",
    upload: {
      url: presignedUrl,
      method: "PUT",
      headers: {
        "Content-Type": fileType,
      },
      expiresIn: expiresIn,
    },
    file: {
      key: fileKey,
      cloudFrontUrl: cloudFrontUrl,
      originalUrl: originalUrl,
      fileName: sanitizedFileName,
    },
    instructions: [
      "1. Use PUT method to upload the file to the presigned URL",
      "2. Set Content-Type header to match the file type",
      "3. Once uploaded, use the cloudFrontUrl (optimized) in your raffle",
      `4. The URL expires in ${expiresIn} seconds (${Math.floor(
        expiresIn / 60
      )} minutes)`,
      "5. Image will be automatically optimized to WebP format",
    ],
  };
}
