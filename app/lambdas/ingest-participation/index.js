const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const {
  EventBridgeClient,
  PutEventsCommand,
} = require("@aws-sdk/client-eventbridge");
const Logger = require("./logger");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    logger.warn("Unauthorized participation attempt", {
      operation: "ingest-participation",
    });
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Unauthorized",
        error: "Authentication required to participate",
      }),
    };
  }

  const authenticatedEmail = claims.email;
  logger.info("Processing participation request", {
    operation: "ingest-participation",
  });

  try {
    const raffleId = event.pathParameters?.id;
    if (!raffleId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing raffle_id in path",
        }),
      };
    }

    const body = JSON.parse(event.body);
    const requiredFields = ["participant_name", "participant_email"];

    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            message: "Validation error",
            error: `Missing required field: ${field}`,
          }),
        };
      }
    }

    const getRaffleCommand = new GetCommand({
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
    });

    const raffleResponse = await docClient.send(getRaffleCommand);

    if (!raffleResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle not found",
        }),
      };
    }

    const raffle = raffleResponse.Item;

    if (raffle.status !== "active") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle is not active",
          status: raffle.status,
        }),
      };
    }

    if (raffle.current_participants >= raffle.max_participants) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle is full",
          current_participants: raffle.current_participants,
          max_participants: raffle.max_participants,
        }),
      };
    }

    const now = new Date();
    const endDate = new Date(raffle.end_date);
    if (now > endDate) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle has ended",
        }),
      };
    }

    const participationTimestamp = new Date().toISOString();

    const participant = {
      raffle_id: raffleId,
      participant_email: body.participant_email.toLowerCase(),
      participant_name: body.participant_name,
      participated_at: participationTimestamp,
      participant_phone: body.participant_phone || null,
    };

    const putParticipantCommand = new PutCommand({
      TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
      Item: participant,
      ConditionExpression:
        "attribute_not_exists(raffle_id) AND attribute_not_exists(participant_email)",
    });

    await docClient.send(putParticipantCommand);

    const updateRaffleCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
      UpdateExpression:
        "SET current_participants = current_participants + :inc, updated_at = :updated_at",
      ExpressionAttributeValues: {
        ":inc": 1,
        ":updated_at": participationTimestamp,
      },
      ReturnValues: "ALL_NEW",
    });

    const updatedRaffle = await docClient.send(updateRaffleCommand);

    try {
      const eventDetail = {
        raffle_id: raffleId,
        raffle_title: raffle.title,
        participant_email: participant.participant_email,
        participant_name: participant.participant_name,
        participant_phone: participant.participant_phone,
        participated_at: participationTimestamp,
        current_participants: updatedRaffle.Attributes.current_participants,
        max_participants: updatedRaffle.Attributes.max_participants,
        raffle_status: raffle.status,
      };

      const putEventsCommand = new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.EVENT_BUS_NAME,
            Source: "rafflenow.participations",
            DetailType: "participation.received",
            Detail: JSON.stringify(eventDetail),
          },
        ],
      });

      await eventBridgeClient.send(putEventsCommand);

      logger.logExternalCall("EventBridge", "PutEvents", {
        operation: "ingest-participation",
        event_type: "participation.received",
        raffle_id: raffleId,
      });
    } catch (eventError) {
      logger.error("Error emitting participation.received event", eventError, {
        operation: "ingest-participation",
        fatal: false,
      });
    }

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Participation registered successfully",
        participant: participant,
        raffle: updatedRaffle.Attributes,
      }),
    };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "User already participating in this raffle",
        }),
      };
    }

    logger.error("Error registering participation", error, {
      operation: "ingest-participation",
      fatal: true,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error registering participation",
        error: error.message,
      }),
    };
  }
};
