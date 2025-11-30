import { logger, metrics } from './lib/powertools.js'
import { MetricUnit } from '@aws-lambda-powertools/metrics'
import {
  extractClaims,
  ensureIsAdmin,
  getUserEmail
} from './lib/validators/auth.js'
import {
  validateRequiredFields,
  validateTitle,
  validateDescription,
  validatePrizeImages,
  calculateMaxParticipants,
  validatePrizeValue,
  calculateCategory,
  calculateDefaultDuration,
  calculateEndDate
} from './lib/validators/business-rules.js'
import { createRaffle } from './lib/repositories/raffle-repository.js'
import { publishRaffleCreatedEvent } from './lib/services/event-publisher.js'

const Actions = {
  AUTH_VALIDATED: 'AUTH_VALIDATED',
  INPUT_VALIDATED: 'INPUT_VALIDATED',
  PARAMETERS_CALCULATED: 'PARAMETERS_CALCULATED',
  RAFFLE_SAVED: 'RAFFLE_SAVED',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED'
}

export async function handleCreateRaffle(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const adminEmail = getUserEmail(claims)
  const body = JSON.parse(event.body)

  logger.appendKeys({ admin_email: adminEmail })

  logger.info('Admin authenticated', {
    action: Actions.AUTH_VALIDATED,
    admin_email: adminEmail
  })

  validateRequiredFields(body)
  validateTitle(body.title)
  validateDescription(body.description)
  validatePrizeImages(body.prize_images)

  logger.info('Input validated', {
    action: Actions.INPUT_VALIDATED,
    title_length: body.title.length,
    description_length: body.description.length,
    image_count: body.prize_images.length
  })

  const prizeValue = validatePrizeValue(body.prize_value)
  const maxParticipants = calculateMaxParticipants(prizeValue)
  const category = calculateCategory(prizeValue)
  const durationDays = calculateDefaultDuration(prizeValue)

  logger.info('Raffle parameters calculated', {
    action: Actions.PARAMETERS_CALCULATED,
    prize_value: prizeValue,
    category: category,
    duration_days: durationDays,
    max_participants: maxParticipants
  })

  const now = new Date()
  const startDate = now
  const endDate = calculateEndDate(startDate, prizeValue)

  const raffleData = {
    title: body.title,
    description: body.description,
    startDate: startDate,
    endDate: endDate,
    maxParticipants: maxParticipants,
    prizeValue: prizeValue,
    category: category,
    prizeImages: body.prize_images
  }

  const raffle = await createRaffle(raffleData, adminEmail)

  logger.appendKeys({
    raffle_id: raffle.id,
    raffle_title: raffle.title
  })

  logger.info('Raffle saved to database', {
    action: Actions.RAFFLE_SAVED,
    raffle_id: raffle.id,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString()
  })

  await publishRaffleCreatedEvent(raffle)

  logger.info('Raffle created event published', {
    action: Actions.EVENT_PUBLISHED,
    raffle_id: raffle.id
  })

  metrics.addMetric('RaffleCreated', MetricUnit.Count, 1)
  metrics.addMetric('RaffleDuration', MetricUnit.Count, durationDays)

  return raffle
}
