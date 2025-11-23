import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger, tracer, metrics } from "./lib/powertools.js";
import { queryRafflesByStatus, scanAllRaffles } from "./lib/raffle-query.js";
import {
  validateLimit,
  decodeCursor,
  buildPaginatedResponse,
} from "./utils/pagination.js";

export const handler = async (event, context) => {
  try {
    logger.addContext(context);

    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status;
    const limit = validateLimit(queryParams.limit);
    const lastEvaluatedKey = decodeCursor(queryParams.cursor);

    logger.info("Processing list raffles request", {
      status,
      limit,
      hasCursor: !!lastEvaluatedKey,
    });

    let response;
    if (status) {
      tracer.putAnnotation("queryType", "GSI");
      tracer.putAnnotation("status", status);

      response = await queryRafflesByStatus(status, limit, lastEvaluatedKey);
      metrics.addMetric("QueryByStatus", MetricUnit.Count, 1);
    } else {
      tracer.putAnnotation("queryType", "Scan");

      response = await scanAllRaffles(limit, lastEvaluatedKey);
      metrics.addMetric("ScanAll", MetricUnit.Count, 1);
    }

    const paginatedResult = buildPaginatedResponse(
      response.Items,
      response.LastEvaluatedKey,
      response.ScannedCount
    );

    logger.info("Raffles retrieved successfully", {
      count: paginatedResult.count,
      hasMore: paginatedResult.has_more,
      scannedCount: paginatedResult.scanned_count,
    });

    metrics.addMetric(
      "RafflesRetrieved",
      MetricUnit.Count,
      paginatedResult.count
    );
    metrics.publishStoredMetrics();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffles retrieved successfully",
        ...paginatedResult,
      }),
    };
  } catch (error) {
    logger.error("Error retrieving raffles", {
      error: error.message,
      stack: error.stack,
    });

    metrics.addMetric("ListRafflesError", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error retrieving raffles",
        error: error.message,
      }),
    };
  }
};
