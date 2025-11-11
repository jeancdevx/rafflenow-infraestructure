const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Verificador de JWT de Cognito (solo se inicializa si hay variables de entorno)
let verifier = null;
if (process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_CLIENT_ID,
  });
}

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

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
          message: "Missing raffle_id in path parameters",
        }),
      };
    }

    const command = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        raffle_id: raffleId,
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
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

    const raffle = response.Item;

    // Intentar verificar el token del header Authorization (opcional)
    let userEmail = null;
    const authHeader =
      event.headers?.Authorization || event.headers?.authorization;

    if (authHeader && verifier) {
      try {
        const token = authHeader.replace("Bearer ", "").trim();
        const payload = await verifier.verify(token);
        userEmail = payload.email?.toLowerCase();
      } catch (error) {
        console.log("Token verification failed (optional):", error.message);
        // No hacer nada, el token es opcional
      }
    }

    // Si tenemos email del usuario, verificar si ya participó
    let hasParticipated = false;
    if (userEmail && process.env.DYNAMODB_PARTICIPANTS_TABLE) {
      try {
        const checkParticipationCommand = new GetCommand({
          TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
          Key: {
            raffle_id: raffleId,
            participant_email: userEmail,
          },
        });

        const participationResponse = await docClient.send(
          checkParticipationCommand
        );
        hasParticipated = !!participationResponse.Item;
      } catch (error) {
        console.error("Error checking participation:", error);
      }
    }

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
    console.error("Error:", error);

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
