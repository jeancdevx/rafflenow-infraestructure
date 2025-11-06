const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) {
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
  const isAdmin = groups && (Array.isArray(groups) ? groups.includes("Admin") : groups === "Admin");

  if (!isAdmin) {
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

    const requiredFields = [
      "title",
      "description",
      "end_date",
      "max_participants",
    ];
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

    const now = new Date();
    const startDate = body.start_date ? new Date(body.start_date) : now;
    
    let endDate;
    if (body.end_date.includes('T')) {
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
            error: "end_date must be set to 23:59 UTC. Use format: YYYY-MM-DD or YYYY-MM-DDT23:59:00Z",
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

    if (!body.prize_image_url || body.prize_image_url.trim() === "") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Validation error",
          error: "prize_image_url is required and cannot be empty",
        }),
      };
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
      prize_image_url: body.prize_image_url,
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
    console.error("Error:", error);

    if (error.name === "ConditionalCheckFailedException") {
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
