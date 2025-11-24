import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { verifyToken } from "./lib/cognito-verifier.js";
import { getRaffleById, hasUserParticipated } from "./lib/raffle-repository.js";
import { prepareRaffleResponse } from "./utils/raffle-formatter.js";

export const handler = async (event, context) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment("get-raffle-handler");

  try {
    logger.addContext(context);

    const raffleId = event.pathParameters?.id;
    if (!raffleId) {
      logger.warn("Missing id in path parameters");
      metrics.addMetric("ValidationError", MetricUnit.Count, 1);
      subsegment.close();
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "raffle_id is required" }),
      };
    }

    logger.info("Processing get-raffle request", { raffleId });

    const raffle = await getRaffleById(raffleId);

    if (!raffle) {
      logger.warn("Raffle not found", { raffleId });
      metrics.addMetric("RaffleNotFound", MetricUnit.Count, 1);
      subsegment.close();
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Raffle not found" }),
      };
    }

    let userHasParticipated = false;
    const authHeader =
      event.headers?.Authorization || event.headers?.authorization;

    if (authHeader) {
      const userEmail = await verifyToken(authHeader);

      if (userEmail) {
        userHasParticipated = await hasUserParticipated(raffleId, userEmail);
      } else {
      }
    }

    const responseData = prepareRaffleResponse(raffle);
    responseData.user_has_participated = userHasParticipated;

    logger.info("Raffle retrieved successfully", {
      raffleId,
      status: raffle.status,
      userHasParticipated,
    });

    metrics.addMetric("RaffleRetrieved", MetricUnit.Count, 1);
    metrics.addDimension("RaffleStatus", raffle.status);

    subsegment.close();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    logger.error("Error retrieving raffle", {
      error: error.message,
      stack: error.stack,
    });
    metrics.addMetric("GetRaffleError", MetricUnit.Count, 1);

    subsegment.close();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  } finally {
    metrics.publishStoredMetrics();
  }
};
