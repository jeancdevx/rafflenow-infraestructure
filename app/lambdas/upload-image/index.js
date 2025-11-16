const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");
const Logger = require("./logger");

const s3Client = new S3Client({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    logger.warn("Unauthorized upload attempt", { operation: "upload-image" });
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Unauthorized",
        error: "Authentication required",
      }),
    };
  }

  const groups = claims["cognito:groups"];
  const isAdmin =
    groups &&
    (Array.isArray(groups) ? groups.includes("Admin") : groups === "Admin");

  if (!isAdmin) {
    logger.warn("Forbidden: non-admin user attempted to upload image", {
      operation: "upload-image",
    });
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Forbidden",
        error: "Admin role required to upload images",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    logger.info("Processing image upload request", {
      operation: "upload-image",
    });

    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      logger.warn("Validation error: missing fileName or fileType", {
        operation: "upload-image",
      });
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "fileName and fileType are required",
        }),
      };
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(fileType)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
          allowedTypes: allowedTypes,
        }),
      };
    }

    const extension = fileName.split(".").pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowedExtensions.includes(extension)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: `Invalid file extension. Allowed: ${allowedExtensions.join(
            ", "
          )}`,
        }),
      };
    }

    const uniqueId = randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `prizes/${uniqueId}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Metadata: {
        uploadedBy: claims.email,
        uploadedAt: new Date().toISOString(),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    const fileNameWithoutExt = sanitizedFileName.replace(/\.[^/.]+$/, "");
    const optimizedKey = `optimized/${uniqueId}-${fileNameWithoutExt}.webp`;
    const cloudFrontUrl = `${process.env.CLOUDFRONT_URL}/${optimizedKey}`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Presigned URL generated successfully",
        upload: {
          url: presignedUrl,
          method: "PUT",
          headers: {
            "Content-Type": fileType,
          },
          expiresIn: 300,
        },
        file: {
          key: key,
          cloudFrontUrl: cloudFrontUrl,
          originalUrl: `${process.env.CLOUDFRONT_URL}/${key}`,
          fileName: sanitizedFileName,
        },
        instructions: [
          "1. Use PUT method to upload the file to the presigned URL",
          "2. Set Content-Type header to match the file type",
          "3. Once uploaded, use the cloudFrontUrl (optimized) in your raffle",
          "4. The URL expires in 5 minutes",
          "5. Image will be automatically optimized to WebP format",
        ],
      }),
    };
  } catch (error) {
    logger.error("Error generating upload URL", error, {
      operation: "upload-image",
      fatal: true,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error generating presigned URL",
        error: error.message,
      }),
    };
  }
};
