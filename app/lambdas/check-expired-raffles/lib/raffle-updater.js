import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { logger } from "./powertools.js";

export async function updateRaffleToProcessing(docClient, raffleId) {
  const closedTimestamp = new Date().toISOString();

  const updateParams = {
    TableName: process.env.DYNAMODB_RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      "SET #status = :processing, closed_at = :closed_at, updated_at = :updated_at",
    ConditionExpression: "#status = :active",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":processing": "processing",
      ":closed_at": closedTimestamp,
      ":updated_at": closedTimestamp,
      ":active": "active",
    },
  };

  await docClient.send(new UpdateCommand(updateParams));

  logger.info("Raffle status updated to processing", {
    raffle_id: raffleId,
    closed_at: closedTimestamp,
  });

  return closedTimestamp;
}

export async function updateRaffleToClosed(docClient, raffleId) {
  const closedTimestamp = new Date().toISOString();

  const updateParams = {
    TableName: process.env.DYNAMODB_RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      "SET #status = :closed, closed_at = :closed_at, updated_at = :updated_at",
    ConditionExpression: "#status = :active",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":closed": "closed",
      ":closed_at": closedTimestamp,
      ":updated_at": closedTimestamp,
      ":active": "active",
    },
  };

  await docClient.send(new UpdateCommand(updateParams));

  logger.info("Raffle closed without participants", {
    raffle_id: raffleId,
    closed_at: closedTimestamp,
  });

  return closedTimestamp;
}
