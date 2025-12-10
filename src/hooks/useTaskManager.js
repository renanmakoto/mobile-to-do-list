import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'

import { TIME, NOTIFICATIONS as NOTIFICATION_CONFIG, REPEAT_TYPES } from '../constants'
import { generateId, getGreeting, pluralize } from '../utils'
import { ensureNotificationsReady } from '../notifications/setup'
import { normalizeRemindAt, parseReminderTokens } from '../notifications/parseReminder'
import {
  deleteTask as deleteTaskRecord,
  ensureStorageReady,
  fetchTasks,
  insertTask,
  persistPositions,
  updateTask as updateTaskRecord,
} from '../storage/tasks'

const reindexTasks = (tasks = []) =>
  tasks.map((task, index) => ({
    ...task,
    position: index,
    key: task.id || task.key,
  }))

const buildAssistantInsights = (tasks = []) => {
  const greeting = getGreeting()

  if (tasks.length === 0) {
    return { greeting, summary: '', suggestions: [] }
  }

  const now = Date.now()
  const activeTasks = tasks.filter((task) => !task.completed)

  const overdueTasks = activeTasks.filter(
    (task) => task.remindAt && !task.repeat && task.remindAt < now
  )

  const upcomingTasks = activeTasks.filter(
    (task) =>
      task.remindAt &&
      task.remindAt >= now &&
      task.remindAt <= now + TIME.UPCOMING_WINDOW
  )

  const tasksWithoutReminders = activeTasks.filter((task) => !task.remindAt)

  const summaryParts = []

  if (overdueTasks.length) {
    summaryParts.push(`${pluralize(overdueTasks.length, 'task')} overdue`)
  }

  if (upcomingTasks.length) {
    summaryParts.push(`${pluralize(upcomingTasks.length, 'task')} due soon`)
  }

  if (!summaryParts.length) {
    summaryParts.push(
      activeTasks.length
        ? 'All active tasks are on schedule.'
        : 'Everything is complete. Nice work.'
    )
  }

  const suggestions = []

  if (overdueTasks.length) {
    suggestions.push({
      id: 'overdue',
      label: `Follow up on "${overdueTasks[0].value}" or snooze it for later.`,
    })
  }

  if (tasksWithoutReminders.length) {
    suggestions.push({
      id: 'reminders',
      label: `Add reminders to ${pluralize(tasksWithoutReminders.length, 'task')} so nothing slips.`,
    })
  }

  if (!suggestions.length && upcomingTasks.length) {
    suggestions.push({
      id: 'dueSoon',
      label: `"${upcomingTasks[0].value}" is coming up soon—get ready.`,
    })
  }

  return {
    greeting,
    summary: summaryParts.join(' • '),
    suggestions,
  }
}

const buildNotificationTrigger = (timestamp, repeat) => {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const channelId = NOTIFICATION_CONFIG.CHANNEL_ID

  if (repeat === REPEAT_TYPES.DAILY) {
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
      channelId,
    }
  }

  if (repeat === REPEAT_TYPES.WEEKLY) {
    const weekday = date.getDay() === 0 ? 7 : date.getDay()
    return {
      weekday,
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
      channelId,
    }
  }

  return { date: timestamp, channelId }
}

export const useTaskManager = () => {
  const [tasks, setTasksInternal] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState(null)

  const tasksRef = useRef([])
  const notificationsGrantedRef = useRef(false)

  const setTasks = useCallback((updater) => {
    setTasksInternal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      tasksRef.current = next
      return next
    })
  }, [])

  const reminderCount = useMemo(
    () => tasks.filter((task) => task.remindAt && !task.completed).length,
    [tasks]
  )

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) || null,
    [editingTaskId, tasks]
  )

  const assistantInsights = useMemo(
    () => buildAssistantInsights(tasks),
    [tasks]
  )

  const cancelNotification = useCallback(async (notificationId) => {
    if (!notificationId) return

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId)
      console.log(`Cancelled reminder: ${notificationId}`)
    } catch (error) {
      console.warn('Failed to cancel notification:', error)
    }
  }, [])

  const scheduleNotification = useCallback(
    async ({ taskId, body, remindAt, repeat }) => {
      if (!remindAt || !notificationsGrantedRef.current) {
        if (!notificationsGrantedRef.current) {
          console.warn('Skipping notification: permission not granted')
        }
        return null
      }

      const trigger = buildNotificationTrigger(remindAt, repeat)
      if (!trigger) return null

      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Reminder',
            body,
            data: { key: taskId },
            categoryIdentifier: NOTIFICATION_CONFIG.CATEGORY_ID,
          },
          trigger,
        })

        console.log(`Scheduled reminder ${notificationId} for task ${taskId}`)
        return notificationId
      } catch (error) {
        console.warn('Failed to schedule notification:', error)
        return null
      }
    },
    []
  )

  const savePositions = useCallback(async (taskList) => {
    try {
      await persistPositions(taskList)
    } catch (error) {
      console.warn('Failed to persist task order:', error)
    }
  }, [])

  const createTask = useCallback(
    async ({ value, remindAt, repeat }) => {
      const id = generateId()
      const timestamp = Date.now()

      const notificationId = remindAt
        ? await scheduleNotification({ taskId: id, body: value, remindAt, repeat })
        : null

      const newTask = {
        id,
        key: id,
        value,
        remindAt,
        repeat: repeat ?? null,
        notificationId,
        completed: false,
        completedAt: null,
        position: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      try {
        await insertTask(newTask)
      } catch (error) {
        console.warn('Failed to persist new task:', error)
      }

      const updatedTasks = reindexTasks([newTask, ...tasksRef.current])
      setTasks(updatedTasks)
      await savePositions(updatedTasks)
    },
    [savePositions, scheduleNotification, setTasks]
  )

  const updateTask = useCallback(
    async ({ taskId, nextValue, nextRemindAtRaw, nextRepeatRaw, instructionMatched }) => {
      const existing = tasksRef.current.find((task) => task.id === taskId)
      if (!existing) return

      let nextRemindAt = existing.remindAt
      let nextRepeat = existing.repeat
      let nextNotificationId = existing.notificationId

      if (instructionMatched) {
        await cancelNotification(existing.notificationId)
        nextRemindAt = nextRemindAtRaw
        nextRepeat = nextRepeatRaw ?? null
        nextNotificationId = null
      } else if (existing.notificationId && nextRemindAt && nextValue !== existing.value) {
        await cancelNotification(existing.notificationId)
        nextNotificationId = null
      }

      if (!nextRemindAt) {
        nextNotificationId = null
      } else if (!nextNotificationId) {
        nextNotificationId = await scheduleNotification({
          taskId,
          body: nextValue,
          remindAt: nextRemindAt,
          repeat: nextRepeat,
        })
      }

      const patch = {
        value: nextValue,
        remindAt: nextRemindAt ?? null,
        repeat: nextRepeat ?? null,
        notificationId: nextNotificationId,
      }

      const updatedAt = await updateTaskRecord(taskId, patch)

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, ...patch, updatedAt: updatedAt ?? task.updatedAt }
            : task
        )
      )

      setEditingTaskId(null)
    },
    [cancelNotification, scheduleNotification, setTasks]
  )

  const handleDeleteTask = useCallback(
    async (taskId) => {
      const target = tasksRef.current.find((task) => task.id === taskId)
      if (!target) return

      await cancelNotification(target.notificationId)

      try {
        await deleteTaskRecord(taskId)
      } catch (error) {
        console.warn('Failed to delete task:', error)
      }

      const filtered = tasksRef.current.filter((task) => task.id !== taskId)
      const reindexed = reindexTasks(filtered)

      setTasks(reindexed)
      await savePositions(reindexed)
      setEditingTaskId((current) => (current === taskId ? null : current))
    },
    [cancelNotification, savePositions, setTasks]
  )

  const handleToggleComplete = useCallback(
    async (taskId, nextCompleted) => {
      const task = tasksRef.current.find((item) => item.id === taskId)
      if (!task) return

      let notificationId = task.notificationId

      if (nextCompleted) {
        await cancelNotification(notificationId)
        notificationId = null
      } else if (!notificationId && task.remindAt && (task.repeat || task.remindAt > Date.now())) {
        notificationId = await scheduleNotification({
          taskId,
          body: task.value,
          remindAt: task.remindAt,
          repeat: task.repeat,
        })
      }

      const patch = {
        completed: nextCompleted,
        completedAt: nextCompleted ? Date.now() : null,
        notificationId,
      }

      await updateTaskRecord(taskId, patch)

      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, ...patch } : item))
      )
    },
    [cancelNotification, scheduleNotification, setTasks]
  )

  const moveTask = useCallback(
    async (taskId, direction) => {
      const current = tasksRef.current
      const index = current.findIndex((task) => task.id === taskId)
      const targetIndex = index + direction

      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)

      const reindexed = reindexTasks(next)
      setTasks(reindexed)
      await savePositions(reindexed)
    },
    [savePositions, setTasks]
  )

  const handleMoveUp = useCallback(
    (taskId) => moveTask(taskId, -1),
    [moveTask]
  )

  const handleMoveDown = useCallback(
    (taskId) => moveTask(taskId, 1),
    [moveTask]
  )

  const snoozeTask = useCallback(
    async (taskId, sourceContent) => {
      const task = tasksRef.current.find((item) => item.id === taskId)
      if (!task) return

      const snoozeUntil = Date.now() + TIME.SNOOZE_DURATION

      await cancelNotification(task.notificationId)

      let notificationId = null

      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: sourceContent?.title ?? 'Reminder',
            body: sourceContent?.body ?? task.value,
            data: { ...(sourceContent?.data || {}), key: taskId, snoozed: true },
            categoryIdentifier: NOTIFICATION_CONFIG.CATEGORY_ID,
          },
          trigger: {
            date: snoozeUntil,
            channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
          },
        })
      } catch (error) {
        console.warn('Failed to snooze notification:', error)
        return
      }

      const patch = {
        remindAt: snoozeUntil,
        repeat: null,
        notificationId,
      }

      await updateTaskRecord(taskId, patch)

      setTasks((prev) =>
        prev.map((item) => (item.id === taskId ? { ...item, ...patch } : item))
      )

      console.log(`Task ${taskId} snoozed for 15 minutes`)
    },
    [cancelNotification, setTasks]
  )

  const submitHandler = useCallback(
    async (rawValue, editingId = null, remindAtOverride = null) => {
      const { cleanedText, remindAt, repeat, instructionMatched } = parseReminderTokens(rawValue)
      const trimmedValue = cleanedText.trim()

      if (!trimmedValue) return

      const normalizedOverride = normalizeRemindAt(remindAtOverride)
      const normalizedRemindAt = normalizedOverride ?? normalizeRemindAt(remindAt)
      const matched = instructionMatched || normalizedOverride != null

      if (editingId) {
        await updateTask({
          taskId: editingId,
          nextValue: trimmedValue,
          nextRemindAtRaw: normalizedRemindAt,
          nextRepeatRaw: repeat ?? null,
          instructionMatched: matched,
        })
        return
      }

      await createTask({
        value: trimmedValue,
        remindAt: normalizedRemindAt,
        repeat: repeat ?? null,
      })
    },
    [createTask, updateTask]
  )

  const loadTasks = useCallback(async () => {
    try {
      await ensureStorageReady()
      const stored = await fetchTasks()
      const normalized = reindexTasks(stored)
      setTasks(normalized)
    } catch (error) {
      console.warn('Failed to load tasks from storage:', error)
    } finally {
      setLoadingTasks(false)
    }
  }, [setTasks])

  useEffect(() => {
    let mounted = true

    ensureNotificationsReady()
      .then((granted) => {
        if (mounted) {
          notificationsGrantedRef.current = granted
          if (!granted) {
            console.warn('Notification permissions not granted')
          }
        }
      })
      .catch((error) => {
        console.warn('Notification readiness failed:', error)
      })

    loadTasks()

    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { actionIdentifier } = response
        const taskKey = response?.notification?.request?.content?.data?.key

        if (!taskKey) {
          console.log('Notification tapped without task context')
          return
        }

        switch (actionIdentifier) {
          case Notifications.DEFAULT_ACTION_IDENTIFIER:
            console.log(`Reminder opened for task ${taskKey}`)
            break

          case NOTIFICATION_CONFIG.ACTIONS.DONE:
            await handleToggleComplete(taskKey, true)
            break

          case NOTIFICATION_CONFIG.ACTIONS.SNOOZE:
            await snoozeTask(taskKey, response.notification.request.content)
            break

          default:
            console.log(`Unhandled action: ${actionIdentifier} for task ${taskKey}`)
        }
      }
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [handleToggleComplete, loadTasks, snoozeTask])

  const startEditing = useCallback((taskId) => {
    setEditingTaskId(taskId)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null)
  }, [])

  return {
    tasks,
    loadingTasks,
    reminderCount,
    assistantInsights,
    editingTask,

    submitHandler,
    handleDeleteTask,
    handleToggleComplete,
    handleMoveUp,
    handleMoveDown,
    startEditing,
    cancelEditing,
  }
}
