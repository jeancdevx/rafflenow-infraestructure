import { S3Client } from '@aws-sdk/client-s3'

import { tracer } from './powertools.js'

const s3Client = tracer.captureAWSv3Client(new S3Client({}))

export { s3Client }
