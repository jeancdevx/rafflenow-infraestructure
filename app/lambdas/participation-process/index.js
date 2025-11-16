const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const Logger = require("./logger");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logBatchProcessing(event.Records.length);

  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const eventDetail = messageBody.detail || messageBody;

      logger.info("Processing participation event", {
        operation: "process-participation",
        record_id: record.messageId,
        raffle_id: eventDetail.raffle_id,
      });

      const requiredFields = [
        "raffle_id",
        "participant_email",
        "participant_name",
      ];
      for (const field of requiredFields) {
        if (!eventDetail[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      const raffleId = eventDetail.raffle_id;
      const participantEmail = eventDetail.participant_email.toLowerCase();
      const participantName = eventDetail.participant_name;
      const participatedAt =
        eventDetail.participated_at || new Date().toISOString();

      const participant = {
        raffle_id: raffleId,
        participant_email: participantEmail,
        participant_name: participantName,
        participated_at: participatedAt,
        participant_phone: eventDetail.participant_phone || null,
      };

      const putParticipantCommand = new PutCommand({
        TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
        Item: participant,
        ConditionExpression:
          "attribute_not_exists(raffle_id) AND attribute_not_exists(participant_email)",
      });

      await docClient.send(putParticipantCommand);

      logger.info("Participant created successfully", {
        operation: "process-participation",
        raffle_id: raffleId,
        participant_email: participantEmail,
      });

      const updateRaffleCommand = new UpdateCommand({
        TableName: process.env.DYNAMODB_RAFFLES_TABLE,
        Key: { raffle_id: raffleId },
        UpdateExpression:
          "SET current_participants = current_participants + :inc, updated_at = :updated_at",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":updated_at": participatedAt,
        },
        ReturnValues: "NONE",
      });

      await docClient.send(updateRaffleCommand);

      logger.logBatchItemSuccess(record.messageId, {
        raffle_id: raffleId,
        participant_email: participantEmail,
      });
    } catch (error) {
      logger.logBatchItemFailure(record.messageId, error, {
        message_body: record.body,
      });

      if (error.name === "ConditionalCheckFailedException") {
        logger.warn("Participant already exists, skipping retry", {
          operation: "process-participation",
          record_id: record.messageId,
        });
        continue;
      }

      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  logger.info("Batch processing completed", {
    operation: "batch-processing",
    total_processed: event.Records.length,
    failures: batchItemFailures.length,
  });

  return {
    batchItemFailures,
  };
};
