const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { randomUUID } = require("crypto");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));

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

    const raffleId = `raffle-${randomUUID()}`;
    const now = new Date().toISOString();

    const raffle = {
      raffle_id: raffleId,
      title: body.title,
      description: body.description,
      status: "active",
      start_date: body.start_date || now,
      end_date: body.end_date,
      max_participants: parseInt(body.max_participants),
      current_participants: 0,
      prize_image_url: body.prize_image_url || "",
      created_by: body.created_by || "system",
      created_at: now,
      updated_at: now,
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
