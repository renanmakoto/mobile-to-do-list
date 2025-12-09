import React, { useEffect, useState } from 'react'
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

import { COLORS } from '../src/constants'
import { BORDER_RADIUS, FONT_SIZES, SPACING } from './styles'

const formatDateLabel = (date) => {
  if (!date) return 'Pick a date'
  return date.toLocaleDateString()
}

const formatTimeLabel = (date) => {
  if (!date) return 'Pick a time'

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const suffix = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12 || 12

  return `${String(hours).padStart(2, '0')}:${minutes} ${suffix}`
}

const PickerButton = ({ label, value, onPress }) => (
  <View style={styles.pickerRow}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <Pressable style={styles.pickerSurface} onPress={onPress}>
      <Text style={styles.pickerValue}>{value}</Text>
    </Pressable>
  </View>
)

export default function Input({ submitHandler, editingTask, cancelEdit }) {
  const [value, setValue] = useState('')
  const [startDateTime, setStartDateTime] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const isEditing = Boolean(editingTask)
  const buttonLabel = isEditing ? 'Update task' : 'Save task'
  const formTitle = isEditing ? 'Update task' : 'Add a task'

  useEffect(() => {
    if (editingTask) {
      setValue(editingTask.value)
      setStartDateTime(editingTask.remindAt ? new Date(editingTask.remindAt) : null)
    } else {
      setValue('')
      setStartDateTime(null)
    }
  }, [editingTask])

  const handleTimeChange = (_event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false)
    }

    if (!selectedDate) return

    const base = startDateTime || new Date()
    const updated = new Date(base)
    updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0)
    setStartDateTime(updated)
  }

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false)
    }

    if (!selectedDate) return

    const base = startDateTime || new Date()
    const updated = new Date(base)
    updated.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    )
    setStartDateTime(updated)
  }

  const handleSubmit = async () => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    try {
      const remindAtOverride = startDateTime?.getTime() ?? null
      await submitHandler(value, editingTask?.id ?? null, remindAtOverride)
    } finally {
      Keyboard.dismiss()

      if (!editingTask) {
        setValue('')
        setStartDateTime(null)
      }
    }
  }

  const handleCancel = () => {
    cancelEdit?.()
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{formTitle}</Text>
        {isEditing && (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Describe what needs to happen..."
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={setValue}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <PickerButton
        label="Start date"
        value={formatDateLabel(startDateTime)}
        onPress={() => setShowDatePicker(true)}
      />

      {showDatePicker && (
        <DateTimePicker
          value={startDateTime || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          themeVariant="light"
          textColor={COLORS.primary}
          accentColor={COLORS.primary}
        />
      )}

      <PickerButton
        label="Start time"
        value={formatTimeLabel(startDateTime)}
        onPress={() => setShowTimePicker(true)}
      />

      {showTimePicker && (
        <DateTimePicker
          value={startDateTime || new Date()}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          themeVariant="light"
          textColor={COLORS.primary}
          accentColor={COLORS.primary}
        />
      )}

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  cancelLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  input: {
    flex: 1,
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    paddingVertical: 10,
  },
  pickerRow: {
    marginTop: SPACING.lg,
  },
  pickerLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
  },
  pickerSurface: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
  },
  pickerValue: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
  },
  submitButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xl,
  },
  submitButtonText: {
    fontWeight: '600',
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 0.4,
  },
})
