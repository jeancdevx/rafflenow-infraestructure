import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../clients.js'
import { logger } from '../powertools.js'
import { NotFoundError } from '../errors.js'

const RAFFLES_TABLE = process.env.DYNAMODB_RAFFLES_TABLE

export async function getRaffle(raffleId) {
  logger.info('Fetching raffle from DynamoDB', { raffle_id: raffleId })

  const command = new GetCommand({
    TableName: RAFFLES_TABLE,
    Key: { raffle_id: raffleId }
  })

  const response = await docClient.send(command)

  if (!response.Item) {
    logger.warn('Raffle not found', { raffle_id: raffleId })
    throw new NotFoundError('Raffle not found')
  }

  return response.Item
}
