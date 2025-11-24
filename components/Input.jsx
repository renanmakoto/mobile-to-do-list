import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Pressable,
  Platform,
} from "react-native"
import React, { useEffect, useMemo, useState } from "react"
import DateTimePicker from "@react-native-community/datetimepicker"

export default function Input({ submitHandler, editingTask, cancelEdit }) {
  const [value, setValue] = useState("")
  const [startDateTime, setStartDateTime] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const isEditing = Boolean(editingTask)
  const buttonLabel = isEditing ? "Update task" : "Save task"

  useEffect(() => {
    if (editingTask) {
      setValue(editingTask.value)
      if (editingTask.remindAt) {
        const date = new Date(editingTask.remindAt)
        setStartDateTime(date)
      } else {
        setStartDateTime(null)
      }
    } else {
      setValue("")
      setStartDateTime(null)
    }
  }, [editingTask])

  const formatDateLabel = (date) => {
    if (!date) return "Pick a date"
    return date.toLocaleDateString()
  }

  const formatTimeLabel = (date) => {
    if (!date) return "Pick a time"
    let hours = date.getHours()
    const minutes = `${date.getMinutes()}`.padStart(2, "0")
    const suffix = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${`${hours}`.padStart(2, "0")}:${minutes} ${suffix}`
  }

  const handleTimeChange = (_event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowTimePicker(false)
    }
    if (!selectedDate) {
      return
    }
    const base = startDateTime || new Date()
    const updated = new Date(base)
    updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0)
    setStartDateTime(updated)
  }

  const handleDateChange = (_event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false)
    }
    if (!selectedDate) {
      return
    }
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
    if (!value.trim()) {
      return
    }

    try {
      const remindAtOverride = startDateTime
        ? startDateTime.getTime()
        : null
      await submitHandler(
        value,
        editingTask?.id || null,
        remindAtOverride
      )
    } finally {
      Keyboard.dismiss()
      if (!editingTask) {
        setValue("")
        setStartDateTime(null)
      }
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Text style={styles.cardTitle}>
          {isEditing ? "Update task" : "Add a task"}
        </Text>
        {isEditing && (
          <TouchableOpacity onPress={cancelEdit || (() => {})}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Describe what needs to happen..."
          placeholderTextColor="#858585"
          value={value}
          onChangeText={setValue}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Start date</Text>
        <Pressable
          style={styles.pickerSurface}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.timeValue}>{formatDateLabel(startDateTime)}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={startDateTime || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            themeVariant="light"
            textColor="#00ADA2"
            accentColor="#00ADA2"
          />
        )}
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Start time</Text>
        <Pressable
          style={styles.pickerSurface}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeValue}>{formatTimeLabel(startDateTime)}</Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={startDateTime || new Date()}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
            themeVariant="light"
            textColor="#00ADA2"
            accentColor="#00ADA2"
          />
        )}
      </View>

      <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
        <Text style={styles.addButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>{helperCopy}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    marginBottom: 32,
  },
  cardTitle: {
    color: "#858585",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cancelLink: {
    color: "#00ADA2",
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#00ADA2",
    borderRadius: 10,
    padding: 12,
  },
  input: {
    flex: 1,
    color: "#00ADA2",
    fontSize: 16,
    paddingVertical: 10,
  },
  timeRow: {
    marginTop: 16,
  },
  timeLabel: {
    color: "#858585",
    fontSize: 13,
    marginBottom: 8,
  },
  pickerSurface: {
    borderWidth: 1,
    borderColor: "#00ADA2",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#EFF9F8",
  },
  timeValue: {
    color: "#00ADA2",
    fontSize: 15,
  },
  addButton: {
    alignSelf: "center",
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#00ADA2",
    borderRadius: 10,
    paddingHorizontal: 24,
  },
  addButtonText: {
    fontWeight: "600",
    color: "#00ADA2",
    fontSize: 15,
    letterSpacing: 0.4,
  },
  helperText: {
    marginTop: 14,
    color: "#858585",
    fontSize: 13,
    lineHeight: 18,
  },
})
