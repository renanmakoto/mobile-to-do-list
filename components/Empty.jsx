import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { COLORS } from '../src/constants'
import { FONT_SIZES, SPACING } from './styles'

export default function Empty() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nothing scheduled</Text>
      <Text style={styles.subtitle}>Add your first task to get started.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
})
