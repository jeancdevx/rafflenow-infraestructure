const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const Logger = require("./logger");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
  const logger = new Logger(context);
  logger.logRequest(event);

  try {
    logger.info("Scanning raffles", { operation: "list-raffles" });

    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE,
    });

    logger.logDbOperation("Scan", process.env.DYNAMODB_TABLE, {
      operation: "list-raffles",
    });
    const response = await docClient.send(command);

    logger.info("Raffles retrieved successfully", {
      operation: "list-raffles",
      count: response.Items.length,
    });

    logger.logResponse(200, "Raffles retrieved successfully");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Raffles retrieved successfully",
        count: response.Items.length,
        raffles: response.Items,
      }),
    };
  } catch (error) {
    logger.error("Error retrieving raffles", error, {
      operation: "list-raffles",
      fatal: true,
    });
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Error retrieving raffles",
        error: error.message,
      }),
    };
  }
};
