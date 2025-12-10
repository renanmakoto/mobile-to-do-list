import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'

import AssistantPanel from './components/AssistantPanel'
import Empty from './components/Empty'
import Header from './components/Header'
import Input from './components/Input'
import Task from './components/Task'
import { COLORS } from './src/constants'
import { useTaskManager } from './src/hooks/useTaskManager'
import { FONT_SIZES, SPACING } from './components/styles'

const CURRENT_YEAR = new Date().getFullYear()

const LoadingState = () => (
  <View style={styles.loader}>
    <ActivityIndicator size="small" color={COLORS.primary} />
  </View>
)

const TaskListHeader = ({ hasTasks }) =>
  hasTasks ? <Text style={styles.sectionTitle}>Your tasks</Text> : null

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

  const renderListHeader = () => (
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

      <TaskListHeader hasTasks={tasks.length > 0} />
    </View>
  )

  const renderTask = ({ item, index }) => (
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
  )

  const renderEmptyState = () =>
    loadingTasks ? <LoadingState /> : <Empty />

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          tasks.length === 0 && styles.listContentEmpty,
        ]}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
      />

      <Text style={styles.footer}>{CURRENT_YEAR} • dotExtension</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 120,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  listHeader: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.lg + 2,
  },
  loader: {
    paddingTop: 80,
    alignItems: 'center',
  },
  footer: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg + 2,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1,
  },
})
