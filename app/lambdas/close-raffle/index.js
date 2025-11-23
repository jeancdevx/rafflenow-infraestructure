import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { extractClaims, isAdmin, getUserId } from "./lib/auth-validator.js";
import {
  validateRaffleId,
  validateRaffleForClosure,
} from "./lib/raffle-validator.js";
import { updateRaffleStatus } from "./lib/raffle-updater.js";
import { emitRaffleClosedEvent } from "./lib/event-emitter.js";

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE;

export const handler = async (event, context) => {
  logger.info("Processing raffle close request", { event });

  const claims = extractClaims(event);
  if (!claims) {
    metrics.addMetric("UnauthorizedAttempt", "Count", 1);
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
    logger.warn("Forbidden: non-admin user attempted to close raffle");
    metrics.addMetric("ForbiddenNonAdmin", "Count", 1);
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Forbidden",
        error: "Admin role required to close raffles",
      }),
    };
  }

  const userId = getUserId(claims);
  tracer.putAnnotation("userId", userId);

  const {
    valid: validRaffleId,
    raffleId,
    error: raffleIdError,
  } = validateRaffleId(event);
  if (!validRaffleId) {
    logger.warn(raffleIdError);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: raffleIdError,
      }),
    };
  }

  tracer.putAnnotation("raffleId", raffleId);

  try {
    logger.info("Fetching raffle from DynamoDB", { raffle_id: raffleId });
    const getRaffleCommand = new GetCommand({
      TableName: RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
    });

    const raffleResponse = await docClient.send(getRaffleCommand);

    if (!raffleResponse.Item) {
      logger.warn("Raffle not found", { raffle_id: raffleId });
      metrics.addMetric("RaffleNotFound", "Count", 1);
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle not found",
        }),
      };
    }

    const raffle = raffleResponse.Item;

    const {
      valid: validState,
      error: stateError,
      currentStatus,
    } = validateRaffleForClosure(raffle);

    if (!validState) {
      logger.warn(stateError, {
        raffle_id: raffleId,
        current_status: currentStatus,
      });

      if (stateError === "Raffle is not active") {
        metrics.addMetric("RaffleNotActive", "Count", 1);
      }

      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: stateError,
          ...(currentStatus && { status: currentStatus }),
        }),
      };
    }

    const hasParticipants = raffle.current_participants > 0;
    const targetStatus = hasParticipants ? "processing" : "closed";

    logger.info(`Updating raffle to ${targetStatus} status`, {
      raffle_id: raffleId,
      has_participants: hasParticipants,
      current_participants: raffle.current_participants,
    });
    const updatedRaffle = await updateRaffleStatus(
      raffleId,
      userId,
      hasParticipants
    );

    if (hasParticipants) {
      logger.info("Emitting raffle.closed event for winner selection", {
        raffle_id: raffleId,
      });
      await emitRaffleClosedEvent(updatedRaffle, userId);
    } else {
      logger.info("Raffle closed without participants, no event emission", {
        raffle_id: raffleId,
      });
    }

    metrics.addMetric("RaffleClosed", "Count", 1);
    metrics.addMetric("RaffleCloseAttempt", "Count", 1);

    const message = hasParticipants
      ? "Raffle closed successfully and winner selection initiated"
      : "Raffle closed successfully without participants";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message,
        raffle: updatedRaffle,
      }),
    };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      logger.warn("Concurrent close attempt detected", { raffle_id: raffleId });
      metrics.addMetric("ConcurrentCloseAttempt", "Count", 1);
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle is not in active status or was already closed",
        }),
      };
    }

    logger.error("Error closing raffle", { error, raffle_id: raffleId });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error closing raffle",
        error: error.message,
      }),
    };
  }
};
