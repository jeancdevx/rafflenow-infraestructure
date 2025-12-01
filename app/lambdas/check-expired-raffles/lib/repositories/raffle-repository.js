import { QueryCommand } from '@aws-sdk/lib-dynamodb'

import { docClient } from '../clients.js'
import { logger } from '../powertools.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE

export async function queryExpiredRaffles(targetDate) {
  logger.info('Querying expired raffles', {
    target_date: targetDate,
    index: 'StatusEndDateIndex'
  })

  const command = new QueryCommand({
    TableName: RAFFLES_TABLE,
    IndexName: 'StatusEndDateIndex',
    KeyConditionExpression: '#status = :active AND #endDate <= :targetDate',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#endDate': 'end_date'
    },
    ExpressionAttributeValues: {
      ':active': 'active',
      ':targetDate': targetDate
    }
  })

  const result = await docClient.send(command)
  return result.Items || []
}
