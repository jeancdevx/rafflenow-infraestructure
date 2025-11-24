import { logger, tracer, metrics } from "./lib/powertools.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE;
const PARTICIPANTS_TABLE = process.env.DYNAMODB_PARTICIPANTS_TABLE;

export const handler = async (event) => {
  logger.info("Processing participation batch", {
    batch_size: event.Records.length,
  });

  const batchItemFailures = [];
  let successCount = 0;

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const eventDetail = messageBody.detail || messageBody;

      const raffleId = eventDetail.raffle_id;
      const participantEmail = eventDetail.participant_email?.toLowerCase();
      const participantName = eventDetail.participant_name;
      const participatedAt =
        eventDetail.participated_at || new Date().toISOString();

      logger.appendKeys({
        raffle_id: raffleId,
        participant_email: participantEmail,
        message_id: record.messageId,
      });

      if (!raffleId || !participantEmail || !participantName) {
        logger.error("Missing required fields in message", {
          has_raffle_id: !!raffleId,
          has_email: !!participantEmail,
          has_name: !!participantName,
        });
        throw new Error("Missing required fields");
      }

      const updateCommand = new UpdateCommand({
        TableName: RAFFLES_TABLE,
        Key: { raffle_id: raffleId },
        UpdateExpression:
          "SET current_participants = current_participants + :inc, updated_at = :updated_at",
        ConditionExpression:
          "#status = :active AND current_participants < max_participants",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":inc": 1,
          ":updated_at": participatedAt,
          ":active": "active",
        },
        ReturnValues: "UPDATED_NEW",
      });

      try {
        const result = await docClient.send(updateCommand);

        logger.info("Participant count incremented", {
          raffle_id: raffleId,
          new_count: result.Attributes?.current_participants,
        });
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
          logger.warn("Raffle is full or not active, participation rejected", {
            raffle_id: raffleId,
            participant_email: participantEmail,
          });

          metrics.addMetric("ParticipationRejectedFull", MetricUnit.Count, 1);

          // TODO FASE 4: Enviar email de rechazo "Sorteo lleno"
          // await sendRaffleFullEmail(participantEmail, participantName, raffleId);

          continue;
        }
        throw error;
      }

      const participationData = {
        raffle_id: raffleId,
        participant_email: participantEmail,
        participant_name: participantName,
        participated_at: participatedAt,
      };

      const putCommand = new PutCommand({
        TableName: PARTICIPANTS_TABLE,
        Item: participationData,
        ConditionExpression:
          "attribute_not_exists(raffle_id) AND attribute_not_exists(participant_email)",
      });

      try {
        await docClient.send(putCommand);
        logger.info("Participation record created", {
          raffle_id: raffleId,
          participant_email: participantEmail,
        });
      } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
          logger.warn("Duplicate participation detected", {
            raffle_id: raffleId,
            participant_email: participantEmail,
          });
          metrics.addMetric("DuplicateParticipation", MetricUnit.Count, 1);

          continue;
        }
        throw error;
      }

      // TODO FASE 4: Enviar email de confirmación
      // await sendConfirmationEmail(participantEmail, participantName, raffleId);

      successCount++;
      metrics.addMetric("ParticipationProcessed", MetricUnit.Count, 1);

      logger.info("Participation processed successfully", {
        raffle_id: raffleId,
        participant_email: participantEmail,
      });
    } catch (error) {
      logger.error("Error processing participation", {
        error: error.message,
        error_name: error.name,
        message_id: record.messageId,
      });

      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });

      metrics.addMetric("ParticipationProcessingError", MetricUnit.Count, 1);
    } finally {
      logger.removeKeys(["raffle_id", "participant_email", "message_id"]);
    }
  }

  logger.info("Batch processing completed", {
    total: event.Records.length,
    success: successCount,
    failures: batchItemFailures.length,
  });

  metrics.publishStoredMetrics();

  return {
    batchItemFailures,
  };
};
