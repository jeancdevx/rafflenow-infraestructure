import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'
import { NotFoundError } from '../errors.js'

const RAFFLES_TABLE = process.env.DYNAMODB_TABLE
const PARTICIPANTS_TABLE = process.env.DYNAMODB_PARTICIPATIONS_TABLE

export async function getRaffleById(raffleId) {
  const command = new GetCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId }
  })

  const result = await docClient.send(command)

  if (!result.Item) {
    logger.warn('Raffle not found', { raffleId })
    throw new NotFoundError('Raffle not found')
  }

  logger.info('Raffle retrieved successfully', {
    raffleId,
    status: result.Item.status
  })

  return result.Item
}

export async function checkUserParticipation(raffleId, userEmail) {
  if (!userEmail) {
    return false
  }

  try {
    const command = new QueryCommand({
      TableName: PARTICIPANTS_TABLE,
      IndexName: 'RaffleIdIndex',
      KeyConditionExpression: 'raffle_id = :raffle_id',
      FilterExpression: 'participant_email = :email',
      ExpressionAttributeValues: {
        ':raffle_id': raffleId,
        ':email': userEmail
      },
      Limit: 1
    })

    const result = await docClient.send(command)
    const participated = result.Items && result.Items.length > 0

    logger.info('Participation check completed', {
      raffleId,
      userEmail,
      participated
    })

    return participated
  } catch (error) {
    logger.error('Error checking participation', {
      error: error.message,
      raffleId,
      userEmail
    })
    return false
  }
}
