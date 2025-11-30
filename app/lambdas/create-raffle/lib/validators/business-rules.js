import { ValidationError, ErrorCodes } from '../errors.js'
import { logger } from '../powertools.js'

const TITLE_MIN_LENGTH = 10
const TITLE_MAX_LENGTH = 200
const DESCRIPTION_MIN_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 2000
const MIN_DURATION_DAYS = 7
const MAX_DURATION_DAYS = 60
const MIN_PRIZE_IMAGES = 1
const MAX_PRIZE_IMAGES = 5

const EXPECTED_PARTICIPANTS_BY_CATEGORY = {
  pequeño: 3000,
  mediano: 50000,
  grande: 250000,
  premium: 1500000
}

const MAX_PARTICIPANTS_MARGIN = 1.2

export function validateRequiredFields(body) {
  const requiredFields = ['title', 'description', 'prize_value', 'prize_images']

  for (const field of requiredFields) {
    if (!body[field]) {
      throw new ValidationError(
        `Missing required field: ${field}`,
        400,
        { field },
        ErrorCodes.MISSING_REQUIRED_FIELD
      )
    }
  }
}

export function validateTitle(title) {
  if (typeof title !== 'string') {
    throw new ValidationError(
      'Title must be a string',
      400,
      {},
      ErrorCodes.INVALID_TITLE
    )
  }

  const length = title.trim().length

  if (length < TITLE_MIN_LENGTH) {
    throw new ValidationError(
      `Title must be at least ${TITLE_MIN_LENGTH} characters`,
      400,
      { current_length: length },
      ErrorCodes.INVALID_TITLE
    )
  }

  if (length > TITLE_MAX_LENGTH) {
    throw new ValidationError(
      `Title cannot exceed ${TITLE_MAX_LENGTH} characters`,
      400,
      { current_length: length },
      ErrorCodes.INVALID_TITLE
    )
  }
}

export function validateDescription(description) {
  if (typeof description !== 'string') {
    throw new ValidationError(
      'Description must be a string',
      400,
      {},
      ErrorCodes.INVALID_DESCRIPTION
    )
  }

  const length = description.trim().length

  if (length < DESCRIPTION_MIN_LENGTH) {
    throw new ValidationError(
      `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`,
      400,
      { current_length: length },
      ErrorCodes.INVALID_DESCRIPTION
    )
  }

  if (length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(
      `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`,
      400,
      { current_length: length },
      ErrorCodes.INVALID_DESCRIPTION
    )
  }
}

export function validateEndDate(endDateInput) {
  let endDate

  if (endDateInput.includes('T')) {
    endDate = new Date(endDateInput)

    if (endDate.getUTCHours() !== 23 || endDate.getUTCMinutes() !== 59) {
      throw new ValidationError(
        'end_date must be set to 23:59 UTC. Use format: YYYY-MM-DD or YYYY-MM-DDT23:59:00Z',
        400,
        {},
        ErrorCodes.INVALID_END_DATE
      )
    }
  } else {
    endDate = new Date(`${endDateInput}T23:59:00Z`)
  }

  if (isNaN(endDate.getTime())) {
    throw new ValidationError(
      'Invalid end_date format',
      400,
      {},
      ErrorCodes.INVALID_END_DATE
    )
  }

  const now = new Date()
  if (endDate < now) {
    throw new ValidationError(
      'end_date cannot be in the past',
      400,
      {},
      ErrorCodes.INVALID_END_DATE
    )
  }

  return endDate
}

export function validateDuration(startDate, endDate) {
  const diffMs = endDate - startDate
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < MIN_DURATION_DAYS) {
    throw new ValidationError(
      `Raffle must last at least ${MIN_DURATION_DAYS} days`,
      400,
      { duration_days: Math.floor(diffDays) },
      ErrorCodes.INVALID_DURATION
    )
  }

  if (diffDays > MAX_DURATION_DAYS) {
    throw new ValidationError(
      `Raffle cannot last more than ${MAX_DURATION_DAYS} days`,
      400,
      { duration_days: Math.floor(diffDays) },
      ErrorCodes.INVALID_DURATION
    )
  }

  logger.debug('Duration validated', { duration_days: Math.floor(diffDays) })

  return Math.floor(diffDays)
}

export function validatePrizeImages(prizeImages) {
  if (!prizeImages || !Array.isArray(prizeImages)) {
    throw new ValidationError(
      'prize_images is required and must be an array',
      400,
      {},
      ErrorCodes.INVALID_PRIZE_IMAGES
    )
  }

  if (prizeImages.length < MIN_PRIZE_IMAGES) {
    throw new ValidationError(
      `At least ${MIN_PRIZE_IMAGES} prize image is required`,
      400,
      { current_count: prizeImages.length },
      ErrorCodes.INVALID_PRIZE_IMAGES
    )
  }

  if (prizeImages.length > MAX_PRIZE_IMAGES) {
    throw new ValidationError(
      `Cannot exceed ${MAX_PRIZE_IMAGES} prize images`,
      400,
      { current_count: prizeImages.length },
      ErrorCodes.INVALID_PRIZE_IMAGES
    )
  }

  for (const imageUrl of prizeImages) {
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      throw new ValidationError(
        'All prize images must be valid URL strings',
        400,
        {},
        ErrorCodes.INVALID_PRIZE_IMAGES
      )
    }
  }
}

export function validatePrizeValue(prizeValue) {
  if (typeof prizeValue !== 'number' || prizeValue <= 0) {
    throw new ValidationError(
      'prize_value must be a positive number',
      400,
      {},
      ErrorCodes.INVALID_PRIZE_VALUE
    )
  }

  if (prizeValue < 100) {
    throw new ValidationError(
      'prize_value must be at least 100',
      400,
      { current_value: prizeValue },
      ErrorCodes.INVALID_PRIZE_VALUE
    )
  }

  if (prizeValue > 3000000) {
    throw new ValidationError(
      'prize_value cannot exceed 3,000,000',
      400,
      { current_value: prizeValue },
      ErrorCodes.INVALID_PRIZE_VALUE
    )
  }

  return prizeValue
}

export function calculateCategory(prizeValue) {
  if (prizeValue < 500) return 'pequeño'
  if (prizeValue < 5000) return 'mediano'
  if (prizeValue < 50000) return 'grande'
  return 'premium'
}

export function calculateMaxParticipants(prizeValue) {
  const category = calculateCategory(prizeValue)
  const expectedParticipants =
    EXPECTED_PARTICIPANTS_BY_CATEGORY[category] ||
    EXPECTED_PARTICIPANTS_BY_CATEGORY.pequeño

  const maxParticipants = Math.ceil(
    expectedParticipants * MAX_PARTICIPANTS_MARGIN
  )

  logger.info('max_participants calculated automatically', {
    prize_value: prizeValue,
    category: category,
    expected_participants: expectedParticipants,
    max_participants: maxParticipants,
    margin_percent: `${(MAX_PARTICIPANTS_MARGIN - 1) * 100}%`
  })

  return maxParticipants
}

export function calculateDefaultDuration(prizeValue) {
  const category = calculateCategory(prizeValue)

  switch (category) {
    case 'pequeño':
      return 7
    case 'mediano':
      return 14
    case 'grande':
      return 30
    case 'premium':
      return 60
    default:
      return 7
  }
}

export function calculateEndDate(startDate, prizeValue, customDuration = null) {
  const durationDays =
    customDuration !== null
      ? customDuration
      : calculateDefaultDuration(prizeValue)

  if (durationDays < MIN_DURATION_DAYS || durationDays > MAX_DURATION_DAYS) {
    throw new ValidationError(
      `Duration must be between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS} days`,
      400,
      { provided_duration: durationDays },
      ErrorCodes.INVALID_DURATION
    )
  }

  const endDate = new Date(startDate)
  endDate.setUTCDate(endDate.getUTCDate() + durationDays)
  endDate.setUTCHours(23, 59, 0, 0)

  logger.debug('End date calculated', {
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration_days: durationDays,
    category: calculateCategory(prizeValue)
  })

  return endDate
}
