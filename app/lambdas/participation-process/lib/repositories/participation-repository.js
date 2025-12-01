import { randomUUID } from 'crypto'
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const PARTICIPANTS_TABLE = process.env.DYNAMODB_PARTICIPATIONS_TABLE

export async function checkExistingParticipation(userId, raffleId) {
  const command = new QueryCommand({
    TableName: PARTICIPANTS_TABLE,
    IndexName: 'UserIdRaffleIdIndex',
    KeyConditionExpression: 'user_id = :userId AND raffle_id = :raffleId',
    ExpressionAttributeValues: {
      ':userId': userId,
      ':raffleId': raffleId
    },
    Limit: 1
  })

  const response = await docClient.send(command)
  return response.Items && response.Items.length > 0
}

export async function createParticipation(participationData) {
  const participationId = `participation-${randomUUID()}`

  const item = {
    participation_id: participationId,
    raffle_id: participationData.raffleId,
    participant_email: participationData.participantEmail,
    participant_name: participationData.participantName,
    user_id: participationData.userId,
    participated_at: participationData.participatedAt
  }

  const command = new PutCommand({
    TableName: PARTICIPANTS_TABLE,
    Item: item,
    ConditionExpression: 'attribute_not_exists(participation_id)'
  })

  try {
    await docClient.send(command)

    logger.info('Participation record created', {
      raffle_id: participationData.raffleId,
      participant_email: participationData.participantEmail,
      participation_id: participationId
    })

    return participationId
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logger.warn('Duplicate participation detected (UUID collision)', {
        raffle_id: participationData.raffleId,
        participant_email: participationData.participantEmail
      })
      throw error
    }
    throw error
  }
}
