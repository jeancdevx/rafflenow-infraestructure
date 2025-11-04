const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  try {
    // Extraer raffle_id de los path parameters
    const raffleId = event.pathParameters?.id;

    if (!raffleId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Missing raffle_id in path parameters',
        }),
      };
    }

    // Obtener el sorteo de DynamoDB
    const command = new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        raffle_id: raffleId,
      },
    });

    const response = await docClient.send(command);

    // Verificar si el sorteo existe
    if (!response.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Raffle not found',
          raffle_id: raffleId,
        }),
      };
    }

    // Retornar el sorteo encontrado
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Raffle retrieved successfully',
        raffle: response.Item,
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error retrieving raffle',
        error: error.message,
      }),
    };
  }
};
