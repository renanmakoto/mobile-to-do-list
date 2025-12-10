import * as SQLite from 'expo-sqlite'

import { DATABASE } from '../constants'
import { boolToInt } from '../utils'

let databasePromise = null
let initializationPromise = null

const getDatabase = async () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE.NAME)
  }
  return databasePromise
}

const initializeSchema = async () => {
  const db = await getDatabase()

  await db.execAsync('PRAGMA journal_mode = WAL')

  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS ${DATABASE.TABLE_TASKS} (
      id TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      remindAt INTEGER,
      repeat TEXT,
      notificationId TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER,
      position INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `)
}

export const ensureStorageReady = async () => {
  if (!initializationPromise) {
    initializationPromise = initializeSchema()
  }
  return initializationPromise
}

const mapRowToTask = (row) => ({
  id: row.id,
  key: row.id,
  value: row.value,
  remindAt: row.remindAt ?? null,
  repeat: row.repeat ?? null,
  notificationId: row.notificationId ?? null,
  completed: Boolean(row.completed),
  completedAt: row.completedAt ?? null,
  position: row.position,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const sanitizePatch = (patch = {}) => {
  const allowedColumns = new Set(DATABASE.UPDATABLE_COLUMNS)
  const entries = Object.entries(patch).filter(([key]) => allowedColumns.has(key))
  return Object.fromEntries(entries)
}

export const fetchTasks = async () => {
  await ensureStorageReady()

  const db = await getDatabase()
  const rows = await db.getAllAsync(
    `SELECT * FROM ${DATABASE.TABLE_TASKS} ORDER BY position ASC`
  )

  return rows.map(mapRowToTask)
}

export const insertTask = async (task) => {
  await ensureStorageReady()

  const db = await getDatabase()

  await db.runAsync(
    `INSERT INTO ${DATABASE.TABLE_TASKS}
      (id, value, remindAt, repeat, notificationId, completed, completedAt, position, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.value,
      task.remindAt ?? null,
      task.repeat ?? null,
      task.notificationId ?? null,
      boolToInt(task.completed),
      task.completedAt ?? null,
      task.position,
      task.createdAt,
      task.updatedAt,
    ]
  )
}

export const updateTask = async (id, patch = {}) => {
  const safePatch = sanitizePatch(patch)

  if (Object.keys(safePatch).length === 0) {
    return null
  }

  await ensureStorageReady()

  const db = await getDatabase()
  const timestamp = Date.now()

  const setters = []
  const values = []

  Object.entries(safePatch).forEach(([key, value]) => {
    setters.push(`${key} = ?`)
    values.push(key === 'completed' ? boolToInt(value) : (value ?? null))
  })

  setters.push('updatedAt = ?')
  values.push(timestamp, id)

  await db.runAsync(
    `UPDATE ${DATABASE.TABLE_TASKS}
     SET ${setters.join(', ')}
     WHERE id = ?`,
    values
  )

  return timestamp
}

export const deleteTask = async (id) => {
  await ensureStorageReady()

  const db = await getDatabase()

  await db.runAsync(
    `DELETE FROM ${DATABASE.TABLE_TASKS} WHERE id = ?`,
    [id]
  )
}

export const persistPositions = async (orderedTasks) => {
  await ensureStorageReady()

  const db = await getDatabase()
  const timestamp = Date.now()

  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedTasks.length; index++) {
      const task = orderedTasks[index]
      await db.runAsync(
        `UPDATE ${DATABASE.TABLE_TASKS} SET position = ?, updatedAt = ? WHERE id = ?`,
        [index, timestamp, task.id]
      )
    }
  })
}
