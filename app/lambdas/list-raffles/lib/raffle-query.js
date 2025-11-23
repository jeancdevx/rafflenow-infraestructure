import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { logger, tracer } from "./powertools.js";

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const STATUS_INDEX = "StatusEndDateIndex";

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

export async function queryRafflesByStatus(status, limit, exclusiveStartKey) {
  logger.debug("Querying raffles by status", { status, limit });

  const params = {
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

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey;
  }

  const command = new QueryCommand(params);
  return await docClient.send(command);
}

export async function scanAllRaffles(limit, exclusiveStartKey) {
  logger.debug("Scanning all raffles", { limit });

  const params = {
    TableName: TABLE_NAME,
    Limit: limit,
  };

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey;
  }

  const command = new ScanCommand(params);
  return await docClient.send(command);
}
