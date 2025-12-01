import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE

export async function closeRaffle(raffleId, closedBy, hasParticipants) {
  const now = new Date().toISOString()
  const newStatus = hasParticipants ? 'processing' : 'closed'

  const command = new UpdateCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      'SET #status = :new_status, closed_at = :closed_at, updated_at = :updated_at, closed_by = :closed_by',
    ConditionExpression: '#status = :active',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':new_status': newStatus,
      ':closed_at': now,
      ':updated_at': now,
      ':closed_by': closedBy,
      ':active': 'active'
    },
    ReturnValues: 'ALL_NEW'
  })

  const result = await docClient.send(command)

  logger.info('Raffle closed successfully', {
    raffle_id: raffleId,
    new_status: newStatus,
    closed_by: closedBy
  })

  return result.Attributes
}
