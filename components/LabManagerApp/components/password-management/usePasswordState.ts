"use client"

import { useState, useCallback, useEffect } from "react"
import { type PasswordModalState, PASSWORD_RESET_INTERVAL_MS, MAX_PASSWORD_CLICKS } from "./types"
import { initializePasswordState, inMemoryPasswordState, updateAllStorageMechanisms } from "./password-storage"

export const usePasswordState = (email: string) => {
  const [passwordModal, setPasswordModal] = useState<PasswordModalState>({
    isOpen: false,
    loading: false,
    error: null,
    details: null,
  })

  const [passwordClickCount, setPasswordClickCount] = useState<number>(() => {
    const initialState = initializePasswordState(email)
    return initialState.clickCount
  })

  const [passwordLastResetTime, setPasswordLastResetTime] = useState<number>(() => {
    return inMemoryPasswordState.lastResetTime
  })

  const [isPasswordRateLimited, setIsPasswordRateLimited] = useState(() => {
    return inMemoryPasswordState.isRateLimited
  })

  const [remainingTime, setRemainingTime] = useState(0)

  // Helper function to format milliseconds into MM:SS
  const formatRemainingTime = useCallback((seconds: number): string => {
    const totalSeconds = Math.max(0, seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Password rate limiting timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (isPasswordRateLimited) {
      const updateRemainingTime = () => {
        const now = Date.now()
        const timeSinceLastReset = now - passwordLastResetTime
        const timeRemaining = Math.max(0, PASSWORD_RESET_INTERVAL_MS - timeSinceLastReset)

        if (timeRemaining <= 0) {
          // Reset the rate limit
          setIsPasswordRateLimited(false)
          setPasswordClickCount(0)
          setPasswordLastResetTime(now)
          setRemainingTime(0)

          // Update storage
          inMemoryPasswordState.clickCount = 0
          inMemoryPasswordState.lastResetTime = now
          inMemoryPasswordState.isRateLimited = false
          updateAllStorageMechanisms(email, 0, now)

          if (timer) {
            clearInterval(timer)
            timer = null
          }
        } else {
          setRemainingTime(Math.ceil(timeRemaining / 1000))
        }
      }

      updateRemainingTime()
      timer = setInterval(updateRemainingTime, 1000)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [isPasswordRateLimited, passwordLastResetTime, email])

  const incrementPasswordClick = useCallback(() => {
    const newClickCount = passwordClickCount + 1
    const now = Date.now()

    setPasswordClickCount(newClickCount)
    setPasswordLastResetTime(now)

    // Update in-memory state
    inMemoryPasswordState.clickCount = newClickCount
    inMemoryPasswordState.lastResetTime = now

    if (newClickCount >= MAX_PASSWORD_CLICKS) {
      setIsPasswordRateLimited(true)
      inMemoryPasswordState.isRateLimited = true
    }

    // Update storage
    updateAllStorageMechanisms(email, newClickCount, now)
  }, [passwordClickCount, email])

  return {
    passwordModal,
    setPasswordModal,
    passwordClickCount,
    isPasswordRateLimited,
    remainingTime,
    formatRemainingTime,
    incrementPasswordClick,
  }
}
