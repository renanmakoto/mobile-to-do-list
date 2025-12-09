import { StyleSheet } from 'react-native'

import { COLORS } from '../src/constants'

export const sharedStyles = StyleSheet.create({
  textPrimary: {
    color: COLORS.primary,
  },
  textSecondary: {
    color: COLORS.textSecondary,
  },
  textBold: {
    fontWeight: '600',
  },

  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
}

export const FONT_SIZES = {
  xs: 12,
  sm: 13,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  title: 22,
  header: 34,
}

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
}
