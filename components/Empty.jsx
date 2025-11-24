import { View, Text, StyleSheet } from "react-native"
import React from "react"
import { Ionicons } from "@expo/vector-icons"

export default function Empty() {
  return (
    <View style={styles.container}>
      <Ionicons name="sparkles-outline" size={48} color="#94a3b8" />
      <Text style={styles.title}>You are all caught up</Text>
      <Text style={styles.subtitle}>
        Add a task above and set a reminder to keep momentum.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
    marginTop: 6,
  },
})
