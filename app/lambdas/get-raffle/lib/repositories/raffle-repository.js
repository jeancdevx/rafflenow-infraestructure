import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../clients.js'
import { NotFoundError } from '../errors.js'
import { logger } from '../powertools.js'

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

export async function checkUserParticipation(raffleId, userId) {
  if (!userId) {
    return false
  }

  try {
    const command = new QueryCommand({
      TableName: PARTICIPANTS_TABLE,
      IndexName: 'UserIdRaffleIdIndex',
      KeyConditionExpression: 'user_id = :user_id AND raffle_id = :raffle_id',
      ExpressionAttributeValues: {
        ':user_id': userId,
        ':raffle_id': raffleId
      },
      Limit: 1
    })

    const result = await docClient.send(command)
    const participated = result.Items && result.Items.length > 0

    logger.info('Participation check completed', {
      raffleId,
      userId,
      participated
    })

    return participated
  } catch (error) {
    logger.error('Error checking participation', {
      error: error.message,
      raffleId,
      userId
    })
    return false
  }
}
