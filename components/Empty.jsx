import { View, Text, StyleSheet } from "react-native"
import React from "react"
import { Ionicons } from "@expo/vector-icons"

export default function Empty() {
  return (
    <View style={styles.container}>
      <Ionicons name="sparkles-outline" size={48} color="#00ADA2" />
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
    color: "#EFF9F8",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  subtitle: {
    color: "#EFF9F8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
    marginTop: 6,
  },
})
