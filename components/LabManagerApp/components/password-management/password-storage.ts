import {
  PASSWORD_FREEZE_STORAGE_KEY,
  PASSWORD_FREEZE_TIMER_KEY,
  BACKUP_KEYS,
  PASSWORD_RESET_INTERVAL_MS,
  MAX_PASSWORD_CLICKS,
} from "./types"

export const inMemoryPasswordState = {
  clickCount: 0,
  lastResetTime: Date.now(),
  isRateLimited: false,
  timerId: null as NodeJS.Timeout | null,
  // Backup mechanisms
  sessionStartTime: Date.now(),
  backupTimer: null as NodeJS.Timeout | null,
}

export const initializePasswordState = (email: string) => {
  const now = Date.now()

  // Try multiple storage sources in order of preference
  const storageSources = [
    // Primary: localStorage with new keys
    () => {
      const storedState = localStorage.getItem(PASSWORD_FREEZE_STORAGE_KEY)
      const storedTimer = localStorage.getItem(PASSWORD_FREEZE_TIMER_KEY)
      if (storedState && storedTimer) {
        const state = JSON.parse(storedState)
        const lastResetTime = Number.parseInt(storedTimer, 10)
        if (state.email === email) return { state, lastResetTime }
      }
      return null
    },

    // Backup 1: sessionStorage
    () => {
      const sessionState = sessionStorage.getItem(BACKUP_KEYS.session)
      const sessionTimer = sessionStorage.getItem(BACKUP_KEYS.timestamp)
      if (sessionState && sessionTimer) {
        const state = JSON.parse(sessionState)
        const lastResetTime = Number.parseInt(sessionTimer, 10)
        if (state.email === email) return { state, lastResetTime }
      }
      return null
    },

    // Backup 2: Check if we have a session start time to calculate elapsed time
    () => {
      const memoryBackup = sessionStorage.getItem(BACKUP_KEYS.memory)
      if (memoryBackup) {
        const backup = JSON.parse(memoryBackup)
        if (backup.email === email && backup.sessionStartTime) {
          const sessionElapsed = now - backup.sessionStartTime
          const estimatedLastReset = now - (sessionElapsed % PASSWORD_RESET_INTERVAL_MS)
          return {
            state: { email, clickCount: backup.clickCount || 0 },
            lastResetTime: estimatedLastReset,
          }
        }
      }
      return null
    },
  ]

  // Try each storage source
  for (const getSource of storageSources) {
    try {
      const result = getSource()
      if (result) {
        const { state, lastResetTime } = result
        const timeSinceLastReset = now - lastResetTime

        if (timeSinceLastReset < PASSWORD_RESET_INTERVAL_MS) {
          // Valid state found, restore it
          inMemoryPasswordState.clickCount = state.clickCount || 0
          inMemoryPasswordState.lastResetTime = lastResetTime
          inMemoryPasswordState.isRateLimited = (state.clickCount || 0) >= MAX_PASSWORD_CLICKS

          // Update all storage mechanisms
          updateAllStorageMechanisms(email, state.clickCount || 0, lastResetTime)

          return {
            clickCount: state.clickCount || 0,
            lastResetTime,
            isRateLimited: (state.clickCount || 0) >= MAX_PASSWORD_CLICKS,
          }
        }
      }
    } catch (error) {
      console.warn("Failed to parse stored state from source:", error)
    }
  }

  try {
    const oldStoredClickCount = localStorage.getItem(`${email}-passwordClickCount`)
    const oldStoredLastResetTime = localStorage.getItem(`${email}-passwordLastResetTime`)

    if (oldStoredClickCount && oldStoredLastResetTime) {
      const clickCount = Number.parseInt(oldStoredClickCount, 10)
      const lastResetTime = Number.parseInt(oldStoredLastResetTime, 10)
      const timeSinceLastReset = now - lastResetTime

      if (timeSinceLastReset < PASSWORD_RESET_INTERVAL_MS) {
        // Migrate to new storage format
        inMemoryPasswordState.clickCount = clickCount
        inMemoryPasswordState.lastResetTime = lastResetTime
        inMemoryPasswordState.isRateLimited = clickCount >= MAX_PASSWORD_CLICKS

        updateAllStorageMechanisms(email, clickCount, lastResetTime)

        // Clean up old keys
        localStorage.removeItem(`${email}-passwordClickCount`)
        localStorage.removeItem(`${email}-passwordLastResetTime`)

        return {
          clickCount,
          lastResetTime,
          isRateLimited: clickCount >= MAX_PASSWORD_CLICKS,
        }
      } else {
        // Clean up old expired keys
        localStorage.removeItem(`${email}-passwordClickCount`)
        localStorage.removeItem(`${email}-passwordLastResetTime`)
      }
    }
  } catch (error) {
    console.warn("Failed to migrate old storage:", error)
  }

  inMemoryPasswordState.clickCount = 0
  inMemoryPasswordState.lastResetTime = now
  inMemoryPasswordState.isRateLimited = false
  inMemoryPasswordState.sessionStartTime = now

  updateAllStorageMechanisms(email, 0, now)

  return {
    clickCount: 0,
    lastResetTime: now,
    isRateLimited: false,
  }
}

export const updateAllStorageMechanisms = (email: string, clickCount: number, lastResetTime: number) => {
  const state = { email, clickCount }

  try {
    // Primary storage
    localStorage.setItem(PASSWORD_FREEZE_STORAGE_KEY, JSON.stringify(state))
    localStorage.setItem(PASSWORD_FREEZE_TIMER_KEY, lastResetTime.toString())
  } catch (error) {
    console.warn("localStorage failed:", error)
  }

  try {
    // Backup storage 1: sessionStorage
    sessionStorage.setItem(BACKUP_KEYS.session, JSON.stringify(state))
    sessionStorage.setItem(BACKUP_KEYS.timestamp, lastResetTime.toString())
  } catch (error) {
    console.warn("sessionStorage failed:", error)
  }

  try {
    // Backup storage 2: memory backup with session tracking
    const memoryBackup = {
      email,
      clickCount,
      lastResetTime,
      sessionStartTime: inMemoryPasswordState.sessionStartTime,
      timestamp: Date.now(),
    }
    sessionStorage.setItem(BACKUP_KEYS.memory, JSON.stringify(memoryBackup))
  } catch (error) {
    console.warn("memory backup failed:", error)
  }
}

export const clearAllStorageMechanisms = () => {
  try {
    localStorage.removeItem(PASSWORD_FREEZE_STORAGE_KEY)
    localStorage.removeItem(PASSWORD_FREEZE_TIMER_KEY)
    sessionStorage.removeItem(BACKUP_KEYS.session)
    sessionStorage.removeItem(BACKUP_KEYS.timestamp)
    sessionStorage.removeItem(BACKUP_KEYS.memory)
  } catch (error) {
    console.warn("Failed to clear storage:", error)
  }
}

export { MAX_PASSWORD_CLICKS } from "./types"
