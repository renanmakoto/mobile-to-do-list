import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../src/constants'
import { formatDate } from '../src/utils'
import { FONT_SIZES, SPACING } from './styles'

const MetricCard = ({ value, label }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
)

export default function Header({ totalTasks = 0, remindersCount = 0 }) {
  const todayFormatted = formatDate(new Date())

  return (
    <View style={styles.container}>
      <Text style={styles.title}>toDot</Text>

      <View style={styles.metricsRow}>
        <MetricCard value={totalTasks} label="Tasks" />
        <MetricCard value={remindersCount} label="Reminders" />
      </View>

      <Text style={styles.date}>{todayFormatted}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.header,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 28,
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    paddingVertical: SPACING.xs,
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
  },
  date: {
    marginTop: 28,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
})
