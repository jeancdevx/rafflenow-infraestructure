import { logger } from './lib/powertools.js'
import { handlePostConfirmation } from './handler.js'

export const handler = async (event, context) => {
  logger.addContext(context)

  try {
    await handlePostConfirmation(event)

    return event
  } catch (error) {
    logger.error('Error in post confirmation trigger', {
      error: error.message,
      stack: error.stack
    })

    return event
  }
}
