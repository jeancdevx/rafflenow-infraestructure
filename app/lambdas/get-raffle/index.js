const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const Logger = require("./logger");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

let verifier = null;
if (process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID,
  });
}

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  try {
    const raffleId = event.pathParameters?.id;

    if (!raffleId) {
      logger.warn("Missing raffle_id in path parameters", {
        pathParameters: event.pathParameters,
      });

      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing raffle_id in path parameters",
        }),
      };
    }

    logger.info("Fetching raffle", {
      operation: "get-raffle",
    });

    const command = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        raffle_id: raffleId,
      },
    });

    logger.logDbOperation("GetItem", process.env.DYNAMODB_TABLE, {
      operation: "fetch-raffle",
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      logger.warn("Raffle not found", {
        operation: "get-raffle",
        found: false,
      });

      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Raffle not found",
          raffle_id: raffleId,
        }),
      };
    }

    logger.info("Raffle retrieved successfully", {
      operation: "get-raffle",
      found: true,
    });

    const raffle = response.Item;

    let userEmail = null;
    const authHeader =
      event.headers?.Authorization || event.headers?.authorization;

    if (authHeader && verifier) {
      try {
        logger.info("Verifying JWT token", {
          operation: "token-verification",
        });

        const token = authHeader.replace("Bearer ", "").trim();
        const payload = await verifier.verify(token);
        userEmail = payload.email?.toLowerCase();

        logger.info("Token verified successfully", {
          operation: "token-verification",
          authenticated: true,
        });
      } catch (error) {
        logger.warn("Token verification failed (optional)", {
          operation: "token-verification",
          authenticated: false,
          reason: error.message,
        });
      }
    }

    let hasParticipated = false;
    if (userEmail && process.env.DYNAMODB_PARTICIPANTS_TABLE) {
      try {
        logger.info("Checking user participation", {
          operation: "check-participation",
        });

        const checkParticipationCommand = new GetCommand({
          TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
          Key: {
            raffle_id: raffleId,
            participant_email: userEmail,
          },
        });

        logger.logDbOperation(
          "GetItem",
          process.env.DYNAMODB_PARTICIPANTS_TABLE,
          {
            operation: "check-participation",
          }
        );

        const participationResponse = await docClient.send(
          checkParticipationCommand
        );
        hasParticipated = !!participationResponse.Item;

        logger.info("Participation check completed", {
          operation: "check-participation",
          has_participated: hasParticipated,
        });
      } catch (error) {
        logger.error("Error checking participation", error, {
          operation: "check-participation",
        });
      }
    }

    logger.logResponse(200, "Raffle retrieved successfully");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffle retrieved successfully",
        raffle: raffle,
        user_has_participated: hasParticipated,
      }),
    };
  } catch (error) {
    logger.error("Unexpected error retrieving raffle", error, {
      operation: "get-raffle",
      fatal: true,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Error retrieving raffle",
        error: error.message,
      }),
    };
  }
};
