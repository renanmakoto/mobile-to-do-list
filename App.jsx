import { StatusBar } from "expo-status-bar"
import React from "react"
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
} from "react-native"
import AssistantPanel from "./components/AssistantPanel"
import Empty from "./components/Empty"
import Header from "./components/Header"
import Input from "./components/Input"
import Task from "./components/Task"
import { useTaskManager } from "./src/hooks/useTaskManager"

export default function App() {
  const {
    tasks,
    loadingTasks,
    reminderCount,
    assistantInsights,
    editingTask,
    submitHandler,
    handleDeleteTask,
    handleToggleComplete,
    handleMoveUp,
    handleMoveDown,
    startEditing,
    cancelEditing,
  } = useTaskManager()

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Task
            item={item}
            deleteItem={handleDeleteTask}
            toggleComplete={handleToggleComplete}
            onEdit={startEditing}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            disableMoveUp={index === 0}
            disableMoveDown={index === tasks.length - 1}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.listContentEmpty,
        ]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Header totalTasks={tasks.length} remindersCount={reminderCount} />
            <AssistantPanel
              greeting={assistantInsights.greeting}
              summary={assistantInsights.summary}
              suggestions={assistantInsights.suggestions}
            />
            <Input
              submitHandler={submitHandler}
              editingTask={editingTask}
              cancelEdit={cancelEditing}
            />
            {tasks.length > 0 && (
              <Text style={styles.sectionTitle}>Your tasks</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loadingTasks ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color="#00ADA2" />
            </View>
          ) : (
            <Empty />
          )
        }
      />
      <Text style={styles.footer}>2025 • dotExtension</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EFF9F8",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listHeader: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: "#858585",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 18,
  },
  loader: {
    paddingTop: 80,
    alignItems: "center",
  },
  footer: {
    color: "#858585",
    textAlign: "center",
    paddingVertical: 18,
    fontSize: 12,
    letterSpacing: 1,
  },
})
