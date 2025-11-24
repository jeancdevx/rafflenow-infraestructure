import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { tracer } from "./powertools.js";

const client = tracer.captureAWSv3Client(new DynamoDBClient({}));
const docClient = DynamoDBDocumentClient.from(client);

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE;

export async function updateRaffleStatus(raffleId, closedBy, hasParticipants) {
  const now = new Date().toISOString();
  const newStatus = hasParticipants ? "processing" : "closed";

  const params = {
    TableName: RAFFLES_TABLE,
    Key: {
      raffle_id: raffleId,
    },
    UpdateExpression:
      "SET #status = :new_status, closed_at = :closed_at, updated_at = :updated_at, closed_by = :closed_by",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":new_status": newStatus,
      ":closed_at": now,
      ":updated_at": now,
      ":closed_by": closedBy,
      ":active_status": "active",
      ":processing_status": "processing",
      ":closed_status": "closed",
    },
    ConditionExpression:
      "#status = :active_status OR #status = :processing_status OR #status = :closed_status",
    ReturnValues: "ALL_NEW",
  };

  const command = new UpdateCommand(params);
  const result = await docClient.send(command);

  return result.Attributes;
}
