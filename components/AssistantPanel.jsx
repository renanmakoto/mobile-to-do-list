import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../src/constants'
import { FONT_SIZES, SPACING } from './styles'

const SuggestionItem = ({ label }) => (
  <Text style={styles.suggestionText}>• {label}</Text>
)

export default function AssistantPanel({
  greeting = '',
  summary = '',
  suggestions = [],
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>

      {summary && <Text style={styles.summary}>{summary}</Text>}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsList}>
          {suggestions.map((suggestion) => (
            <SuggestionItem key={suggestion.id} label={suggestion.label} />
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  greeting: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
  },
  summary: {
    marginTop: SPACING.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontSize: FONT_SIZES.md,
  },
  suggestionsList: {
    marginTop: SPACING.md,
  },
  suggestionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
    marginTop: SPACING.xs + 2,
  },
})
