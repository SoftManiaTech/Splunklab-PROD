"use client"

import { useState, useCallback } from "react"
import axios from "axios"
import type { EC2Instance } from "../types"

export const useInstanceActions = (
  email: string,
  instances: EC2Instance[],
  fetchInstances: () => Promise<void>,
  isInstanceFrozen: (instanceId: string) => boolean,
) => {
  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({})
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})

  const callAction = useCallback(
    async (action: string, instanceId: string) => {
      const instance = instances.find((inst) => inst.InstanceId === instanceId)
      if (!instance) return

      try {
        await axios.post(
          "/api/lab-proxy",
          {
            path: `/${action}`,
            method: "POST",
            body: {
              instance_id: instanceId,
              region: instance.Region,
            },
          },
          {
            headers: { "x-user-email": email },
          },
        )
      } catch (error) {
        console.error(`Action ${action} failed:`, error)
      }
    },
    [email, instances],
  )

  const handleButtonClick = useCallback(
    async (action: string, instanceId: string) => {
      if (isInstanceFrozen(instanceId)) return

      const key = `${instanceId}_${action}`
      setDisabledButtons((prev) => ({ ...prev, [key]: true }))
      setLoadingAction(key)

      await callAction(action, instanceId)

      // Set cooldown timer
      const cooldownDuration = 5 // seconds
      setCooldowns((prev) => ({ ...prev, [key]: cooldownDuration }))

      // Update cooldown timer every second
      const intervalId = setInterval(() => {
        setCooldowns((prev) => {
          const updatedCooldowns = { ...prev }
          if (updatedCooldowns[key] > 0) {
            updatedCooldowns[key] -= 1
            return updatedCooldowns
          } else {
            clearInterval(intervalId)
            delete updatedCooldowns[key]
            return updatedCooldowns
          }
        })
      }, 1000)

      setTimeout(() => {
        setDisabledButtons((prev) => {
          const newState = { ...prev }
          delete newState[key]
          return newState
        })
        setLoadingAction(null)
      }, cooldownDuration * 1000)
    },
    [callAction, isInstanceFrozen],
  )

  const handleBulkAction = useCallback(
    async (action: string, selectedInstances: Set<string>) => {
      if (selectedInstances.size === 0) return

      // Check if any selected instances are frozen
      const frozenSelected = Array.from(selectedInstances).filter((id) => isInstanceFrozen(id))
      if (frozenSelected.length > 0) return

      setBulkActionLoading(action)
      const promises = Array.from(selectedInstances).map((instanceId) => callAction(action, instanceId))

      try {
        await Promise.all(promises)
        await fetchInstances()
      } catch (error) {
        console.error(`Bulk ${action} failed:`, error)
      } finally {
        setBulkActionLoading(null)
      }
    },
    [callAction, fetchInstances, isInstanceFrozen],
  )

  return {
    disabledButtons,
    loadingAction,
    bulkActionLoading,
    cooldowns,
    handleButtonClick,
    handleBulkAction,
    callAction,
  }
}
