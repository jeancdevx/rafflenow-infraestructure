import { logger } from "./powertools.js";

const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 200;
const DESCRIPTION_MIN_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 2000;
const MIN_DURATION_DAYS = 7;
const MAX_DURATION_DAYS = 60;
const MIN_PRIZE_IMAGES = 1;
const MAX_PRIZE_IMAGES = 5;

export function validateRequiredFields(body) {
  const requiredFields = [
    "title",
    "description",
    "end_date",
    "max_participants",
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      logger.warn("Missing required field", { field });
      return {
        valid: false,
        error: `Missing required field: ${field}`,
      };
    }
  }

  return { valid: true };
}

export function validateTitle(title) {
  if (typeof title !== "string") {
    return { valid: false, error: "Title must be a string" };
  }

  const length = title.trim().length;

  if (length < TITLE_MIN_LENGTH) {
    return {
      valid: false,
      error: `Title must be at least ${TITLE_MIN_LENGTH} characters`,
      current_length: length,
    };
  }

  if (length > TITLE_MAX_LENGTH) {
    return {
      valid: false,
      error: `Title cannot exceed ${TITLE_MAX_LENGTH} characters`,
      current_length: length,
    };
  }

  return { valid: true };
}

export function validateDescription(description) {
  if (typeof description !== "string") {
    return { valid: false, error: "Description must be a string" };
  }

  const length = description.trim().length;

  if (length < DESCRIPTION_MIN_LENGTH) {
    return {
      valid: false,
      error: `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`,
      current_length: length,
    };
  }

  if (length > DESCRIPTION_MAX_LENGTH) {
    return {
      valid: false,
      error: `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`,
      current_length: length,
    };
  }

  return { valid: true };
}

export function validateEndDate(endDateInput, startDate) {
  let endDate;

  if (endDateInput.includes("T")) {
    endDate = new Date(endDateInput);

    if (endDate.getUTCHours() !== 23 || endDate.getUTCMinutes() !== 59) {
      return {
        valid: false,
        error:
          "end_date must be set to 23:59 UTC. Use format: YYYY-MM-DD or YYYY-MM-DDT23:59:00Z",
      };
    }
  } else {
    endDate = new Date(`${endDateInput}T23:59:00Z`);
  }

  if (isNaN(endDate.getTime())) {
    return {
      valid: false,
      error: "Invalid end_date format",
    };
  }

  return { valid: true, endDate };
}

export function validateDuration(startDate, endDate) {
  const diffMs = endDate - startDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < MIN_DURATION_DAYS) {
    return {
      valid: false,
      error: `Raffle must last at least ${MIN_DURATION_DAYS} days`,
      duration_days: Math.floor(diffDays),
    };
  }

  if (diffDays > MAX_DURATION_DAYS) {
    return {
      valid: false,
      error: `Raffle cannot last more than ${MAX_DURATION_DAYS} days`,
      duration_days: Math.floor(diffDays),
    };
  }

  logger.debug("Duration validated", { duration_days: Math.floor(diffDays) });

  return { valid: true, durationDays: Math.floor(diffDays) };
}

export function validatePrizeImages(prizeImages) {
  if (!prizeImages || !Array.isArray(prizeImages)) {
    return {
      valid: false,
      error: "prize_images is required and must be an array",
    };
  }

  if (prizeImages.length < MIN_PRIZE_IMAGES) {
    return {
      valid: false,
      error: `At least ${MIN_PRIZE_IMAGES} prize image is required`,
      images_count: prizeImages.length,
    };
  }

  if (prizeImages.length > MAX_PRIZE_IMAGES) {
    return {
      valid: false,
      error: `Maximum ${MAX_PRIZE_IMAGES} prize images allowed`,
      images_count: prizeImages.length,
    };
  }

  for (let i = 0; i < prizeImages.length; i++) {
    if (typeof prizeImages[i] !== "string" || prizeImages[i].trim() === "") {
      return {
        valid: false,
        error: `prize_images[${i}] must be a non-empty string URL`,
      };
    }
  }

  return { valid: true };
}

export function validateMaxParticipants(maxParticipants) {
  const value = parseInt(maxParticipants);

  if (isNaN(value) || value <= 0) {
    return {
      valid: false,
      error: "max_participants must be a positive number",
    };
  }

  return { valid: true, value };
}
