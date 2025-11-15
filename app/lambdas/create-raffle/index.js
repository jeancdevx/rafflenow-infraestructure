const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const {
  EventBridgeClient,
  PutEventsCommand,
} = require("@aws-sdk/client-eventbridge");
const { randomUUID } = require("crypto");
const Logger = require("./logger");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const eventBridgeClient = new EventBridgeClient({});

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
    logger.warn("Unauthorized access attempt", { operation: "create-raffle" });
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
    logger.warn("Forbidden: non-admin user attempted to create raffle", {
      operation: "create-raffle",
    });
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Forbidden",
        error: "Admin role required to create raffles",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    logger.info("Creating new raffle", { operation: "create-raffle" });

    const requiredFields = [
      "title",
      "description",
      "end_date",
      "max_participants",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        logger.warn("Validation error: missing required field", {
          operation: "create-raffle",
          missing_field: field,
        });
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

    const now = new Date();
    const startDate = body.start_date ? new Date(body.start_date) : now;

    let endDate;
    if (body.end_date.includes("T")) {
      endDate = new Date(body.end_date);
      if (endDate.getUTCHours() !== 23 || endDate.getUTCMinutes() !== 59) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            message: "Validation error",
            error:
              "end_date must be set to 23:59 UTC. Use format: YYYY-MM-DD or YYYY-MM-DDT23:59:00Z",
          }),
        };
      }
    } else {
      endDate = new Date(`${body.end_date}T23:59:00Z`);
    }

    const diffMs = endDate - startDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "Raffle must last at least 7 days",
          duration_days: Math.floor(diffDays),
        }),
      };
    }

    if (diffDays > 60) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "Raffle cannot last more than 60 days",
          duration_days: Math.floor(diffDays),
        }),
      };
    }

    if (!body.prize_images || !Array.isArray(body.prize_images)) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "prize_images is required and must be an array",
        }),
      };
    }

    if (body.prize_images.length < 1) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "At least 1 prize image is required",
          images_count: body.prize_images.length,
        }),
      };
    }

    if (body.prize_images.length > 5) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "Maximum 5 prize images allowed",
          images_count: body.prize_images.length,
        }),
      };
    }

    for (let i = 0; i < body.prize_images.length; i++) {
      if (
        typeof body.prize_images[i] !== "string" ||
        body.prize_images[i].trim() === ""
      ) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            message: "Validation error",
            error: `prize_images[${i}] must be a non-empty string URL`,
          }),
        };
      }
    }

    const raffleId = `raffle-${randomUUID()}`;
    const nowISO = new Date().toISOString();
    const createdByEmail = claims.email;

    const raffle = {
      raffle_id: raffleId,
      title: body.title,
      description: body.description,
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      max_participants: parseInt(body.max_participants),
      current_participants: 0,
      prize_images: body.prize_images,
      created_by: createdByEmail,
      created_at: nowISO,
      updated_at: nowISO,
    };

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: raffle,
      ConditionExpression: "attribute_not_exists(raffle_id)",
    });

    await docClient.send(command);

    logger.info("Raffle created in DynamoDB, emitting event to EventBridge", {
      operation: "create-raffle",
      raffle_id: raffleId,
    });

    try {
      const eventCommand = new PutEventsCommand({
        Entries: [
          {
            Source: "rafflenow.raffles",
            DetailType: "raffle.created",
            Detail: JSON.stringify({
              raffle_id: raffleId,
              title: body.title,
              description: body.description,
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              max_participants: parseInt(body.max_participants),
              prize_images: body.prize_images,
              created_by: createdByEmail,
              created_at: nowISO,
            }),
            EventBusName: process.env.EVENT_BUS_NAME,
          },
        ],
      });

      await eventBridgeClient.send(eventCommand);

      logger.info("Event emitted to EventBridge successfully", {
        operation: "create-raffle",
        raffle_id: raffleId,
        event_type: "raffle.created",
      });
    } catch (eventError) {
      logger.error("Failed to emit event to EventBridge", eventError, {
        operation: "create-raffle",
        raffle_id: raffleId,
        non_fatal: true,
      });
    }

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffle created successfully",
        raffle: raffle,
      }),
    };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      logger.warn("Raffle already exists", {
        operation: "create-raffle",
        error_type: "ConditionalCheckFailed",
      });
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "Raffle already exists",
        }),
      };
    }

    logger.error("Error creating raffle", error, {
      operation: "create-raffle",
      fatal: true,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error creating raffle",
        error: error.message,
      }),
    };
  }
};
