const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  try {
    // Obtener fecha/hora actual
    const now = new Date();
    const targetDate = now.toISOString();
    
    console.log('Searching for raffles with status=active and end_date <=', targetDate);

    const queryParams = {
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      IndexName: 'StatusEndDateIndex',
      KeyConditionExpression: '#status = :active AND #endDate <= :targetDate',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#endDate': 'end_date',
      },
      ExpressionAttributeValues: {
        ':active': 'active',
        ':targetDate': targetDate,
      },
    };

    const queryResult = await docClient.send(new QueryCommand(queryParams));
    const expiredRaffles = queryResult.Items || [];

    console.log(`Found ${expiredRaffles.length} expired raffles`);

    if (expiredRaffles.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No expired raffles found',
          checked_date: targetDate,
        }),
      };
    }

    const results = [];

    // Procesar cada sorteo expirado
    for (const raffle of expiredRaffles) {
      try {
        console.log(`Processing raffle: ${raffle.raffle_id}`);

        // Verificar que tiene participantes
        if (raffle.current_participants === 0) {
          console.log(`Raffle ${raffle.raffle_id} has no participants, skipping`);
          results.push({
            raffle_id: raffle.raffle_id,
            status: 'skipped',
            reason: 'no_participants',
          });
          continue;
        }

        const closedTimestamp = new Date().toISOString();

        // Actualizar estado a "processing"
        const updateParams = {
          TableName: process.env.DYNAMODB_RAFFLES_TABLE,
          Key: { raffle_id: raffle.raffle_id },
          UpdateExpression:
            'SET #status = :processing, closed_at = :closed_at, updated_at = :updated_at',
          ConditionExpression: '#status = :active',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':processing': 'processing',
            ':closed_at': closedTimestamp,
            ':updated_at': closedTimestamp,
            ':active': 'active',
          },
        };

        await docClient.send(new UpdateCommand(updateParams));

        // Enviar mensaje a SQS para que worker-process seleccione el ganador
        const sqsMessage = {
          QueueUrl: process.env.SQS_QUEUE_URL,
          MessageBody: JSON.stringify({
            raffle_id: raffle.raffle_id,
            action: 'select_winner',
            triggered_by: 'automated_check',
            closed_at: closedTimestamp,
          }),
        };

        await sqsClient.send(new SendMessageCommand(sqsMessage));

        console.log(`Raffle ${raffle.raffle_id} closed and queued for winner selection`);

        results.push({
          raffle_id: raffle.raffle_id,
          status: 'closed',
          closed_at: closedTimestamp,
        });
      } catch (error) {
        console.error(`Error processing raffle ${raffle.raffle_id}:`, error);

        results.push({
          raffle_id: raffle.raffle_id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Expired raffles processed',
        total_found: expiredRaffles.length,
        results: results,
      }),
    };
  } catch (error) {
    console.error('Error checking expired raffles:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error checking expired raffles',
        error: error.message,
      }),
    };
  }
};
