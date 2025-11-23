import { logger, tracer, metrics } from "./lib/powertools.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { extractClaims, getUserEmail, isAdmin } from "./lib/auth-validator.js";
import {
  validateRaffleId,
  validateParticipationData,
  validateRaffleStatus,
  validateRaffleCapacity,
  validateRaffleEndDate,
} from "./lib/participation-validator.js";
import { getRaffle } from "./lib/raffle-repository.js";
import { emitParticipationReceivedEvent } from "./lib/event-emitter.js";

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  logger.info("Processing participation request", { path: event.path });

  try {
    const claims = extractClaims(event);
    if (!claims) {
      logger.warn("Unauthorized participation attempt");
      metrics.addMetric("UnauthorizedAttempt", MetricUnit.Count, 1);
      return buildResponse(401, {
        message: "Unauthorized",
        error: "Authentication required to participate",
      });
    }

    const userEmail = getUserEmail(claims);
    logger.appendKeys({ user_email: userEmail });

    if (isAdmin(claims)) {
      logger.warn("Admin attempted to participate in raffle", {
        user_email: userEmail,
      });
      metrics.addMetric("AdminParticipationAttempt", MetricUnit.Count, 1);
      return buildResponse(403, {
        message: "Forbidden",
        error: "Administrators cannot participate in raffles",
      });
    }

    const raffleIdValidation = validateRaffleId(event);
    if (!raffleIdValidation.valid) {
      logger.warn("Invalid raffle_id", { error: raffleIdValidation.error });
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildResponse(400, { message: raffleIdValidation.error });
    }

    const raffleId = raffleIdValidation.raffleId;
    logger.appendKeys({ raffle_id: raffleId });

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (error) {
      logger.warn("Invalid JSON body", { error: error.message });
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildResponse(400, { message: "Invalid JSON body" });
    }

    const bodyValidation = validateParticipationData(parsedBody);
    if (!bodyValidation.valid) {
      logger.warn("Invalid participation data", {
        error: bodyValidation.error,
      });
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      return buildResponse(400, {
        message: "Validation error",
        error: bodyValidation.error,
      });
    }

    const participantData = bodyValidation.data;
    logger.info("Participation data validated", {
      participant_email: participantData.participant_email,
    });

    const raffle = await getRaffle(raffleId);
    if (!raffle) {
      logger.warn("Raffle not found", { raffle_id: raffleId });
      metrics.addMetric("RaffleNotFound", MetricUnit.Count, 1);
      return buildResponse(404, { message: "Raffle not found" });
    }

    const statusValidation = validateRaffleStatus(raffle);
    if (!statusValidation.valid) {
      logger.warn("Invalid raffle status", {
        status: raffle.status,
        error: statusValidation.error,
      });
      metrics.addMetric("RaffleInactive", MetricUnit.Count, 1);
      return buildResponse(400, {
        message: statusValidation.error,
        status: raffle.status,
      });
    }

    const capacityValidation = validateRaffleCapacity(raffle);
    if (!capacityValidation.valid) {
      logger.warn("Raffle at full capacity", {
        current: raffle.current_participants,
        max: raffle.max_participants,
      });
      metrics.addMetric("RaffleFull", MetricUnit.Count, 1);
      return buildResponse(400, {
        message: capacityValidation.error,
        current_participants: raffle.current_participants,
        max_participants: raffle.max_participants,
      });
    }

    const dateValidation = validateRaffleEndDate(raffle);
    if (!dateValidation.valid) {
      logger.warn("Raffle has ended", { end_date: raffle.end_date });
      metrics.addMetric("RaffleExpired", MetricUnit.Count, 1);
      return buildResponse(400, { message: dateValidation.error });
    }

    await emitParticipationReceivedEvent({
      raffleId,
      raffle,
      participantData,
    });

    logger.info("Participation request accepted", {
      raffle_id: raffleId,
      participant_email: participantData.participant_email,
    });

    metrics.addMetric("ParticipationReceived", MetricUnit.Count, 1);
    tracer.putAnnotation("raffleId", raffleId);
    tracer.putAnnotation("participantEmail", participantData.participant_email);

    return buildResponse(202, {
      message: "Participation request accepted",
      raffle_id: raffleId,
      participant_email: participantData.participant_email,
    });
  } catch (error) {
    logger.error("Error processing participation request", { error });
    metrics.addMetric("ParticipationError", MetricUnit.Count, 1);

    return buildResponse(500, {
      message: "Error processing participation request",
      error: error.message,
    });
  } finally {
    metrics.publishStoredMetrics();
  }
};
