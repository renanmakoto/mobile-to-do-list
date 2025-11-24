import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import React, { useMemo } from "react"
import { Ionicons } from "@expo/vector-icons"

const formatReminder = (timestamp, repeat) => {
  if (!timestamp) {
    return null
  }

  const date = new Date(timestamp)
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

  if (repeat === "daily") {
    return `Daily at ${timePart}`
  }

  if (repeat === "weekly") {
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" })
    return `${weekday} • ${timePart}`
  }

  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })

  return `${datePart} • ${timePart}`
}

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
  const completed = item.completed
  const now = Date.now()
  const isOverdue =
    !completed && item.remindAt && item.remindAt < now && !item.repeat
  const reminderLabel = useMemo(
    () => formatReminder(item.remindAt, item.repeat),
    [item.remindAt, item.repeat]
  )

  return (
    <View style={[styles.card, completed && styles.cardChecked]}>
      <TouchableOpacity
        onPress={() => toggleComplete?.(item.id, !completed)}
        style={styles.checkboxWrapper}
      >
        <View style={[styles.checkbox, completed && styles.checkboxOn]}>
          {completed && (
            <Ionicons name="checkmark" size={16} color="#EFF9F8" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.title, completed && styles.titleChecked]}>
          {item.value}
        </Text>
        {reminderLabel && (
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isOverdue ? "#858585" : "#00ADA2"}
            />
            <Text
              style={[
                styles.metaText,
                isOverdue && styles.metaTextOverdue,
                completed && styles.metaTextCompleted,
              ]}
            >
              {reminderLabel}
              {isOverdue && " • overdue"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsColumn}>
        <View style={styles.primaryActions}>
          <TouchableOpacity
            onPress={() => onEdit?.(item.id)}
            style={styles.iconButton}
          >
            <Ionicons name="create-outline" size={18} color="#00ADA2" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteItem(item.id)}
            style={styles.iconButton}
          >
            <Ionicons name="trash-outline" size={18} color="#858585" />
          </TouchableOpacity>
        </View>
        <View style={styles.reorderColumn}>
          <TouchableOpacity
            disabled={disableMoveUp}
            onPress={() => onMoveUp?.(item.id)}
            style={[
              styles.iconButton,
              disableMoveUp && styles.iconButtonDisabled,
            ]}
          >
            <Ionicons
              name="chevron-up-outline"
              size={16}
              color="#00ADA2"
            />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={disableMoveDown}
            onPress={() => onMoveDown?.(item.id)}
            style={[
              styles.iconButton,
              styles.iconButtonBottom,
              disableMoveDown && styles.iconButtonDisabled,
            ]}
          >
            <Ionicons
              name="chevron-down-outline"
              size={16}
              color="#00ADA2"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: "#EFF9F8",
    borderWidth: 1,
    borderColor: "#858585",
    marginBottom: 16,
  },
  cardChecked: {
    opacity: 0.65,
    borderColor: "#00ADA2",
  },
  checkboxWrapper: {
    padding: 4,
    marginRight: 16,
  },
  checkbox: {
    height: 26,
    width: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#00ADA2",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: {
    backgroundColor: "#00ADA2",
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: "#00ADA2",
    fontSize: 16,
    fontWeight: "600",
  },
  titleChecked: {
    textDecorationLine: "line-through",
    color: "#858585",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaText: {
    color: "#858585",
    fontSize: 13,
    letterSpacing: 0.3,
    marginLeft: 6,
  },
  metaTextOverdue: {
    color: "#00ADA2",
  },
  metaTextCompleted: {
    color: "#858585",
    opacity: 0.7,
  },
  actionsColumn: {
    marginLeft: 12,
    alignItems: "center",
  },
  primaryActions: {
    flexDirection: "row",
    marginBottom: 6,
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  iconButtonBottom: {
    marginTop: -8,
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  reorderColumn: {
    flexDirection: "column",
    alignItems: "center",
  },
})
