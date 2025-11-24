import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from "react-native"
import React, { useEffect, useMemo, useState } from "react"
import { Ionicons } from "@expo/vector-icons"

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
        <Ionicons name="sparkles-outline" size={20} color="#60a5fa" />
        <TextInput
          style={styles.input}
          placeholder="Describe what needs to happen..."
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={setValue}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>

      <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color="#0f172a" />
        <Text style={styles.addButtonText}>{buttonLabel}</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>{helperCopy}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    padding: 20,
    marginBottom: 32,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  cardTitle: {
    color: "#e2e8f0",
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
    color: "#f87171",
    fontSize: 14,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    paddingHorizontal: 14,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  input: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 10,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#60a5fa",
    paddingVertical: 12,
  },
  addButtonText: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: 15,
    letterSpacing: 0.4,
    marginLeft: 8,
  },
  helperText: {
    marginTop: 14,
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
  },
})
