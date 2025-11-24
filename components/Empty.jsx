import { View, Text, StyleSheet } from "react-native"
import React from "react"

export default function Empty() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nothing scheduled</Text>
      <Text style={styles.subtitle}>
        Add your first task to get started.
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
    color: "#00ADA2",
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: "#858585",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
    marginTop: 12,
  },
})
