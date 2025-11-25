import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE
const PARTICIPATIONS_TABLE = process.env.DYNAMODB_PARTICIPATIONS_TABLE

export async function getRaffle(raffleId) {
  logger.info('Fetching raffle from DynamoDB', { raffle_id: raffleId })

  const command = new GetCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId }
  })

  const response = await docClient.send(command)

  if (response.Item) {
    logger.info('Raffle found', {
      raffle_id: raffleId,
      status: response.Item.status,
      current_participants: response.Item.current_participants,
      max_participants: response.Item.max_participants
    })
  }

  return response.Item || null
}

export async function checkExistingParticipation(raffleId, userId) {
  logger.info('Checking for existing participation', {
    raffle_id: raffleId,
    user_id: userId
  })

  const command = new QueryCommand({
    TableName: PARTICIPATIONS_TABLE,
    IndexName: 'UserIdRaffleIdIndex',
    KeyConditionExpression: 'user_id = :userId AND raffle_id = :raffleId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':raffleId': raffleId
    },
    Limit: 1
  })

  const response = await docClient.send(command)
  const alreadyParticipated = response.Items && response.Items.length > 0

  if (alreadyParticipated) {
    logger.warn('User already participated in this raffle', {
      raffle_id: raffleId,
      user_id: userId
    })
  }

  return alreadyParticipated
}
