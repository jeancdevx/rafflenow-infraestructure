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

export async function handleCreateRaffle(event) {
  const claims = extractClaims(event)
  ensureIsAdmin(claims)

  const adminEmail = getUserEmail(claims)
  const body = JSON.parse(event.body)

  logger.info('Creating new raffle', { admin_email: adminEmail })

  validateRequiredFields(body)
  validateTitle(body.title)
  validateDescription(body.description)
  validatePrizeImages(body.prize_images)

  const prizeValue = validatePrizeValue(body.prize_value)
  const maxParticipants = calculateMaxParticipants(prizeValue)
  const category = calculateCategory(prizeValue)
  const durationDays = calculateDefaultDuration(prizeValue)

  logger.info('Raffle parameters calculated automatically', {
    prize_value: prizeValue,
    category: category,
    duration_days: durationDays,
    max_participants: maxParticipants
  })

  const now = new Date()
  const startDate = now
  const endDate = calculateEndDate(startDate, prizeValue)

  logger.info('Raffle dates calculated', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration_days: durationDays,
    category: category
  })

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

  await publishRaffleCreatedEvent(raffle)

  metrics.addMetric('RaffleCreated', MetricUnit.Count, 1)
  metrics.addMetric('RaffleDuration', MetricUnit.Count, durationDays)

  return raffle
}
