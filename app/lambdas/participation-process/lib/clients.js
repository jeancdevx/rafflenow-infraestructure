import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { tracer } from './powertools.js'

const dynamoClient = new DynamoDBClient({})
const docClient = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(dynamoClient)
)

export { docClient }
