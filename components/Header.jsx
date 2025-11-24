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
      <Text style={styles.kicker}>Today</Text>
      <Text style={styles.title}>Mobile To-Do</Text>
      <Text style={styles.subtitle}></Text>

      <View style={styles.metaRow}>
        <View style={styles.metaCard}>
          <Text style={styles.metaValue}>{totalTasks}</Text>
          <Text style={styles.metaLabel}>Tasks</Text>
        </View>
        <View style={styles.metaCard}>
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
    color: "#858585",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 34,
    color: "#00ADA2",
    fontWeight: "700",
  },
  subtitle: {
    color: "#858585",
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 28,
    justifyContent: "space-between",
  },
  metaCard: {
    flex: 1,
    paddingVertical: 4,
  },
  metaValue: {
    color: "#00ADA2",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  metaLabel: {
    color: "#858585",
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 4,
    textTransform: "uppercase",
  },
  date: {
    marginTop: 28,
    color: "#858585",
    fontSize: 13,
    letterSpacing: 0.6,
    textAlign: "center",
  },
})
