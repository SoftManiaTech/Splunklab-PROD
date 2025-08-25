"use client"

import React from "react"
import { ChevronDown, ChevronUp, Loader2, Key, AlertCircle, RefreshCcw } from "lucide-react"
import type { EC2Instance } from "../types"

interface InstanceRowProps {
  instance: EC2Instance
  isSelected: boolean
  showExpiryColumn: boolean
  expandedCredentials: boolean
  expandedUsageRows: boolean
  disabledButtons: Record<string, boolean>
  loadingAction: string | null
  copiedField: string | null
  passwordModal: {
    loading: boolean
  }
  isPasswordRateLimited: boolean
  passwordClickCount: number
  remainingTime: number
  onInstanceSelection: (instanceId: string, checked: boolean) => void
  onToggleCredentials: (instanceId: string) => void
  onToggleUsageDetails: (instanceId: string) => void
  onAction: (action: string, instanceId: string, instanceName: string) => void
  onGetPassword: (instanceId: string) => void
  onExtendValidity: (instanceId: string, instanceName: string) => void
  renderCopyField: (text: string, fieldId: string, truncate?: boolean) => React.ReactNode
  renderButton: (label: string, action: string, instanceId: string, instanceName: string) => React.ReactNode
  getInstanceExpiryDate: (instanceId: string) => string
  getInstanceUsageDetails: (instanceId: string) => any
  getNotificationUrgency: (instanceId: string) => any
  getNotificationTooltip: (urgency: any) => string
  formatRemainingTime: (seconds: number) => string
  formatFloatHours: (hours: number) => string
  fetchUsageSummary: () => Promise<void>
  isRefreshingUsage: boolean
  MAX_PASSWORD_CLICKS: number
}

const InstanceRow: React.FC<InstanceRowProps> = ({
  instance,
  isSelected,
  showExpiryColumn,
  expandedCredentials,
  expandedUsageRows,
  disabledButtons,
  loadingAction,
  copiedField,
  passwordModal,
  isPasswordRateLimited,
  passwordClickCount,
  remainingTime,
  onInstanceSelection,
  onToggleCredentials,
  onToggleUsageDetails,
  onAction,
  onGetPassword,
  onExtendValidity,
  renderCopyField,
  renderButton,
  getInstanceExpiryDate,
  getInstanceUsageDetails,
  getNotificationUrgency,
  getNotificationTooltip,
  formatRemainingTime,
  formatFloatHours,
  fetchUsageSummary,
  isRefreshingUsage,
  MAX_PASSWORD_CLICKS,
}) => {
  const state = instance.State.toLowerCase()
  const isStopped = state === "stopped"
  const isRunning = state === "running"
  const isMutedState = ["pending", "starting"].includes(state)
  const isBusyState = ["pending", "starting", "stopping", "rebooting"].includes(state)
  const showToggle = ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(instance.Name)
  const isWindowsADDNS = instance.Name === "Windows(AD&DNS)"

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

  const actionStyles = {
    "get-password": {
      backgroundColor: "#3b82f6",
      color: "white",
    },
  }

  return (
    <React.Fragment key={instance.InstanceId}>
      <tr style={{ borderTop: "1px solid #e5e7eb" }}>
        <td style={{ padding: "10px" }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onInstanceSelection(instance.InstanceId, e.target.checked)
            }}
            className="rounded"
          />
        </td>
        <td style={{ padding: "10px" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span>{instance.Name}</span>
              {(() => {
                const urgency = getNotificationUrgency(instance.InstanceId)
                if (urgency) {
                  return (
                    <div
                      className={`relative w-2 h-2 rounded-full cursor-pointer animate-pulse ${
                        urgency.level === "high" ? "bg-red-500" : "bg-yellow-500"
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggleUsageDetails(instance.InstanceId)
                      }}
                      title={getNotificationTooltip(urgency)}
                    >
                      <div
                        className={`absolute inset-0 rounded-full animate-ping ${
                          urgency.level === "high" ? "bg-red-400" : "bg-yellow-400"
                        }`}
                      />
                    </div>
                  )
                }
                return null
              })()}
            </div>
            {showToggle && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleCredentials(instance.InstanceId)
                }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                title="Toggle Credentials"
              >
                {expandedCredentials ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </td>
        <td
          style={{
            padding: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {instance.State}
          {isBusyState && <Loader2 size={14} className="animate-spin text-gray-500" />}
        </td>
        <td style={{ padding: "10px" }}>
          {instance.PrivateIp ? renderCopyField(instance.PrivateIp, `${instance.InstanceId}_private`) : "-"}
        </td>
        <td style={{ padding: "10px" }}>
          {instance.PublicIp ? renderCopyField(instance.PublicIp, `${instance.InstanceId}_public`) : "-"}
        </td>
        <td style={{ padding: "10px" }}>
          {isWindowsADDNS
            ? "-"
            : instance.State === "running" && instance.PublicIp && instance.SSHCommand
              ? renderCopyField(instance.SSHCommand, `${instance.InstanceId}_ssh`, true) // Truncate SSH command
              : "-"}
        </td>
        {showExpiryColumn && (
          <td style={{ padding: "10px" }}>
            <div className="flex items-center gap-2">
              <span>{getInstanceExpiryDate(instance.InstanceId)}</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleUsageDetails(instance.InstanceId)
                }}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                title="Toggle Usage Details"
              >
                {expandedUsageRows ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </td>
        )}
        <td
          style={{
            padding: "10px",
            whiteSpace: "nowrap",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {!isMutedState && isStopped && renderButton("Start", "start", instance.InstanceId, instance.Name)}
          {!isMutedState && isRunning && (
            <>
              {renderButton("Stop", "stop", instance.InstanceId, instance.Name)}
              {renderButton("Reboot", "reboot", instance.InstanceId, instance.Name)}
            </>
          )}
          {isWindowsADDNS && instance.State === "running" && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onGetPassword(instance.InstanceId)
              }}
              style={{
                ...baseStyle,
                backgroundColor:
                  passwordModal.loading || isPasswordRateLimited
                    ? "#9ca3af"
                    : actionStyles["get-password"].backgroundColor,
                cursor: passwordModal.loading || isPasswordRateLimited ? "not-allowed" : "pointer",
                opacity: passwordModal.loading || isPasswordRateLimited ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                position: "relative",
                color: "#ffffff", 
              }}
              disabled={passwordModal.loading || isPasswordRateLimited}
              title={
                isPasswordRateLimited
                  ? "Wait until next 20 minutes slot"
                  : `${MAX_PASSWORD_CLICKS - passwordClickCount} clicks remaining in this 20-minute window`
              }
            >
              {passwordModal.loading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
              {isPasswordRateLimited ? formatRemainingTime(remainingTime) : "Get Password"}
              {!isPasswordRateLimited && (
                <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs font-bold rounded-full h-5 w-auto min-w-[20px] px-1 flex items-center justify-center">
                  {MAX_PASSWORD_CLICKS - passwordClickCount}/{MAX_PASSWORD_CLICKS}
                </span>
              )}
            </button>
          )}
        </td>
      </tr>
      {expandedCredentials && (
        <tr id={`details-${instance.InstanceId}`} className="bg-gray-50 dark:bg-gray-800">
          <td colSpan={showExpiryColumn ? 8 : 7} style={{ padding: "10px 10px 10px 20px" }}>
            <div className="text-xs text-gray-700 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
              {instance.Name === "MYSQL" && (
                <>
                  <span>
                    <strong>Root Password:</strong> Admin@123!
                  </span>
                  <span>
                    <strong>Splunk User:</strong> admin
                  </span>
                  <span>
                    <strong>Splunk Password:</strong> Admin@123!
                  </span>
                </>
              )}
              {instance.Name === "Jenkins" && (
                <>
                  <span>
                    <strong>Admin Username:</strong> admin
                  </span>
                  <span>
                    <strong>Admin Password:</strong> admin123
                  </span>
                </>
              )}
              {instance.Name === "MSSQL" && (
                <>
                  <span>
                    <strong>Root Password:</strong> Admin@123!
                  </span>
                  <span>
                    <strong>User Password:</strong> Admin@123!
                  </span>
                </>
              )}
              {instance.Name === "OSSEC" && (
                <>
                  <span>
                    <strong>Admin User:</strong> admin
                  </span>
                  <span>
                    <strong>Admin Password:</strong> admin123
                  </span>
                </>
              )}
              {instance.Name === "OpenVPN" && (
                <>
                  <span>
                    <strong>User:</strong> openvpn
                  </span>
                  <span>
                    <strong>Password:</strong> SoftMania@123
                  </span>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
      {expandedUsageRows &&
        (() => {
          const usageDetails = getInstanceUsageDetails(instance.InstanceId)
          return usageDetails ? (
            <tr className="bg-blue-50 dark:bg-blue-900/20">
              <td colSpan={showExpiryColumn ? 8 : 7} style={{ padding: "10px 10px 10px 20px" }}>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-blue-800">Usage Summary</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onExtendValidity(instance.InstanceId, instance.Name)
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white rounded-md transition-all duration-300 shadow-sm hover:shadow-md font-medium"
                        title="Extend Validity"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Extend Validity</span>
                        <span className="sm:hidden">Extend</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          fetchUsageSummary()
                        }}
                        disabled={isRefreshingUsage}
                        className={`p-1 rounded-full ${
                          isRefreshingUsage
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-amber-500 hover:bg-amber-600 text-gray-700"
                        } text-white`}
                        title="Refresh Usage"
                      >
                        <RefreshCcw className={`w-4 h-4 ${isRefreshingUsage ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>
                  {(usageDetails.balance_hours <= 0 || usageDetails.balance_days <= 0) && (
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-3 py-1 mb-2 text-sm">
                      ⚠️ <strong>Quota exhausted.</strong> Server will be terminated soon.
                    </div>
                  )}
                  <div
                    className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded px-3 py-2 text-sm ${
                      usageDetails.balance_hours <= 0 || usageDetails.balance_days <= 0
                        ? "bg-red-50 border border-red-200 text-red-800"
                        : "bg-green-50 border border-green-200 text-gray-800"
                    }`}
                  >
                    <span>
                      <strong>Quota:</strong> {formatFloatHours(usageDetails.quota_hours)} hrs
                    </span>
                    <span>
                      <strong>Used:</strong> {formatFloatHours(usageDetails.used_hours)} hrs
                    </span>
                    <span>
                      <strong>Left:</strong> {formatFloatHours(usageDetails.balance_hours)} hrs
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>
                      <strong>Valid:</strong> {usageDetails.quota_days} days
                    </span>
                    <span>
                      <strong>Start:</strong> {usageDetails.plan_start_date || "N/A"}
                    </span>
                    <span className="flex items-center gap-2">
                      <strong>End:</strong> {usageDetails.plan_end_date || "N/A"}
                      <span className="text-red-500">(terminate)</span>
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          ) : null
        })()}
    </React.Fragment>
  )
}

export default InstanceRow
