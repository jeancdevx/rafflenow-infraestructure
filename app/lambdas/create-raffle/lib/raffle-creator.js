import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { logger, tracer } from "./powertools.js";

const TABLE_NAME = process.env.DYNAMODB_TABLE;

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

export async function createRaffle(raffleData, createdBy) {
  const raffleId = `raffle-${randomUUID()}`;
  const now = new Date().toISOString();

  const raffle = {
    raffle_id: raffleId,
    title: raffleData.title,
    description: raffleData.description,
    status: "active",
    start_date: raffleData.startDate.toISOString(),
    end_date: raffleData.endDate.toISOString(),
    max_participants: raffleData.maxParticipants,
    current_participants: 0,
    prize_images: raffleData.prizeImages,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };

  logger.info("Creating raffle in DynamoDB", {
    raffle_id: raffleId,
    title: raffle.title,
    max_participants: raffle.max_participants,
  });

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: raffle,
    ConditionExpression: "attribute_not_exists(raffle_id)",
  });

  try {
    await docClient.send(command);

    logger.info("Raffle created successfully", {
      raffle_id: raffleId,
      status: raffle.status,
    });

    return raffle;
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      logger.warn("Raffle ID collision detected", { raffle_id: raffleId });
      throw new Error("RAFFLE_ALREADY_EXISTS");
    }

    logger.error("Failed to create raffle in DynamoDB", {
      error: error.message,
      raffle_id: raffleId,
    });

    throw error;
  }
}
