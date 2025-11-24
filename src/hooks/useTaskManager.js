import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as Notifications from "expo-notifications"
import { ensureNotificationsReady } from "../notifications/setup"
import {
  normalizeRemindAt,
  parseReminderTokens,
} from "../notifications/parseReminder"
import {
  deleteTask as deleteTaskRecord,
  ensureStorageReady,
  fetchTasks,
  insertTask,
  persistPositions,
  updateTask as updateTaskRecord,
} from "../storage/tasks"

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const UPCOMING_WINDOW_MS = 2 * 60 * 60 * 1000

const generateTaskId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const reindexTasks = (tasks = []) =>
  tasks.map((task, index) => ({
    ...task,
    position: index,
    key: task.id || task.key,
  }))

const pluralize = (value, singular, plural) =>
  `${value} ${value === 1 ? singular : plural ?? `${singular}s`}`

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const buildAssistantInsights = (tasks = []) => {
  const greeting = getGreeting()
  if (tasks.length === 0) {
    return {
      greeting,
      summary: "",
      suggestions: [],
    }
  }

  const now = Date.now()
  const active = tasks.filter((task) => !task.completed)
  const overdue = active.filter(
    (task) => task.remindAt && !task.repeat && task.remindAt < now
  )
  const dueSoon = active.filter(
    (task) =>
      task.remindAt &&
      task.remindAt >= now &&
      task.remindAt <= now + UPCOMING_WINDOW_MS
  )
  const missingReminders = active.filter((task) => !task.remindAt)

  const summaryParts = []
  if (overdue.length) {
    summaryParts.push(`${pluralize(overdue.length, "task")} overdue`)
  }
  if (dueSoon.length) {
    summaryParts.push(`${pluralize(dueSoon.length, "task")} due soon`)
  }
  if (!summaryParts.length) {
    summaryParts.push(
      active.length
        ? "All active tasks are on schedule."
        : "Everything is complete. Nice work."
    )
  }

  const suggestions = []
  if (overdue.length) {
    suggestions.push({
      id: "overdue",
      label: `Follow up on "${overdue[0].value}" or snooze it for later.`,
    })
  }
  if (missingReminders.length) {
    suggestions.push({
      id: "reminders",
      label: `Add reminders to ${pluralize(
        missingReminders.length,
        "task"
      )} so nothing slips.`,
    })
  }
  if (!suggestions.length && dueSoon.length) {
    suggestions.push({
      id: "dueSoon",
      label: `"${dueSoon[0].value}" is coming up soon—get ready.`,
    })
  }

  return {
    greeting,
    summary: summaryParts.join(" • "),
    suggestions,
  }
}

const buildTrigger = (timestamp, repeat) => {
  if (!timestamp) {
    return null
  }

  if (repeat === "daily") {
    const date = new Date(timestamp)
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
      channelId: "reminders",
    }
  }

  if (repeat === "weekly") {
    const date = new Date(timestamp)
    const weekday = date.getDay() === 0 ? 7 : date.getDay()
    return {
      weekday,
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: true,
      channelId: "reminders",
    }
  }

  return {
    date: timestamp,
    channelId: "reminders",
  }
}

export const useTaskManager = () => {
  const [tasks, setTasksInternal] = useState([])
  const tasksRef = useRef([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const notificationsGrantedRef = useRef(false)

  const setTasks = useCallback((updater) => {
    setTasksInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
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

  const cancelNotificationIfNeeded = useCallback(async (notificationId) => {
    if (!notificationId) {
      return
    }
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId)
      console.log(`Cancelled reminder ${notificationId}`)
    } catch (error) {
      console.warn("Failed to cancel scheduled notification", error)
    }
  }, [])

  const scheduleNotificationForTask = useCallback(
    async ({ taskId, body, remindAt, repeat }) => {
      if (!remindAt) {
        return null
      }
      if (!notificationsGrantedRef.current) {
        console.warn(
          "Skipping schedule because notification permission is missing"
        )
        return null
      }
      const trigger = buildTrigger(remindAt, repeat)
      if (!trigger) {
        return null
      }
      try {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Reminder",
            body,
            data: { key: taskId },
            categoryIdentifier: "task-reminder-actions",
          },
          trigger,
        })
        console.log(`Scheduled reminder ${notificationId} for task ${taskId}`)
        return notificationId
      } catch (error) {
        console.warn("Failed to schedule notification", error)
        return null
      }
    },
    []
  )

  const persistPositionsSafe = useCallback(async (nextTasks) => {
    try {
      await persistPositions(nextTasks)
    } catch (error) {
      console.warn("Failed to persist task order", error)
    }
  }, [])

  const handleCreateTask = useCallback(
    async ({ value, remindAt, repeat }) => {
      const id = generateTaskId()
      let notificationId = null
      if (remindAt) {
        notificationId = await scheduleNotificationForTask({
          taskId: id,
          body: value,
          remindAt,
          repeat,
        })
      }
      const timestamp = Date.now()
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
        console.warn("Failed to persist new task", error)
      }
      const updatedTasks = reindexTasks([newTask, ...tasksRef.current])
      setTasks(updatedTasks)
      await persistPositionsSafe(updatedTasks)
    },
    [persistPositionsSafe, scheduleNotificationForTask, setTasks]
  )

  const handleUpdateTask = useCallback(
    async ({
      taskId,
      nextValue,
      nextRemindAtRaw,
      nextRepeatRaw,
      instructionMatched,
    }) => {
      const existing = tasksRef.current.find((task) => task.id === taskId)
      if (!existing) {
        return
      }

      let nextRemindAt = existing.remindAt
      let nextRepeat = existing.repeat
      let nextNotificationId = existing.notificationId

      if (instructionMatched) {
        await cancelNotificationIfNeeded(existing.notificationId)
        nextRemindAt = nextRemindAtRaw
        nextRepeat = nextRepeatRaw ?? null
        nextNotificationId = null
      } else if (
        existing.notificationId &&
        nextRemindAt &&
        nextValue !== existing.value
      ) {
        await cancelNotificationIfNeeded(existing.notificationId)
        nextNotificationId = null
      }

      if (!nextRemindAt) {
        nextNotificationId = null
      } else if (!nextNotificationId) {
        nextNotificationId = await scheduleNotificationForTask({
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
            ? {
                ...task,
                ...patch,
                updatedAt: updatedAt ?? task.updatedAt,
              }
            : task
        )
      )
      setEditingTaskId(null)
    },
    [cancelNotificationIfNeeded, scheduleNotificationForTask, setTasks]
  )

  const handleDeleteTask = useCallback(
    async (taskId) => {
      const target = tasksRef.current.find((task) => task.id === taskId)
      if (!target) {
        return
      }
      await cancelNotificationIfNeeded(target.notificationId)
      try {
        await deleteTaskRecord(taskId)
      } catch (error) {
        console.warn("Failed to delete task", error)
      }
      const filtered = tasksRef.current.filter((task) => task.id !== taskId)
      const reindexed = reindexTasks(filtered)
      setTasks(reindexed)
      await persistPositionsSafe(reindexed)
      setEditingTaskId((current) => (current === taskId ? null : current))
    },
    [cancelNotificationIfNeeded, persistPositionsSafe, setTasks]
  )

  const handleToggleComplete = useCallback(
    async (taskId, nextCompleted) => {
      const task = tasksRef.current.find((item) => item.id === taskId)
      if (!task) {
        return
      }
      let notificationId = task.notificationId
      if (nextCompleted) {
        await cancelNotificationIfNeeded(notificationId)
        notificationId = null
      } else if (
        !notificationId &&
        task.remindAt &&
        (task.repeat || task.remindAt > Date.now())
      ) {
        notificationId = await scheduleNotificationForTask({
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
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                ...patch,
              }
            : item
        )
      )
    },
    [cancelNotificationIfNeeded, scheduleNotificationForTask, setTasks]
  )

  const handleMoveTask = useCallback(
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
      await persistPositionsSafe(reindexed)
    },
    [persistPositionsSafe, setTasks]
  )

  const handleMoveUp = useCallback(
    (taskId) => {
      handleMoveTask(taskId, -1)
    },
    [handleMoveTask]
  )

  const handleMoveDown = useCallback(
    (taskId) => {
      handleMoveTask(taskId, 1)
    },
    [handleMoveTask]
  )

  const handleSnoozeTask = useCallback(
    async (taskId, sourceContent) => {
      const task = tasksRef.current.find((item) => item.id === taskId)
      if (!task) {
        return
      }
      const snoozeUntil = Date.now() + FIFTEEN_MINUTES_MS
      await cancelNotificationIfNeeded(task.notificationId)
      let notificationId = null
      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: sourceContent?.title ?? "Reminder",
            body: sourceContent?.body ?? task.value,
            data: {
              ...(sourceContent?.data || {}),
              key: taskId,
              snoozed: true,
            },
            categoryIdentifier: "task-reminder-actions",
          },
          trigger: {
            date: snoozeUntil,
            channelId: "reminders",
          },
        })
      } catch (error) {
        console.warn("Failed to snooze notification", error)
        return
      }

      const patch = {
        remindAt: snoozeUntil,
        repeat: null,
        notificationId,
      }
      await updateTaskRecord(taskId, patch)
      setTasks((prev) =>
        prev.map((item) =>
          item.id === taskId
            ? {
                ...item,
                ...patch,
              }
            : item
        )
      )
      console.log(`Task ${taskId} snoozed for 15 minutes`)
    },
    [cancelNotificationIfNeeded, setTasks]
  )

  const submitHandler = useCallback(
    async (rawValue, editingId = null) => {
      const { cleanedText, remindAt, repeat, instructionMatched } =
        parseReminderTokens(rawValue)
      const trimmedValue = cleanedText.trim()
      if (!trimmedValue) {
        return
      }
      const normalizedRemindAt = normalizeRemindAt(remindAt)
      if (editingId) {
        await handleUpdateTask({
          taskId: editingId,
          nextValue: trimmedValue,
          nextRemindAtRaw: normalizedRemindAt,
          nextRepeatRaw: repeat ?? null,
          instructionMatched,
        })
        return
      }
      await handleCreateTask({
        value: trimmedValue,
        remindAt: normalizedRemindAt,
        repeat: repeat ?? null,
      })
    },
    [handleCreateTask, handleUpdateTask]
  )

  const hydrateTasksAsync = useCallback(async () => {
    try {
      await ensureStorageReady()
      const stored = await fetchTasks()
      const normalized = reindexTasks(stored)
      setTasks(normalized)
    } catch (error) {
      console.warn("Failed to load tasks from storage", error)
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
            console.warn("Notification permissions not granted")
          }
        }
      })
      .catch((error) => {
        console.warn("Notification readiness failed", error)
      })

    hydrateTasksAsync()

    const subscription = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const { actionIdentifier } = response
        const taskKey = response?.notification?.request?.content?.data?.key

        if (!taskKey) {
          console.log("Notification tapped without task context")
          return
        }

        if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          console.log(`Reminder opened for task ${taskKey}`)
          return
        }

        if (actionIdentifier === "DONE_ACTION") {
          await handleToggleComplete(taskKey, true)
          return
        }

        if (actionIdentifier === "SNOOZE_ACTION") {
          await handleSnoozeTask(
            taskKey,
            response.notification.request.content
          )
          return
        }

        console.log(
          `Unhandled notification action ${actionIdentifier} for task ${taskKey}`
        )
      }
    )

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [handleSnoozeTask, handleToggleComplete, hydrateTasksAsync])

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
