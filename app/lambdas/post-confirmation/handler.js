import { logger } from './lib/powertools.js'

import { addUserToGroup } from './lib/services/cognito-service.js'

import { DEFAULT_GROUP, TRIGGER_SOURCES } from './lib/constants.js'

export async function handlePostConfirmation(event) {
  const { triggerSource, userPoolId, userName, request } = event

  logger.info('Post confirmation trigger received', {
    triggerSource,
    userName,
    userAttributes: request?.userAttributes
  })

  if (triggerSource !== TRIGGER_SOURCES.CONFIRM_SIGN_UP) {
    logger.info('Skipping - not a signup confirmation', { triggerSource })
    return
  }

  await addUserToGroup(userPoolId, userName, DEFAULT_GROUP)

  logger.info('User successfully added to default group', {
    userName,
    group: DEFAULT_GROUP
  })
}
