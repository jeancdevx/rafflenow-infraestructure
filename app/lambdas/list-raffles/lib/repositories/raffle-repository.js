import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const TABLE_NAME = process.env.DYNAMODB_TABLE
const STATUS_INDEX = 'StatusEndDateIndex'

export async function queryRafflesByStatus(status, limit, exclusiveStartKey) {
  logger.debug('Querying raffles by status', { status, limit })

  const params = {
    TableName: TABLE_NAME,
    IndexName: STATUS_INDEX,
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status'
    },
    ExpressionAttributeValues: {
      ':status': status
    },
    Limit: limit,
    ScanIndexForward: true
  }

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey
  }

  const command = new QueryCommand(params)
  const response = await docClient.send(command)

  return {
    items: response.Items || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
    scannedCount: response.ScannedCount || 0
  }
}

export async function scanAllRaffles(limit, exclusiveStartKey) {
  logger.debug('Scanning all raffles', { limit })

  const params = {
    TableName: TABLE_NAME,
    Limit: limit
  }

  if (exclusiveStartKey) {
    params.ExclusiveStartKey = exclusiveStartKey
  }

  const command = new ScanCommand(params)
  const response = await docClient.send(command)

  return {
    items: response.Items || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
    scannedCount: response.ScannedCount || 0
  }
}
