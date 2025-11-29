import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'
import { ProcessingError } from '../errors.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE

export async function getRaffle(raffleId) {
  const command = new GetCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId }
  })

  const result = await docClient.send(command)
  return result.Item
}

export async function incrementParticipantCount(raffleId, participatedAt) {
  const command = new UpdateCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      'SET current_participants = current_participants + :inc, updated_at = :updated_at',
    ConditionExpression:
      '#status = :active AND current_participants < max_participants',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':inc': 1,
      ':updated_at': participatedAt,
      ':active': 'active'
    },
    ReturnValues: 'UPDATED_NEW'
  })

  try {
    const result = await docClient.send(command)

    logger.info('Participant count incremented', {
      raffle_id: raffleId,
      new_count: result.Attributes?.current_participants
    })

    return result.Attributes?.current_participants
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.error('Raffle full or not active during counter increment', {
        raffle_id: raffleId
      })
      throw new ProcessingError(
        'Raffle became full or inactive during processing',
        { raffle_id: raffleId }
      )
    }
    throw error
  }
}
