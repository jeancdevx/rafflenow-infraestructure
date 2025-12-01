import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { EventBridgeClient } from '@aws-sdk/client-eventbridge'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

import { tracer } from './powertools.js'

const dynamoClient = new DynamoDBClient({})
const docClient = tracer.captureAWSv3Client(
  DynamoDBDocumentClient.from(dynamoClient)
)
const eventBridgeClient = tracer.captureAWSv3Client(new EventBridgeClient({}))

export { docClient, eventBridgeClient }
