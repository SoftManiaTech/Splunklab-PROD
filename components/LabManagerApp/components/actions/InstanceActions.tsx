"use client"

import type React from "react"
import { Loader2 } from "lucide-react"

interface InstanceActionsProps {
  instanceId: string
  instanceName: string
  state: string
  disabledButtons: Record<string, boolean>
  loadingAction: string | null
  cooldowns: Record<string, number>
  frozenClusterRemainingTimes: Record<string, number>
  isInstanceFrozen: (instanceId: string) => boolean
  onButtonClick: (action: string, instanceId: string) => Promise<void>
  formatRemainingTime: (seconds: number) => string
}

const InstanceActions: React.FC<InstanceActionsProps> = ({
  instanceId,
  instanceName,
  state,
  disabledButtons,
  loadingAction,
  cooldowns,
  frozenClusterRemainingTimes,
  isInstanceFrozen,
  onButtonClick,
  formatRemainingTime,
}) => {
  const baseStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  }

  const actionStyles: Record<string, { backgroundColor: string; hover: string }> = {
    start: {
      backgroundColor: "#10b981",
      hover: "#059669",
    },
    stop: {
      backgroundColor: "#ef4444",
      hover: "#dc2626",
    },
    reboot: {
      backgroundColor: "#f59e0b",
      hover: "#d97706",
    },
  }

  const isCooldown = (instanceId: string, action: string) =>
    disabledButtons[`${instanceId}_${action}`] || isInstanceFrozen(instanceId)

  const getButtonTooltip = (action: string, instanceId: string, instanceName: string) => {
    const isFrozen = isInstanceFrozen(instanceId)

    if (isFrozen) {
      return `Cluster configuration in progress. Please wait until the runtime is complete.`
    }

    const disabled = isCooldown(instanceId, action)
    if (disabled) {
      const cooldownKey = `${instanceId}_${action}`
      const remainingTime = cooldowns[cooldownKey] || 0
      return `Please wait ${remainingTime}s before ${action}ing again`
    }

    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${instanceName || instanceId}`
  }

  const renderButton = (label: string, action: string, instanceId: string, instanceName = "") => {
    const key = `${instanceId}_${action}`
    const disabled = isCooldown(instanceId, action)
    const isLoading = loadingAction === key
    const isFrozen = isInstanceFrozen(instanceId)

    const isButtonDisabled = disabled || isFrozen

    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isFrozen && !disabled) {
            onButtonClick(action, instanceId)
          }
        }}
        style={{
          ...baseStyle,
          backgroundColor: isButtonDisabled ? "#9ca3af" : actionStyles[action].backgroundColor,
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.6 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
        disabled={isButtonDisabled}
        title={getButtonTooltip(action, instanceId, instanceName)}
        onMouseEnter={(e) => {
          if (!isButtonDisabled) {
            ;(e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].hover
          }
        }}
        onMouseLeave={(e) => {
          if (!isButtonDisabled) {
            ;(e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].backgroundColor
          }
        }}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isFrozen ? (
          formatRemainingTime(frozenClusterRemainingTimes[instanceId] || 0)
        ) : (
          label
        )}
      </button>
    )
  }

  const stateLower = state.toLowerCase()
  const isStopped = stateLower === "stopped"
  const isRunning = stateLower === "running"
  const isMutedState = ["pending", "starting"].includes(stateLower)

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {!isMutedState && isStopped && renderButton("Start", "start", instanceId, instanceName)}
      {!isMutedState && isRunning && (
        <>
          {renderButton("Stop", "stop", instanceId, instanceName)}
          {renderButton("Reboot", "reboot", instanceId, instanceName)}
        </>
      )}
    </div>
  )
}

export default InstanceActions
