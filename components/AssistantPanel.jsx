import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function AssistantPanel({
  greeting,
  summary,
  suggestions = [],
}) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="sparkles-outline" size={20} color="#f472b6" />
        <Text style={styles.greeting}>{greeting}</Text>
      </View>
      <Text style={styles.summary}>{summary}</Text>

      {suggestions.length > 0 && (
        <View style={styles.list}>
          {suggestions.map((suggestion, index) => (
            <View
              key={suggestion.id}
              style={[
                styles.listItem,
                index !== 0 && styles.listItemSpaced,
              ]}
            >
              <Ionicons
                name={suggestion.icon || "bulb-outline"}
                size={18}
                color="#fbcfe8"
              />
              <Text style={styles.listText}>{suggestion.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(99, 102, 241, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(129, 140, 248, 0.35)",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    marginLeft: 10,
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "600",
  },
  summary: {
    marginTop: 12,
    color: "#e0e7ff",
    lineHeight: 20,
    fontSize: 14,
  },
  list: {
    marginTop: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemSpaced: {
    marginTop: 12,
  },
  listText: {
    marginLeft: 10,
    color: "#e0e7ff",
    fontSize: 13,
    flex: 1,
  },
})
