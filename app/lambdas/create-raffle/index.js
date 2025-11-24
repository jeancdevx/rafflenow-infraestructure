import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { extractClaims, isAdmin, getUserEmail } from "./lib/auth-validator.js";
import {
  validateRequiredFields,
  validateTitle,
  validateDescription,
  validateEndDate,
  validateDuration,
  validatePrizeImages,
  validateMaxParticipants,
} from "./lib/raffle-validator.js";
import { createRaffle } from "./lib/raffle-creator.js";
import { emitRaffleCreatedEvent } from "./lib/event-emitter.js";

export const handler = async (event, context) => {
  try {
    logger.addContext(context);

    const claims = extractClaims(event);
    if (!claims) {
      metrics.addMetric("UnauthorizedAttempt", MetricUnit.Count, 1);
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

    if (!isAdmin(claims)) {
      metrics.addMetric("ForbiddenAttempt", MetricUnit.Count, 1);
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Forbidden",
          error: "Admin role required to create raffles",
        }),
      };
    }

    const body = JSON.parse(event.body);

    logger.info("Creating new raffle", {
      admin_email: getUserEmail(claims),
    });

    const requiredValidation = validateRequiredFields(body);
    if (!requiredValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        requiredValidation.error
      );
    }

    const titleValidation = validateTitle(body.title);
    if (!titleValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        titleValidation.error,
        titleValidation
      );
    }

    const descriptionValidation = validateDescription(body.description);
    if (!descriptionValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        descriptionValidation.error,
        descriptionValidation
      );
    }

    const imagesValidation = validatePrizeImages(body.prize_images);
    if (!imagesValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        imagesValidation.error,
        imagesValidation
      );
    }

    const maxParticipantsValidation = validateMaxParticipants(
      body.max_participants
    );
    if (!maxParticipantsValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        maxParticipantsValidation.error
      );
    }

    const now = new Date();
    const startDate = body.start_date ? new Date(body.start_date) : now;

    const endDateValidation = validateEndDate(body.end_date, startDate);
    if (!endDateValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        endDateValidation.error
      );
    }

    const durationValidation = validateDuration(
      startDate,
      endDateValidation.endDate
    );
    if (!durationValidation.valid) {
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildErrorResponse(
        400,
        "Validation error",
        durationValidation.error,
        durationValidation
      );
    }

    const raffleData = {
      title: body.title,
      description: body.description,
      startDate: startDate,
      endDate: endDateValidation.endDate,
      maxParticipants: maxParticipantsValidation.value,
      prizeImages: body.prize_images,
    };

    const raffle = await createRaffle(raffleData, getUserEmail(claims));

    await emitRaffleCreatedEvent(raffle);

    metrics.addMetric("RaffleCreated", MetricUnit.Count, 1);
    metrics.addMetric(
      "RaffleDuration",
      MetricUnit.Count,
      durationValidation.durationDays
    );
    metrics.publishStoredMetrics();

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffle created successfully",
        raffle: raffle,
      }),
    };
  } catch (error) {
    if (error.message === "RAFFLE_ALREADY_EXISTS") {
      logger.warn("Raffle ID collision", { error: error.message });
      return buildErrorResponse(409, "Raffle already exists");
    }

    logger.error("Error creating raffle", {
      error: error.message,
      stack: error.stack,
    });

    metrics.addMetric("CreateRaffleError", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return buildErrorResponse(500, "Error creating raffle", error.message);
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
