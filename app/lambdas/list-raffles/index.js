import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";

const logger = new Logger({ serviceName: "list-raffles" });
const tracer = new Tracer({ serviceName: "list-raffles" });
const metrics = new Metrics({
  namespace: "RaffleNow",
  serviceName: "list-raffles",
});

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const STATUS_INDEX = "StatusEndDateIndex";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const handler = async (event, context) => {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment("list-raffles-handler");

  try {
    logger.addContext(context);

    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status;
    const category = queryParams.category;
    const limit = Math.min(
      parseInt(queryParams.limit || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const lastEvaluatedKey = queryParams.cursor
      ? JSON.parse(Buffer.from(queryParams.cursor, "base64").toString())
      : undefined;

    logger.info("Processing list raffles request", {
      status,
      category,
      limit,
      hasCursor: !!lastEvaluatedKey,
    });

    let response;

    if (status) {
      const queryParams = {
        TableName: TABLE_NAME,
        IndexName: STATUS_INDEX,
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
        },
        Limit: limit,
        ScanIndexForward: true,
      };

      if (category) {
        queryParams.FilterExpression = "category = :category";
        queryParams.ExpressionAttributeValues[":category"] = category;
      }

      if (lastEvaluatedKey) {
        queryParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      subsegment.addAnnotation("queryType", "GSI");
      subsegment.addAnnotation("status", status);

      const command = new QueryCommand(queryParams);
      response = await docClient.send(command);

      metrics.addMetric("QueryByStatus", MetricUnit.Count, 1);
    } else {
      const scanParams = {
        TableName: TABLE_NAME,
        Limit: limit,
      };

      if (category) {
        scanParams.FilterExpression = "category = :category";
        scanParams.ExpressionAttributeValues = { ":category": category };
      }

      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey;
      }

      subsegment.addAnnotation("queryType", "Scan");

      const command = new ScanCommand(scanParams);
      response = await docClient.send(command);

      metrics.addMetric("ScanAll", MetricUnit.Count, 1);
    }

    const raffles = response.Items || [];
    const hasMore = !!response.LastEvaluatedKey;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString(
          "base64"
        )
      : null;

    logger.info("Raffles retrieved successfully", {
      count: raffles.length,
      hasMore,
      scannedCount: response.ScannedCount,
    });

    metrics.addMetric("RafflesRetrieved", MetricUnit.Count, raffles.length);
    metrics.publishStoredMetrics();

    subsegment.close();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffles retrieved successfully",
        count: raffles.length,
        has_more: hasMore,
        next_cursor: nextCursor,
        raffles: raffles,
      }),
    };
  } catch (error) {
    logger.error("Error retrieving raffles", { error });

    metrics.addMetric("ListRafflesError", MetricUnit.Count, 1);
    metrics.publishStoredMetrics();

    subsegment.addError(error);
    subsegment.close();

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
