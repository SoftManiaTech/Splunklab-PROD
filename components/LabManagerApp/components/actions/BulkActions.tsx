"use client"

import type React from "react"
import { Loader2 } from "lucide-react"
import type { EC2Instance } from "../types"

interface BulkActionsProps {
  selectedInstances: Set<string>
  selectedInstanceDetails: EC2Instance[]
  bulkActionLoading: string | null
  allSelectedStopped: boolean
  allSelectedRunning: boolean
  hasMixedStates: boolean
  isInstanceFrozen: (instanceId: string) => boolean
  onBulkAction: (action: string) => Promise<void>
  onKeepOnlyRunning: () => void
  onKeepOnlyStopped: () => void
  getBulkButtonTooltip: (action: string) => string
  onClearSelection: () => void
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedInstances,
  selectedInstanceDetails,
  bulkActionLoading,
  allSelectedStopped,
  allSelectedRunning,
  hasMixedStates,
  isInstanceFrozen,
  onBulkAction,
  onKeepOnlyRunning,
  onKeepOnlyStopped,
  getBulkButtonTooltip,
  onClearSelection,
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

  const renderBulkButton = (label: string, action: string) => {
    const isLoading = bulkActionLoading === action
    const frozenSelected = Array.from(selectedInstances).filter((id) => isInstanceFrozen(id))
    const disabled = selectedInstances.size === 0 || isLoading || frozenSelected.length > 0

    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (frozenSelected.length === 0) {
            onBulkAction(action)
          }
        }}
        style={{
          ...baseStyle,
          backgroundColor: disabled ? "#9ca3af" : actionStyles[action].backgroundColor,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
        disabled={disabled}
        title={getBulkButtonTooltip(action)}
        onMouseEnter={(e) => {
          if (!disabled) {
            ;(e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].hover
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            ;(e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].backgroundColor
          }
        }}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : label}
      </button>
    )
  }

  if (selectedInstances.size === 0) return null

  return (
    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-blue-800">
          {selectedInstances.size} server
          {selectedInstances.size > 1 ? "s" : ""} selected:
        </span>
        {allSelectedStopped && renderBulkButton("Start", "start")}
        {allSelectedRunning && (
          <>
            {renderBulkButton("Stop", "stop")}
            {renderBulkButton("Reboot", "reboot")}
          </>
        )}
        {hasMixedStates && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onKeepOnlyRunning()
              }}
              className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
              title="Keep only running servers selected"
            >
              Keep Running
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onKeepOnlyStopped()
              }}
              className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
              title="Keep only stopped servers selected"
            >
              Keep Stopped
            </button>
          </>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClearSelection()
          }}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          title="Clear selection"
        >
          Clear
        </button>
      </div>
      <div className="mt-2 text-xs text-blue-700">
        <strong>Selected:</strong> {selectedInstanceDetails.map((inst) => inst.Name).join(", ")}
      </div>
    </div>
  )
}

export default BulkActions
