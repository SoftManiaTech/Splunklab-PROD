export interface PasswordModalState {
  isOpen: boolean
  loading: boolean
  error: string | null
  details: {
    username: string
    password: string
    publicIp?: string
  } | null
}

export interface PasswordState {
  clickCount: number
  lastResetTime: number
  isRateLimited: boolean
}

export const MAX_PASSWORD_CLICKS = 5
export const PASSWORD_RESET_INTERVAL_MS = 20 * 60 * 1000 // 20 minutes

export const PASSWORD_FREEZE_STORAGE_KEY = "windows_password_freeze_state"
export const PASSWORD_FREEZE_TIMER_KEY = "windows_password_freeze_timer"

export const BACKUP_KEYS = {
  session: "win_pwd_session_backup",
  memory: "win_pwd_memory_backup",
  timestamp: "win_pwd_timestamp_backup",
}
