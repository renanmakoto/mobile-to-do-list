export const pluralize = (count, singular, plural) => {
  const word = count === 1 ? singular : (plural ?? `${singular}s`)
  return `${count} ${word}`
}

export const normalizeText = (text) => {
  return typeof text === 'string' ? text.trim() : ''
}

export const generateId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}-${random}`
}

export const getGreeting = () => {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const formatDate = (date) => {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export const formatTime = (date) => {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const buildDateWithTime = (hour, minute, referenceDate) => {
  const target = new Date(referenceDate)
  target.setHours(hour, minute, 0, 0)
  return target
}

export const normalizeTimestamp = (input) => {
  if (input == null) return null
  
  if (input instanceof Date) {
    const time = input.getTime()
    return Number.isFinite(time) ? time : null
  }
  
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null
  }
  
  if (typeof input === 'string') {
    const time = Date.parse(input)
    return Number.isFinite(time) ? time : null
  }
  
  return null
}

export const validateTime = (hour, minute) => {
  if (hour < 0 || hour > 23) return null
  if (minute < 0 || minute > 59) return null
  return { hour, minute }
}

export const parseTimeParts = (hourPart, minutePart) => {
  const hour = parseInt(hourPart, 10)
  const minute = minutePart == null || minutePart === '' 
    ? 0 
    : parseInt(minutePart, 10)
  return validateTime(hour, minute)
}

export const boolToInt = (value) => (value ? 1 : 0)
