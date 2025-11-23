import { logger } from "./powertools.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

const MAX_FILE_SIZE_MB = 10;

export function validateRequiredFields(fileName, fileType) {
  if (!fileName || !fileType) {
    return {
      valid: false,
      error: "fileName and fileType are required",
    };
  }

  if (typeof fileName !== "string" || typeof fileType !== "string") {
    return {
      valid: false,
      error: "fileName and fileType must be strings",
    };
  }

  return { valid: true, error: null };
}

export function validateFileType(fileType) {
  if (!ALLOWED_MIME_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(
        ", "
      )}`,
      allowedTypes: ALLOWED_MIME_TYPES,
    };
  }

  return { valid: true, error: null };
}

export function validateFileExtension(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension) {
    return {
      valid: false,
      error: "File name must have an extension",
      extension: null,
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(
        ", "
      )}`,
      extension: extension,
    };
  }

  return {
    valid: true,
    error: null,
    extension: extension,
  };
}

export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export function validateFileSize(fileSize) {
  if (!fileSize) {
    return { valid: true, error: null };
  }

  const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

  if (fileSize > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE_MB}MB`,
      maxSizeMB: MAX_FILE_SIZE_MB,
    };
  }

  return { valid: true, error: null };
}

export function validateUploadRequest(fileData) {
  const { fileName, fileType, fileSize } = fileData;

  const requiredValidation = validateRequiredFields(fileName, fileType);
  if (!requiredValidation.valid) {
    logger.warn("Required fields validation failed", requiredValidation);
    return requiredValidation;
  }

  const typeValidation = validateFileType(fileType);
  if (!typeValidation.valid) {
    logger.warn("File type validation failed", typeValidation);
    return typeValidation;
  }

  const extensionValidation = validateFileExtension(fileName);
  if (!extensionValidation.valid) {
    logger.warn("File extension validation failed", extensionValidation);
    return extensionValidation;
  }

  if (fileSize) {
    const sizeValidation = validateFileSize(fileSize);
    if (!sizeValidation.valid) {
      logger.warn("File size validation failed", sizeValidation);
      return sizeValidation;
    }
  }

  const sanitizedName = sanitizeFileName(fileName);

  return {
    valid: true,
    error: null,
    sanitizedName: sanitizedName,
    extension: extensionValidation.extension,
  };
}
