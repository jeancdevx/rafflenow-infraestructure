const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  EventBridgeClient,
  PutEventsCommand,
} = require("@aws-sdk/client-eventbridge");
const Logger = require("./logger");

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  try {
    const now = new Date();
    const targetDate = now.toISOString();

    logger.info("Checking for expired raffles", {
      operation: "check-expired-raffles",
      target_date: targetDate,
    });

    const queryParams = {
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      IndexName: "StatusEndDateIndex",
      KeyConditionExpression: "#status = :active AND #endDate <= :targetDate",
      ExpressionAttributeNames: {
        "#status": "status",
        "#endDate": "end_date",
      },
      ExpressionAttributeValues: {
        ":active": "active",
        ":targetDate": targetDate,
      },
    };

    logger.logDbOperation("Query", process.env.DYNAMODB_RAFFLES_TABLE, {
      operation: "check-expired-raffles",
      index: "StatusEndDateIndex",
    });

    const queryResult = await docClient.send(new QueryCommand(queryParams));
    const expiredRaffles = queryResult.Items || [];

    logger.info("Expired raffles search completed", {
      operation: "check-expired-raffles",
      count: expiredRaffles.length,
    });

    if (expiredRaffles.length === 0) {
      logger.info("No expired raffles found", {
        operation: "check-expired-raffles",
      });
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No expired raffles found",
          checked_date: targetDate,
        }),
      };
    }

    const results = [];

    for (const raffle of expiredRaffles) {
      try {
        logger.info("Processing expired raffle", {
          operation: "check-expired-raffles",
          raffle_id: raffle.raffle_id,
        });

        if (raffle.current_participants === 0) {
          logger.info("Raffle has no participants, skipping", {
            operation: "check-expired-raffles",
            raffle_id: raffle.raffle_id,
          });
          results.push({
            raffle_id: raffle.raffle_id,
            status: "skipped",
            reason: "no_participants",
          });
          continue;
        }

        const closedTimestamp = new Date().toISOString();

        const updateParams = {
          TableName: process.env.DYNAMODB_RAFFLES_TABLE,
          Key: { raffle_id: raffle.raffle_id },
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

        logger.info("Raffle closed, emitting event", {
          operation: "check-expired-raffles",
          raffle_id: raffle.raffle_id,
        });

        try {
          const eventDetail = {
            raffle_id: raffle.raffle_id,
            title: raffle.title,
            status: "processing",
            previous_status: "active",
            closed_at: closedTimestamp,
            current_participants: raffle.current_participants,
            max_participants: raffle.max_participants,
            triggered_by: "automated_expiration",
          };

          const putEventsCommand = new PutEventsCommand({
            Entries: [
              {
                EventBusName: process.env.EVENT_BUS_NAME,
                Source: "rafflenow.raffles",
                DetailType: "raffle.closed",
                Detail: JSON.stringify(eventDetail),
              },
            ],
          });

          await eventBridgeClient.send(putEventsCommand);

          logger.logExternalCall("EventBridge", "PutEvents", {
            operation: "check-expired-raffles",
            event_type: "raffle.closed",
            raffle_id: raffle.raffle_id,
          });
        } catch (eventError) {
          logger.error("Error emitting raffle.closed event", eventError, {
            operation: "check-expired-raffles",
            fatal: false,
          });
        }

        results.push({
          raffle_id: raffle.raffle_id,
          status: "closed",
          closed_at: closedTimestamp,
        });
      } catch (error) {
        logger.error("Error processing individual raffle", error, {
          operation: "check-expired-raffles",
          raffle_id: raffle.raffle_id,
        });

        results.push({
          raffle_id: raffle.raffle_id,
          status: "error",
          error: error.message,
        });
      }
    }

    logger.info("Expired raffles processing completed", {
      operation: "check-expired-raffles",
      total_found: expiredRaffles.length,
      results_count: results.length,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Expired raffles processed",
        total_found: expiredRaffles.length,
        results: results,
      }),
    };
  } catch (error) {
    logger.error("Fatal error checking expired raffles", error, {
      operation: "check-expired-raffles",
      fatal: true,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error checking expired raffles",
        error: error.message,
      }),
    };
  }
};
