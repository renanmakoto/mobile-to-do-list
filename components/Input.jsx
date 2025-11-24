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
  const [startTime, setStartTime] = useState(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const isEditing = Boolean(editingTask)
  const buttonLabel = isEditing ? "Update task" : "Save task"
  const helperCopy = useMemo(
    () =>
      isEditing
        ? 'Tip: Add "> clear" to remove a reminder while editing.'
        : 'Tip: Add "> in 30m", "daily 08:00", or "@ next tue 09:30".',
    [isEditing]
  )

  useEffect(() => {
    if (editingTask) {
      setValue(editingTask.value)
      if (editingTask.remindAt) {
        const date = new Date(editingTask.remindAt)
        setStartTime(date)
      } else {
        setStartTime(null)
      }
    } else {
      setValue("")
      setStartTime(null)
    }
  }, [editingTask])

  const formatTimeLabel = (date) => {
    if (!date) return "Pick a time"
    let hours = date.getHours()
    const minutes = `${date.getMinutes()}`.padStart(2, "0")
    const suffix = hours >= 12 ? "PM" : "AM"
    hours = hours % 12 || 12
    return `${`${hours}`.padStart(2, "0")}:${minutes} ${suffix}`
  }

  const formatTimeForSubmission = (date) => {
    if (!date) return ""
    const hours = `${date.getHours()}`.padStart(2, "0")
    const minutes = `${date.getMinutes()}`.padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const handleTimeChange = (_event, selectedDate) => {
    if (Platform.OS !== "ios") {
      setShowTimePicker(false)
    }
    if (!selectedDate) {
      return
    }
    setStartTime(selectedDate)
  }

  const handleSubmit = async () => {
    if (!value.trim()) {
      return
    }

    try {
      const formattedTime = formatTimeForSubmission(startTime)
      const composedValue = formattedTime
        ? `${value} > ${formattedTime}`
        : value
      await submitHandler(composedValue, editingTask?.id || null)
    } finally {
      Keyboard.dismiss()
      if (!editingTask) {
        setValue("")
        setStartTime(null)
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
        <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
          <Text style={styles.addButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Start time</Text>
        <Pressable
          style={styles.timePicker}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeValue}>{formatTimeLabel(startTime)}</Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={startTime || new Date()}
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
    borderBottomWidth: 1,
    borderColor: "#858585",
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    color: "#00ADA2",
    fontSize: 16,
    paddingVertical: 12,
  },
  timeRow: {
    marginTop: 16,
  },
  timeLabel: {
    color: "#858585",
    fontSize: 13,
    marginBottom: 8,
  },
  timePicker: {
    borderWidth: 1,
    borderColor: "#858585",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeValue: {
    color: "#00ADA2",
    fontSize: 15,
  },
  addButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    marginTop: 8,
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
