import { TIME, WEEKDAYS, REPEAT_TYPES } from '../constants'
import {
  normalizeText,
  addDays,
  buildDateWithTime,
  validateTime,
  parseTimeParts,
  normalizeTimestamp,
} from '../utils'

const INSTRUCTION_MARKERS = ['>', '@']
const CLEAR_KEYWORDS = /^(clear|remove|none|cancel)$/i

const getWeekdayNumber = (token) => {
  if (!token) return null
  const normalized = token.toLowerCase()
  return Object.hasOwn(WEEKDAYS, normalized) ? WEEKDAYS[normalized] : null
}

const parseMinutesShorthand = (token, now) => {
  const match = token.match(/^(\d+)m$/i)
  if (!match) return null

  const minutes = parseInt(match[1], 10)
  if (!Number.isFinite(minutes) || minutes <= 0) return null

  return new Date(now.getTime() + minutes * TIME.MINUTE)
}

const parseHoursShorthand = (token, now) => {
  const match = token.match(/^(\d+)h$/i)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  if (!Number.isFinite(hours) || hours <= 0) return null

  return new Date(now.getTime() + hours * TIME.HOUR)
}

const parseRelativeExpression = (token, now) => {
  const match = token.match(/^in\s+(\d+)\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d)$/i)
  if (!match) return null

  const value = parseInt(match[1], 10)
  if (!Number.isFinite(value) || value <= 0) return null

  const unit = match[2].toLowerCase()
  let multiplier = TIME.MINUTE

  if (unit.startsWith('h')) {
    multiplier = TIME.HOUR
  } else if (unit.startsWith('d')) {
    multiplier = TIME.DAY
  }

  return new Date(now.getTime() + value * multiplier)
}

const parseTimeOnly = (token, now) => {
  const match = token.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null

  const time = validateTime(parseInt(match[1], 10), parseInt(match[2], 10))
  if (!time) return null

  let target = buildDateWithTime(time.hour, time.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }

  return target
}

const parseTodayTime = (token, now) => {
  const match = token.match(/^today\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null

  const time = parseTimeParts(match[1], match[2])
  if (!time) return null

  let target = buildDateWithTime(time.hour, time.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }

  return target
}

const parseTomorrowTime = (token, now) => {
  const match = token.match(/^tomorrow\s+(\d{1,2}):(\d{2})$/i)
  if (!match) return null

  const time = validateTime(parseInt(match[1], 10), parseInt(match[2], 10))
  if (!time) return null

  return buildDateWithTime(time.hour, time.minute, addDays(now, 1))
}

const parseNextWeekday = (token, now) => {
  const match = token.match(/^next\s+([a-z]+)(?:\s+(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null

  const weekday = getWeekdayNumber(match[1])
  if (weekday == null) return null

  const time = parseTimeParts(match[2], match[3])
  if (!time) return null

  const todayWeekday = now.getDay()
  let daysToAdd = (weekday - todayWeekday + 7) % 7
  if (daysToAdd === 0) daysToAdd = 7

  return buildDateWithTime(time.hour, time.minute, addDays(now, daysToAdd))
}

const parseWeekdayTime = (token, now) => {
  const match = token.match(/^([a-z]+)(?:day)?\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null

  const weekday = getWeekdayNumber(match[1])
  if (weekday == null) return null

  const time = parseTimeParts(match[2], match[3])
  if (!time) return null

  const todayWeekday = now.getDay()
  let daysToAdd = (weekday - todayWeekday + 7) % 7
  let target = buildDateWithTime(time.hour, time.minute, now)

  if (daysToAdd === 0 && target.getTime() <= now.getTime()) {
    daysToAdd = 7
  }

  return addDays(target, daysToAdd)
}

const parseDailyRecurrence = (token, now) => {
  const match = token.match(/^daily\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null

  const time = parseTimeParts(match[1], match[2])
  if (!time) return null

  let target = buildDateWithTime(time.hour, time.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }

  return { remindAt: target, repeat: REPEAT_TYPES.DAILY }
}

const parseWeeklyRecurrence = (token, now) => {
  const match = token.match(/^weekly\s+([a-z]+)\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null

  const weekday = getWeekdayNumber(match[1])
  if (weekday == null) return null

  const time = parseTimeParts(match[2], match[3])
  if (!time) return null

  const todayWeekday = now.getDay()
  let daysToAdd = (weekday - todayWeekday + 7) % 7
  let target = buildDateWithTime(time.hour, time.minute, now)

  if (daysToAdd === 0 && target.getTime() <= now.getTime()) {
    daysToAdd = 7
  }

  return { remindAt: addDays(target, daysToAdd), repeat: REPEAT_TYPES.WEEKLY }
}

const extractInstruction = (text) => {
  let candidate = null

  for (const marker of INSTRUCTION_MARKERS) {
    let searchIndex = text.length

    while (searchIndex >= 0) {
      const idx = text.lastIndexOf(marker, searchIndex - 1)
      if (idx === -1) break

      const charBefore = text[idx - 1]
      const isValidPosition = marker === '>' || !charBefore || /\s/.test(charBefore)

      if (isValidPosition) {
        if (!candidate || idx > candidate.index) {
          candidate = { index: idx, marker }
        }
        break
      }

      searchIndex = idx
    }
  }

  if (!candidate) return null

  const prefix = normalizeText(text.slice(0, candidate.index))
  const suffix = normalizeText(text.slice(candidate.index + candidate.marker.length))

  return suffix ? { prefix, suffix } : null
}

export const parseReminderTokens = (input) => {
  const originalText = normalizeText(input)

  const defaultResult = {
    cleanedText: originalText,
    remindAt: null,
    repeat: null,
    instructionMatched: false,
  }

  if (!originalText) {
    return { ...defaultResult, cleanedText: '' }
  }

  const segments = extractInstruction(originalText)
  if (!segments) {
    return defaultResult
  }

  const { prefix, suffix } = segments
  const now = new Date()

  if (CLEAR_KEYWORDS.test(suffix)) {
    return {
      cleanedText: prefix,
      remindAt: null,
      repeat: null,
      instructionMatched: true,
    }
  }

  const oneTimeParsers = [
    parseMinutesShorthand,
    parseHoursShorthand,
    parseRelativeExpression,
    parseTimeOnly,
    parseTomorrowTime,
    parseTodayTime,
    parseNextWeekday,
    parseWeekdayTime,
  ]

  for (const parser of oneTimeParsers) {
    const result = parser(suffix, now)
    if (result) {
      return {
        cleanedText: prefix,
        remindAt: result,
        repeat: null,
        instructionMatched: true,
      }
    }
  }

  const recurringParsers = [parseDailyRecurrence, parseWeeklyRecurrence]

  for (const parser of recurringParsers) {
    const result = parser(suffix, now)
    if (result) {
      return {
        cleanedText: prefix,
        remindAt: result.remindAt,
        repeat: result.repeat,
        instructionMatched: true,
      }
    }
  }

  return defaultResult
}

export const normalizeRemindAt = normalizeTimestamp
