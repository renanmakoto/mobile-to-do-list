import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { COLORS, REPEAT_TYPES } from '../src/constants'
import { formatTime } from '../src/utils'
import { BORDER_RADIUS, FONT_SIZES, SPACING } from './styles'

const formatReminderLabel = (timestamp, repeat) => {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const timePart = formatTime(date)

  if (repeat === REPEAT_TYPES.DAILY) {
    return `Daily at ${timePart}`
  }

  if (repeat === REPEAT_TYPES.WEEKLY) {
    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' })
    return `${weekday} • ${timePart}`
  }

  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })

  return `${datePart} • ${timePart}`
}

const Checkbox = ({ checked, onToggle }) => (
  <TouchableOpacity onPress={onToggle} style={styles.checkboxWrapper}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={16} color={COLORS.background} />}
    </View>
  </TouchableOpacity>
)

const IconButton = ({ icon, color, onPress, disabled, style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[styles.iconButton, disabled && styles.iconButtonDisabled, style]}
  >
    <Ionicons name={icon} size={18} color={color} />
  </TouchableOpacity>
)

const ReminderBadge = ({ label, isOverdue, isCompleted }) => (
  <View style={styles.reminderRow}>
    <Ionicons
      name="time-outline"
      size={14}
      color={isOverdue ? COLORS.primary : COLORS.textSecondary}
    />
    <Text
      style={[
        styles.reminderText,
        isOverdue && styles.reminderTextOverdue,
        isCompleted && styles.reminderTextCompleted,
      ]}
    >
      {label}
      {isOverdue && ' • overdue'}
    </Text>
  </View>
)

export default function Task({
  item,
  deleteItem,
  toggleComplete,
  onEdit,
  onMoveUp,
  onMoveDown,
  disableMoveUp,
  disableMoveDown,
}) {
  const { id, value, completed, remindAt, repeat } = item

  const isOverdue = useMemo(() => {
    if (completed || !remindAt || repeat) return false
    return remindAt < Date.now()
  }, [completed, remindAt, repeat])

  const reminderLabel = useMemo(
    () => formatReminderLabel(remindAt, repeat),
    [remindAt, repeat]
  )

  const handleToggle = () => toggleComplete?.(id, !completed)
  const handleEdit = () => onEdit?.(id)
  const handleDelete = () => deleteItem(id)
  const handleMoveUp = () => onMoveUp?.(id)
  const handleMoveDown = () => onMoveDown?.(id)

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <Checkbox checked={completed} onToggle={handleToggle} />

      <View style={styles.content}>
        <Text style={[styles.title, completed && styles.titleCompleted]}>
          {value}
        </Text>

        {reminderLabel && (
          <ReminderBadge
            label={reminderLabel}
            isOverdue={isOverdue}
            isCompleted={completed}
          />
        )}
      </View>

      <View style={styles.actionsColumn}>
        <View style={styles.primaryActions}>
          <IconButton
            icon="create-outline"
            color={COLORS.primary}
            onPress={handleEdit}
          />
          <IconButton
            icon="trash-outline"
            color={COLORS.textSecondary}
            onPress={handleDelete}
          />
        </View>

        <View style={styles.reorderActions}>
          <IconButton
            icon="chevron-up-outline"
            color={COLORS.textSecondary}
            onPress={handleMoveUp}
            disabled={disableMoveUp}
          />
          <IconButton
            icon="chevron-down-outline"
            color={COLORS.textSecondary}
            onPress={handleMoveDown}
            disabled={disableMoveDown}
            style={styles.moveDownButton}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.textSecondary,
  },
  cardCompleted: {
    opacity: 0.5,
  },
  checkboxWrapper: {
    padding: SPACING.xs,
    marginRight: SPACING.md,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  reminderText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.3,
    marginLeft: SPACING.xs + 2,
  },
  reminderTextOverdue: {
    color: COLORS.primary,
  },
  reminderTextCompleted: {
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  actionsColumn: {
    marginLeft: SPACING.md,
    alignItems: 'center',
  },
  primaryActions: {
    flexDirection: 'row',
    marginBottom: SPACING.xs + 2,
  },
  reorderActions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    padding: SPACING.xs + 2,
    marginLeft: SPACING.xs,
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  moveDownButton: {
    marginTop: -8,
  },
})
