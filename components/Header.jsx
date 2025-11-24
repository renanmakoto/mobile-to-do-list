import { View, Text, StyleSheet } from "react-native"
import React from "react"

const formatToday = () => {
  const now = new Date()
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

export default function Header({ totalTasks = 0, remindersCount = 0 }) {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Plan your day</Text>
      <Text style={styles.title}>Mobile To-Do</Text>
      <Text style={styles.subtitle}>
        Keep track of everything important in one place.
      </Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaCard, styles.metaCardLeft]}>
          <Text style={styles.metaValue}>{totalTasks}</Text>
          <Text style={styles.metaLabel}>Tasks</Text>
        </View>
        <View style={[styles.metaCard, styles.metaCardRight]}>
          <Text style={styles.metaValue}>{remindersCount}</Text>
          <Text style={styles.metaLabel}>Reminders</Text>
        </View>
      </View>

      <Text style={styles.date}>{formatToday()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  kicker: {
    color: "#93c5fd",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    color: "#f8fafc",
    fontWeight: "700",
  },
  subtitle: {
    color: "#cbd5f5",
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 28,
  },
  metaCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(23, 37, 84, 0.45)",
  },
  metaCardLeft: {
    marginRight: 12,
  },
  metaCardRight: {
    marginLeft: 12,
  },
  metaValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  metaLabel: {
    color: "#94a3b8",
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 4,
    textTransform: "uppercase",
  },
  date: {
    marginTop: 28,
    color: "#94a3b8",
    fontSize: 13,
    letterSpacing: 0.6,
  },
})
