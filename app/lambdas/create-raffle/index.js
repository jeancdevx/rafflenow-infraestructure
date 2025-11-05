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

    // Validaciones de reglas de negocio
    const now = new Date();
    const startDate = body.start_date ? new Date(body.start_date) : now;
    
    // end_date puede venir como solo fecha "2025-11-15" o como ISO completo
    let endDate;
    if (body.end_date.includes('T')) {
      // Ya viene con hora, validar que sea 23:59:00
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
      // Solo fecha, agregar 23:59:00 UTC automáticamente
      endDate = new Date(`${body.end_date}T23:59:00Z`);
    }

    // Validar duración mínima (7 días)
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

    // Validar duración máxima (60 días)
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

    const raffleId = `raffle-${randomUUID()}`;
    const nowISO = new Date().toISOString();

    const raffle = {
      raffle_id: raffleId,
      title: body.title,
      description: body.description,
      status: "active",
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      max_participants: parseInt(body.max_participants),
      current_participants: 0,
      prize_image_url: body.prize_image_url || "",
      created_by: body.created_by || "system",
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
