import { logger, tracer, metrics } from "./lib/powertools.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import {
  extractClaims,
  getUserEmail,
  getUserName,
  isAdmin,
} from "./lib/auth-validator.js";
import {
  validateRaffleId,
  validateRaffleStatus,
  validateRaffleEndDate,
  validateNoDuplicateParticipation,
  validateRaffleCapacity,
} from "./lib/participation-validator.js";
import {
  getRaffle,
  checkExistingParticipation,
} from "./lib/raffle-repository.js";
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
    const userName = getUserName(claims);
    logger.appendKeys({ user_email: userEmail, user_name: userName });

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

    const participantData = {
      participant_email: userEmail.toLowerCase(),
      participant_name: userName,
    };

    logger.info("Participation data from JWT", {
      participant_email: participantData.participant_email,
      participant_name: participantData.participant_name,
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

    const dateValidation = validateRaffleEndDate(raffle);
    if (!dateValidation.valid) {
      logger.warn("Raffle has ended", { end_date: raffle.end_date });
      metrics.addMetric("RaffleExpired", MetricUnit.Count, 1);
      return buildResponse(400, { message: dateValidation.error });
    }

    const alreadyParticipated = await checkExistingParticipation(
      raffleId,
      participantData.participant_email
    );

    const duplicateValidation =
      validateNoDuplicateParticipation(alreadyParticipated);
    if (!duplicateValidation.valid) {
      logger.warn("Duplicate participation attempt", {
        raffle_id: raffleId,
        participant_email: participantData.participant_email,
      });
      metrics.addMetric("DuplicateParticipation", MetricUnit.Count, 1);
      return buildResponse(409, {
        message: duplicateValidation.error,
        raffle_id: raffleId,
      });
    }

    const capacityValidation = validateRaffleCapacity(raffle);
    if (!capacityValidation.valid) {
      logger.warn("Raffle at full capacity", {
        raffle_id: raffleId,
        current_participants: capacityValidation.current,
        max_participants: capacityValidation.max,
      });
      metrics.addMetric("RaffleFull", MetricUnit.Count, 1);
      return buildResponse(400, {
        message: capacityValidation.error,
        raffle_id: raffleId,
        current_participants: capacityValidation.current,
        max_participants: capacityValidation.max,
      });
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
