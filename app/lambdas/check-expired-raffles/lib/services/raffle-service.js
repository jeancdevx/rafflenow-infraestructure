import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE

export async function closeRaffleToProcessing(raffleId) {
  const closedTimestamp = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      'SET #status = :processing, closed_at = :closed_at, updated_at = :updated_at, closed_by = :closed_by',
    ConditionExpression: '#status = :active',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':processing': 'processing',
      ':closed_at': closedTimestamp,
      ':updated_at': closedTimestamp,
      ':active': 'active',
      ':closed_by': 'system-automated'
    }
  })

  await docClient.send(command)

  logger.info('Raffle status updated to processing', {
    raffle_id: raffleId,
    closed_at: closedTimestamp
  })

  return closedTimestamp
}

export async function closeRaffleDirectly(raffleId) {
  const closedTimestamp = new Date().toISOString()

  const command = new UpdateCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId },
    UpdateExpression:
      'SET #status = :closed, closed_at = :closed_at, updated_at = :updated_at, closed_by = :closed_by',
    ConditionExpression: '#status = :active',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':closed': 'closed',
      ':closed_at': closedTimestamp,
      ':updated_at': closedTimestamp,
      ':active': 'active',
      ':closed_by': 'system-automated'
    }
  })

  await docClient.send(command)

  logger.info('Raffle closed without participants', {
    raffle_id: raffleId,
    closed_at: closedTimestamp
  })

  return closedTimestamp
}
