import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { tracer, logger } from "./powertools.js";

const client = new DynamoDBClient({});
const docClient = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(client)
);

export async function getRaffle(raffleId) {
  logger.info("Fetching raffle from DynamoDB", {
    raffle_id: raffleId,
  });

  const getRaffleCommand = new GetCommand({
    TableName: process.env.DYNAMODB_RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
  });

  const response = await docClient.send(getRaffleCommand);

  if (!response.Item) {
    logger.warn("Raffle not found", {
      raffle_id: raffleId,
    });
    return null;
  }

  logger.info("Raffle found", {
    raffle_id: raffleId,
    status: response.Item.status,
    current_participants: response.Item.current_participants,
    max_participants: response.Item.max_participants,
  });

  return response.Item;
}

export async function checkExistingParticipation(raffleId, participantEmail) {
  logger.info("Checking for existing participation", {
    raffle_id: raffleId,
    participant_email: participantEmail,
  });

  const getCommand = new GetCommand({
    TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
    Key: {
      raffle_id: raffleId,
      participant_email: participantEmail,
    },
  });

  const response = await docClient.send(getCommand);

  const alreadyParticipated = !!response.Item;

  if (alreadyParticipated) {
    logger.warn("User already participated in this raffle", {
      raffle_id: raffleId,
      participant_email: participantEmail,
    });
  }

  return alreadyParticipated;
}
