import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { queryExpiredRaffles } from "./lib/raffle-query.js";
import {
  updateRaffleToProcessing,
  updateRaffleToClosed,
} from "./lib/raffle-updater.js";
import { emitRaffleClosedEvent } from "./lib/event-emitter.js";

const dynamoClient = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}));

export const handler = async (event) => {
  logger.info("Starting expired raffles check", {
    scheduled_event: event.time,
  });

  try {
    const now = new Date();
    const targetDate = now.toISOString();

    const expiredRaffles = await queryExpiredRaffles(docClient, targetDate);

    logger.info("Expired raffles found", {
      count: expiredRaffles.length,
    });

    metrics.addMetric(
      "ExpiredRafflesFound",
      MetricUnit.Count,
      expiredRaffles.length
    );

    if (expiredRaffles.length === 0) {
      metrics.publishStoredMetrics();
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No expired raffles found",
          checked_date: targetDate,
        }),
      };
    }

    const results = [];

    for (const raffle of expiredRaffles) {
      try {
        logger.appendKeys({
          raffle_id: raffle.raffle_id,
          raffle_title: raffle.title,
        });

        logger.info("Processing expired raffle", {
          current_participants: raffle.current_participants,
          max_participants: raffle.max_participants,
        });

        if (raffle.current_participants === 0) {
          logger.info("Raffle has no participants, closing directly", {
            raffle_id: raffle.raffle_id,
          });

          const closedTimestamp = await updateRaffleToClosed(
            docClient,
            raffle.raffle_id
          );

          metrics.addMetric("RaffleClosedNoParticipants", MetricUnit.Count, 1);

          results.push({
            raffle_id: raffle.raffle_id,
            status: "closed",
            closed_at: closedTimestamp,
          });

          logger.removeKeys(["raffle_id", "raffle_title"]);
          continue;
        }

        const closedTimestamp = await updateRaffleToProcessing(
          docClient,
          raffle.raffle_id
        );

        try {
          await emitRaffleClosedEvent(
            eventBridgeClient,
            raffle,
            closedTimestamp
          );
        } catch (eventError) {
          logger.error("Error emitting raffle.closed event", {
            error: eventError.message,
            raffle_id: raffle.raffle_id,
          });
          metrics.addMetric("EventEmissionError", MetricUnit.Count, 1);
        }

        metrics.addMetric("RaffleClosed", MetricUnit.Count, 1);

        results.push({
          raffle_id: raffle.raffle_id,
          status: "processing",
          closed_at: closedTimestamp,
        });

        logger.removeKeys(["raffle_id", "raffle_title"]);
      } catch (error) {
        logger.error("Error processing individual raffle", {
          error: error.message,
          error_name: error.name,
          raffle_id: raffle.raffle_id,
        });

        metrics.addMetric("RaffleProcessingError", MetricUnit.Count, 1);

        results.push({
          raffle_id: raffle.raffle_id,
          status: "error",
          error: error.message,
        });

        logger.removeKeys(["raffle_id", "raffle_title"]);
      }
    }

    logger.info("Expired raffles processing completed", {
      total_found: expiredRaffles.length,
      results_count: results.length,
    });

    metrics.publishStoredMetrics();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Expired raffles processed",
        total_found: expiredRaffles.length,
        results: results,
      }),
    };
  } catch (error) {
    logger.error("Fatal error checking expired raffles", {
      error: error.message,
      stack: error.stack,
    });

    metrics.addMetric("FatalError", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error checking expired raffles",
        error: error.message,
      }),
    };
  }
};
