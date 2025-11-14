const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const Logger = require("./logger");

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    logger.warn("Unauthorized access attempt", { operation: "close-raffle" });
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Unauthorized",
        error: "Authentication required",
      }),
    };
  }

  const groups = claims["cognito:groups"];
  const isAdmin =
    groups &&
    (Array.isArray(groups) ? groups.includes("Admin") : groups === "Admin");

  if (!isAdmin) {
    logger.warn("Forbidden: non-admin user attempted to close raffle", {
      operation: "close-raffle",
    });
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Forbidden",
        error: "Admin role required to close raffles",
      }),
    };
  }

  try {
    const raffleId = event.pathParameters?.id;
    if (!raffleId) {
      logger.warn("Missing raffle_id in path", { operation: "close-raffle" });
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

    // Obtener el sorteo
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

    // Verificar que el sorteo está activo
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

    // Verificar que hay participantes
    if (raffle.current_participants === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Cannot close raffle with no participants",
        }),
      };
    }

    const closedTimestamp = new Date().toISOString();

    // Actualizar el estado del sorteo a "processing"
    // ConditionExpression evita race conditions si dos admins intentan cerrar al mismo tiempo
    const updateRaffleCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
      UpdateExpression:
        "SET #status = :status, closed_at = :closed_at, updated_at = :updated_at",
      ConditionExpression: "#status = :active_status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": "processing",
        ":closed_at": closedTimestamp,
        ":updated_at": closedTimestamp,
        ":active_status": "active",
      },
      ReturnValues: "ALL_NEW",
    });

    const updatedRaffle = await docClient.send(updateRaffleCommand);

    // Enviar mensaje a SQS para procesar el ganador
    const sqsMessage = {
      raffle_id: raffleId,
      action: "select_winner",
      timestamp: closedTimestamp,
    };

    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(sqsMessage),
      MessageAttributes: {
        raffle_id: {
          DataType: "String",
          StringValue: raffleId,
        },
        action: {
          DataType: "String",
          StringValue: "select_winner",
        },
      },
    });

    const sqsResponse = await sqsClient.send(sendMessageCommand);

    logger.logExternalCall("SQS", "SendMessage", {
      operation: "close-raffle",
      message_id: sqsResponse.MessageId,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffle closed successfully and winner selection initiated",
        raffle: updatedRaffle.Attributes,
        sqs_message_id: sqsResponse.MessageId,
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
          message: "Raffle is not in active status or was already closed",
        }),
      };
    }

    logger.error("Error closing raffle", error, {
      operation: "close-raffle",
      fatal: true,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error closing raffle",
        error: error.message,
      }),
    };
  }
};
