import * as SQLite from "expo-sqlite"

const DB_NAME = "todot.db"
const TABLE_TASKS = "tasks"
const COLUMN_WHITELIST = new Set([
  "value",
  "remindAt",
  "repeat",
  "notificationId",
  "completed",
  "completedAt",
  "position",
])

let dbPromise
let initPromise

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME)
  }
  return dbPromise
}

const boolToInt = (value) => (value ? 1 : 0)

const mapRowToTask = (row) => ({
  id: row.id,
  key: row.id,
  value: row.value,
  remindAt: row.remindAt ?? null,
  repeat: row.repeat ?? null,
  notificationId: row.notificationId ?? null,
  completed: !!row.completed,
  completedAt: row.completedAt ?? null,
  position: row.position,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const runInit = async () => {
  const db = await getDb()
  await db.execAsync("PRAGMA journal_mode = WAL")
  await db.runAsync(
    `CREATE TABLE IF NOT EXISTS ${TABLE_TASKS} (
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
    )`
  )
}

export const ensureStorageReady = async () => {
  if (!initPromise) {
    initPromise = runInit()
  }
  return initPromise
}

export const fetchTasks = async () => {
  await ensureStorageReady()
  const db = await getDb()
  const rows = await db.getAllAsync(
    `SELECT * FROM ${TABLE_TASKS} ORDER BY position ASC`
  )
  return rows.map(mapRowToTask)
}

export const insertTask = async (task) => {
  await ensureStorageReady()
  const db = await getDb()
  await db.runAsync(
    `INSERT INTO ${TABLE_TASKS}
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

const sanitisePatch = (patch = {}) => {
  const entries = Object.entries(patch).filter(([key]) =>
    COLUMN_WHITELIST.has(key)
  )
  return Object.fromEntries(entries)
}

export const updateTask = async (id, patch = {}) => {
  const safePatch = sanitisePatch(patch)
  if (Object.keys(safePatch).length === 0) {
    return null
  }
  await ensureStorageReady()
  const db = await getDb()
  const now = Date.now()
  const setters = []
  const values = []
  Object.entries(safePatch).forEach(([key, value]) => {
    if (key === "completed") {
      setters.push(`${key} = ?`)
      values.push(boolToInt(value))
    } else {
      setters.push(`${key} = ?`)
      values.push(value ?? null)
    }
  })
  setters.push("updatedAt = ?")
  values.push(now, id)
  await db.runAsync(
    `UPDATE ${TABLE_TASKS}
      SET ${setters.join(", ")}
      WHERE id = ?`,
    values
  )
  return now
}

export const deleteTask = async (id) => {
  await ensureStorageReady()
  const db = await getDb()
  await db.runAsync(`DELETE FROM ${TABLE_TASKS} WHERE id = ?`, [id])
}

export const persistPositions = async (orderedTasks) => {
  await ensureStorageReady()
  const db = await getDb()
  const stamp = Date.now()
  await db.withTransactionAsync(async () => {
    for (let index = 0; index < orderedTasks.length; index += 1) {
      const task = orderedTasks[index]
      await db.runAsync(
        `UPDATE ${TABLE_TASKS} SET position = ?, updatedAt = ? WHERE id = ?`,
        [index, stamp, task.id]
      )
    }
  })
}
