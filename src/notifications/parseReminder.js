const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const WEEKDAY_LOOKUP = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
}

const normaliseText = (text) => (typeof text === "string" ? text.trim() : "")

const clampHourMinute = (hour, minute) => {
  if (hour < 0 || hour > 23) return null
  if (minute < 0 || minute > 59) return null
  return { hour, minute }
}

const parseHourMinuteParts = (hourPart, minutePart) => {
  const hour = parseInt(hourPart, 10)
  const minute =
    minutePart == null || minutePart === "" ? 0 : parseInt(minutePart, 10)
  return clampHourMinute(hour, minute)
}

const isWeekdayToken = (token) => {
  if (!token) return null
  const normalized = token.toLowerCase()
  return Object.prototype.hasOwnProperty.call(WEEKDAY_LOOKUP, normalized)
    ? WEEKDAY_LOOKUP[normalized]
    : null
}

const buildTodayAt = (hour, minute, reference) => {
  const target = new Date(reference)
  target.setHours(hour, minute, 0, 0)
  return target
}

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const parseAsMinutes = (token, now) => {
  const match = token.match(/^(\d+)m$/i)
  if (!match) return null
  const minutes = parseInt(match[1], 10)
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  return addRelative(now, minutes * MINUTE_MS)
}

const parseAsRelativeWord = (token, now) => {
  const match = token.match(
    /^in\s+(\d+)\s*(minutes?|mins?|m|hours?|hrs?|h|days?|d)$/i
  )
  if (!match) return null
  const value = parseInt(match[1], 10)
  if (!Number.isFinite(value) || value <= 0) return null
  const unit = match[2].toLowerCase()
  if (unit.startsWith("m")) {
    return addRelative(now, value * MINUTE_MS)
  }
  if (unit.startsWith("h")) {
    return addRelative(now, value * HOUR_MS)
  }
  return addRelative(now, value * DAY_MS)
}

const parseAsHours = (token, now) => {
  const match = token.match(/^(\d+)h$/i)
  if (!match) return null
  const hours = parseInt(match[1], 10)
  if (!Number.isFinite(hours) || hours <= 0) return null
  return addRelative(now, hours * HOUR_MS)
}

const parseAsTodayTime = (token, now) => {
  const match = token.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const hm = clampHourMinute(hour, minute)
  if (!hm) return null
  let target = buildTodayAt(hm.hour, hm.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }
  return target
}

const parseAsTodayKeyword = (token, now) => {
  const match = token.match(/^today\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null
  const hm = parseHourMinuteParts(match[1], match[2])
  if (!hm) return null
  let target = buildTodayAt(hm.hour, hm.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }
  return target
}

const parseAsTomorrowTime = (token, now) => {
  const match = token.match(/^tomorrow\s+(\d{1,2}):(\d{2})$/i)
  if (!match) return null
  const hour = parseInt(match[1], 10)
  const minute = parseInt(match[2], 10)
  const hm = clampHourMinute(hour, minute)
  if (!hm) return null
  const target = buildTodayAt(hm.hour, hm.minute, addDays(now, 1))
  return target
}

const parseAsNextWeekday = (token, now) => {
  const match = token.match(
    /^next\s+([a-z]+)(?:\s+(?:at\s+)?)?(\d{1,2})(?::(\d{2}))?$/i
  )
  if (!match) return null
  const weekday = isWeekdayToken(match[1])
  if (weekday == null) return null
  const hm = parseHourMinuteParts(match[2], match[3])
  if (!hm) return null
  const todayWeekday = now.getDay()
  let delta = (weekday - todayWeekday + 7) % 7
  if (delta === 0) {
    delta = 7
  }
  const target = buildTodayAt(hm.hour, hm.minute, addDays(now, delta))
  return target
}

const parseAsWeekdayShorthand = (token, now) => {
  const match = token.match(
    /^([a-z]+)(?:day)?\s+(\d{1,2})(?::(\d{2}))?$/i
  )
  if (!match) return null
  const weekday = isWeekdayToken(match[1])
  if (weekday == null) return null
  const hm = parseHourMinuteParts(match[2], match[3])
  if (!hm) return null
  const todayWeekday = now.getDay()
  let delta = (weekday - todayWeekday + 7) % 7
  let target = buildTodayAt(hm.hour, hm.minute, now)
  if (delta === 0 && target.getTime() <= now.getTime()) {
    delta = 7
  }
  target = addDays(target, delta)
  return target
}

const parseAsDaily = (token, now) => {
  const match = token.match(/^daily\s+(\d{1,2})(?::(\d{2}))?$/i)
  if (!match) return null
  const hm = parseHourMinuteParts(match[1], match[2])
  if (!hm) return null
  let target = buildTodayAt(hm.hour, hm.minute, now)
  if (target.getTime() <= now.getTime()) {
    target = addDays(target, 1)
  }
  return { remindAt: target, repeat: "daily" }
}

const parseAsWeekly = (token, now) => {
  const match = token.match(
    /^weekly\s+([a-z]+)\s+(\d{1,2})(?::(\d{2}))?$/i
  )
  if (!match) return null
  const weekdayRaw = match[1].toLowerCase()
  const weekday = WEEKDAY_LOOKUP[weekdayRaw]
  if (weekday == null) return null
  const hm = parseHourMinuteParts(match[2], match[3])
  if (!hm) return null
  const todayWeekday = now.getDay()
  let delta = (weekday - todayWeekday + 7) % 7
  let target = buildTodayAt(hm.hour, hm.minute, now)
  if (delta === 0 && target.getTime() <= now.getTime()) {
    delta = 7
  }
  target = addDays(target, delta)
  return { remindAt: target, repeat: "weekly" }
}

const addRelative = (now, delta) => {
  const target = new Date(now.getTime() + delta)
  return target
}

const splitInstruction = (text) => {
  const markers = [">", "@"]
  let candidate = null
  markers.forEach((marker) => {
    let searchIndex = text.length
    while (searchIndex >= 0) {
      const idx = text.lastIndexOf(marker, searchIndex - 1)
      if (idx === -1) break
      const charBefore = text[idx - 1]
      if (marker === ">" || !charBefore || /\s/.test(charBefore)) {
        if (!candidate || idx > candidate.index) {
          candidate = { index: idx, marker }
        }
        break
      }
      searchIndex = idx
    }
  })

  if (!candidate) {
    return null
  }

  const prefix = normaliseText(text.slice(0, candidate.index))
  const suffix = normaliseText(
    text.slice(candidate.index + candidate.marker.length)
  )

  if (!suffix) {
    return null
  }

  return { prefix, suffix }
}

export const parseReminderTokens = (input) => {
  const originalText = normaliseText(input)
  if (!originalText) {
    return { cleanedText: "", remindAt: null, repeat: null, instructionMatched: false }
  }

  const segments = splitInstruction(originalText)
  if (!segments) {
    return { cleanedText: originalText, remindAt: null, repeat: null, instructionMatched: false }
  }

  const { prefix, suffix } = segments

  const now = new Date()

  if (/^(clear|remove|none|cancel)$/i.test(suffix)) {
    return {
      cleanedText: prefix,
      remindAt: null,
      repeat: null,
      instructionMatched: true,
    }
  }

  const immediate =
    parseAsMinutes(suffix, now) ||
    parseAsHours(suffix, now) ||
    parseAsRelativeWord(suffix, now) ||
    parseAsTodayTime(suffix, now) ||
    parseAsTomorrowTime(suffix, now) ||
    parseAsTodayKeyword(suffix, now) ||
    parseAsNextWeekday(suffix, now) ||
    parseAsWeekdayShorthand(suffix, now)

  if (immediate) {
    return {
      cleanedText: prefix,
      remindAt: immediate,
      repeat: null,
      instructionMatched: true,
    }
  }

  const recurring = parseAsDaily(suffix, now) || parseAsWeekly(suffix, now)
  if (recurring) {
    return {
      cleanedText: prefix,
      remindAt: recurring.remindAt,
      repeat: recurring.repeat,
      instructionMatched: true,
    }
  }

  return { cleanedText: originalText, remindAt: null, repeat: null, instructionMatched: false }
}

export const normalizeRemindAt = (input) => {
  if (input == null) {
    return null
  }
  if (input instanceof Date) {
    const time = input.getTime()
    return Number.isFinite(time) ? time : null
  }
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null
  }
  if (typeof input === "string") {
    const time = Date.parse(input)
    return Number.isFinite(time) ? time : null
  }
  return null
}
