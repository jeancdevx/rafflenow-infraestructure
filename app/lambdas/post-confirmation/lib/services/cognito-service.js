import { AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider'

import { cognitoClient } from '../clients.js'
import { logger } from '../powertools.js'

export async function addUserToGroup(userPoolId, username, groupName) {
  logger.info('Adding user to group', {
    userPoolId,
    username,
    groupName
  })

  const command = new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: username,
    GroupName: groupName
  })

  await cognitoClient.send(command)

  logger.info('User added to group successfully', {
    username,
    groupName
  })
}
