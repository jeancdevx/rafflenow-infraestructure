const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb')

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event))

  const claims = event.requestContext?.authorizer?.claims
  if (!claims) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Unauthorized',
        error: 'Authentication required to participate',
      }),
    }
  }

  const authenticatedEmail = claims.email

  try {
    const raffleId = event.pathParameters?.id
    if (!raffleId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Missing raffle_id in path',
        }),
      }
    }

    const body = JSON.parse(event.body)
    const requiredFields = ['participant_name', 'participant_email']

    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            message: 'Validation error',
            error: `Missing required field: ${field}`,
          }),
        }
      }
    }

    // Verificar que el sorteo existe y está activo
    const getRaffleCommand = new GetCommand({
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
    })

    const raffleResponse = await docClient.send(getRaffleCommand)

    if (!raffleResponse.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Raffle not found',
        }),
      }
    }

    const raffle = raffleResponse.Item

    if (raffle.status !== 'active') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Raffle is not active',
          status: raffle.status,
        }),
      }
    }

    // Verificar si se llegó al máximo de participantes
    if (raffle.current_participants >= raffle.max_participants) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Raffle is full',
          current_participants: raffle.current_participants,
          max_participants: raffle.max_participants,
        }),
      }
    }

    // Verificar si ya pasó la fecha de cierre
    const now = new Date()
    const endDate = new Date(raffle.end_date)
    if (now > endDate) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Raffle has ended',
        }),
      }
    }

    const participationTimestamp = new Date().toISOString()

    // Registrar participación
    const participant = {
      raffle_id: raffleId,
      participant_email: body.participant_email.toLowerCase(),
      participant_name: body.participant_name,
      participated_at: participationTimestamp,
      participant_phone: body.participant_phone || null,
    }

    const putParticipantCommand = new PutCommand({
      TableName: process.env.DYNAMODB_PARTICIPANTS_TABLE,
      Item: participant,
      ConditionExpression:
        'attribute_not_exists(raffle_id) AND attribute_not_exists(participant_email)',
    })

    await docClient.send(putParticipantCommand)

    // Incrementar contador de participantes en el sorteo
    const updateRaffleCommand = new UpdateCommand({
      TableName: process.env.DYNAMODB_RAFFLES_TABLE,
      Key: { raffle_id: raffleId },
      UpdateExpression:
        'SET current_participants = current_participants + :inc, updated_at = :updated_at',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':updated_at': participationTimestamp,
      },
      ReturnValues: 'ALL_NEW',
    })

    const updatedRaffle = await docClient.send(updateRaffleCommand)

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Participation registered successfully',
        participant: participant,
        raffle: updatedRaffle.Attributes,
      }),
    }
  } catch (error) {
    console.error('Error:', error)

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'User already participating in this raffle',
        }),
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error registering participation',
        error: error.message,
      }),
    }
  }
}
