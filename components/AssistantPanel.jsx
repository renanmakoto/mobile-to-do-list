import React from "react"
import { View, Text, StyleSheet } from "react-native"

export default function AssistantPanel({
  greeting,
  summary,
  suggestions = [],
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.summary}>{summary}</Text>
      {suggestions.length > 0 && (
        <View style={styles.list}>
          {suggestions.map((suggestion) => (
            <Text key={suggestion.id} style={styles.listText}>
              • {suggestion.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  greeting: {
    color: "#00ADA2",
    fontSize: 16,
    fontWeight: "600",
  },
  summary: {
    marginTop: 8,
    color: "#858585",
    lineHeight: 20,
    fontSize: 14,
  },
  list: {
    marginTop: 12,
  },
  listText: {
    color: "#858585",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
})
