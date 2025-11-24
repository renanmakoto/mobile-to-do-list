import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from "react-native"
import React, { useEffect, useMemo, useState } from "react"

export default function Input({ submitHandler, editingTask, cancelEdit }) {
  const [value, setValue] = useState("")
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
    } else {
      setValue("")
    }
  }, [editingTask])

  const handleSubmit = async () => {
    if (!value.trim()) {
      return
    }

    try {
      await submitHandler(value, editingTask?.id || null)
    } finally {
      Keyboard.dismiss()
      if (!editingTask) {
        setValue("")
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
