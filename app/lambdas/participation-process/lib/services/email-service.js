import { SendTemplatedEmailCommand, SESClient } from '@aws-sdk/client-ses'

import { logger } from '../powertools.js'
import { formatCurrency, formatDate } from '../utils.js'

const sesClient = new SESClient()

const SES_SENDER_EMAIL = process.env.SES_SENDER_EMAIL
const SES_PARTICIPATION_TEMPLATE = process.env.SES_PARTICIPATION_TEMPLATE
const SES_CONFIGURATION_SET = process.env.SES_CONFIGURATION_SET

export async function sendParticipationConfirmation(participationData, raffle) {
  const templateData = {
    participant_name: participationData.participantName,
    raffle_title: raffle.title,
    prize_description: raffle.prize_description || raffle.description,
    prize_value: formatCurrency(raffle.prize_value),
    end_date: formatDate(raffle.end_date),
    participation_number:
      participationData.participationNumber || raffle.current_participants
  }

  const params = {
    Source: SES_SENDER_EMAIL,
    Destination: {
      ToAddresses: [participationData.participantEmail]
    },
    Template: SES_PARTICIPATION_TEMPLATE,
    TemplateData: JSON.stringify(templateData),
    ConfigurationSetName: SES_CONFIGURATION_SET
  }

  try {
    const command = new SendTemplatedEmailCommand(params)
    const response = await sesClient.send(command)

    logger.info('Participation confirmation email sent', {
      message_id: response.MessageId,
      recipient: participationData.participantEmail,
      raffle_id: participationData.raffleId
    })

    return true
  } catch (error) {
    logger.error('Failed to send participation confirmation email', {
      error: error.message,
      error_name: error.name,
      recipient: participationData.participantEmail,
      raffle_id: participationData.raffleId
    })

    return false
  }
}
