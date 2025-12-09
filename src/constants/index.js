export const COLORS = {
  primary: '#00ADA2',
  background: '#EFF9F8',
  textSecondary: '#858585',
  white: '#FFFFFF',
}

export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  SNOOZE_DURATION: 15 * 60 * 1000,
  UPCOMING_WINDOW: 2 * 60 * 60 * 1000,
}

export const DATABASE = {
  NAME: 'todot.db',
  TABLE_TASKS: 'tasks',
  UPDATABLE_COLUMNS: [
    'value',
    'remindAt',
    'repeat',
    'notificationId',
    'completed',
    'completedAt',
    'position',
  ],
}

export const NOTIFICATIONS = {
  CHANNEL_ID: 'reminders',
  CHANNEL_NAME: 'Reminders',
  CATEGORY_ID: 'task-reminder-actions',
  ACTIONS: {
    DONE: 'DONE_ACTION',
    SNOOZE: 'SNOOZE_ACTION',
  },
}

export const REPEAT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
}

export const WEEKDAYS = {
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
