import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { logger, tracer } from "./powertools.js";

const RAFFLES_TABLE = process.env.DYNAMODB_TABLE;
const PARTICIPANTS_TABLE = process.env.DYNAMODB_PARTICIPANTS_TABLE;

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

export async function getRaffleById(raffleId) {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment("getRaffleById");

  try {
    const command = new GetCommand({
      TableName: RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      logger.warn("Raffle not found", { raffleId });
      return null;
    }

    logger.info("Raffle retrieved successfully", {
      raffleId,
      status: result.Item.status,
    });
    return result.Item;
  } finally {
    subsegment.close();
  }
}

export async function hasUserParticipated(raffleId, userEmail) {
  const segment = tracer.getSegment();
  const subsegment = segment.addNewSubsegment("checkUserParticipation");

  try {
    const command = new QueryCommand({
      TableName: PARTICIPANTS_TABLE,
      KeyConditionExpression:
        "raffle_id = :raffle_id AND participant_email = :email",
      ExpressionAttributeValues: {
        ":raffle_id": raffleId,
        ":email": userEmail,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    const participated = result.Items && result.Items.length > 0;

    logger.info("Participation check completed", {
      raffleId,
      userEmail,
      participated,
    });
    return participated;
  } catch (error) {
    logger.error("Error checking participation", {
      error: error.message,
      raffleId,
      userEmail,
    });
    return false;
  } finally {
    subsegment.close();
  }
}
