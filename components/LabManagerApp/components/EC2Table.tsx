"use client"

import React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import { Copy, Loader2, RefreshCcw, ChevronDown, ChevronUp, Key, X } from "lucide-react" // Import Key and X icon
import { logToSplunk } from "@/lib/splunklogger"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // Import Dialog components
import { Button } from "@/components/ui/button" // Import Button for the modal

interface EC2Instance {
  Name: string
  InstanceId: string
  State: string
  PrivateIp: string
  PublicIp: string
  SSHCommand: string
  Region: string
  ServiceType: string
}

interface EC2TableProps {
  email: string
  instances: EC2Instance[]
  setInstances: React.Dispatch<React.SetStateAction<EC2Instance[]>>
  loading: boolean // Keep loading prop, but its usage changes
}

const MAX_PASSWORD_CLICKS = 5 // Maximum clicks allowed
const PASSWORD_RESET_INTERVAL_MS = 20 * 60 * 1000 // 20 minutes in milliseconds

const EC2Table: React.FC<EC2TableProps> = ({ email, instances, setInstances, loading }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string

  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({}) // State to manage expanded rows

  // State for password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordDetails, setPasswordDetails] = useState<{
    username: string
    password: string
    publicIp?: string
  } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // New state for password rate limiting
  const [passwordClickCount, setPasswordClickCount] = useState(0)
  const [passwordLastResetTime, setPasswordLastResetTime] = useState<number>(Date.now())
  const [isPasswordRateLimited, setIsPasswordRateLimited] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0) // New state for remaining time

  // Helper function to format milliseconds into MM:SS
  const formatRemainingTime = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Effect to set initial expanded state for specific service types
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}
    instances.forEach((instance) => {
      if (["MYSQL", "Jenkins", "MSSQL", "OSSEC"].includes(instance.Name)) {
        initialExpandedState[instance.InstanceId] = true
      }
    })
    setExpandedRows(initialExpandedState)
  }, [instances]) // Re-run when instances change

  // Load password click state from localStorage on mount
  useEffect(() => {
    const storedCount = localStorage.getItem(`${email}-passwordClickCount`)
    const storedTime = localStorage.getItem(`${email}-passwordLastResetTime`)

    const now = Date.now()

    if (storedCount && storedTime) {
      const count = Number.parseInt(storedCount, 10)
      const time = Number.parseInt(storedTime, 10)

      if (now - time < PASSWORD_RESET_INTERVAL_MS) {
        // If within the 20-minute window, restore state
        setPasswordClickCount(count)
        setPasswordLastResetTime(time)
        if (count >= MAX_PASSWORD_CLICKS) {
          setIsPasswordRateLimited(true)
        }
        setRemainingTime(time + PASSWORD_RESET_INTERVAL_MS - now) // Calculate initial remaining time
      } else {
        // If 20 minutes have passed, reset
        localStorage.removeItem(`${email}-passwordClickCount`)
        localStorage.removeItem(`${email}-passwordLastResetTime`)
        setPasswordClickCount(0)
        setPasswordLastResetTime(now)
        setIsPasswordRateLimited(false)
        setRemainingTime(0) // No remaining time if reset
      }
    } else {
      // Initialize if no stored data
      setPasswordClickCount(0)
      setPasswordLastResetTime(now)
      setIsPasswordRateLimited(false)
      setRemainingTime(0)
    }
  }, [email]) // Re-run if email changes (different user)

  // Set up interval for automatic password click reset and remaining time update
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const resetTargetTime = passwordLastResetTime + PASSWORD_RESET_INTERVAL_MS
      const timeUntilReset = resetTargetTime - now

      if (timeUntilReset <= 0) {
        // Time to reset
        setPasswordClickCount(0)
        setPasswordLastResetTime(now)
        setIsPasswordRateLimited(false)
        setRemainingTime(0) // Reset remaining time
        localStorage.removeItem(`${email}-passwordClickCount`)
        localStorage.removeItem(`${email}-passwordLastResetTime`)
      } else {
        setRemainingTime(timeUntilReset)
        if (passwordClickCount >= MAX_PASSWORD_CLICKS && !isPasswordRateLimited) {
          setIsPasswordRateLimited(true)
        }
      }
    }

    // Call immediately on mount to set initial remaining time
    updateTimer()

    const interval = setInterval(updateTimer, 1000) // Check and update every second

    return () => clearInterval(interval)
  }, [passwordClickCount, passwordLastResetTime, isPasswordRateLimited, email])

  const isCooldown = (instanceId: string, action: string) => disabledButtons[`${instanceId}_${action}`]

  const handleButtonClick = async (action: string, instanceId: string) => {
    const key = `${instanceId}_${action}`
    setDisabledButtons((prev) => ({ ...prev, [key]: true }))
    setLoadingAction(key)

    await callAction(action, instanceId)

    setTimeout(() => {
      setDisabledButtons((prev) => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
      setLoadingAction(null)
    }, 5000)
  }

  const callAction = async (action: string, instanceId: string) => {
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

      const res = await axios.post(
        "/api/lab-proxy",
        {
          path: "/instances",
          method: "GET",
        },
        {
          headers: { "x-user-email": email },
        },
      )

      // ✅ Log to Splunk
      await logToSplunk({
        session: email,
        action: `lab_instance_${action}`,
        details: {
          instance_id: instanceId,
          instance_name: instance.Name,
          public_ip: instance.PublicIp || "N/A",
        },
      })

      await fetchInstances()
    } catch (error) {
      console.error(`Action ${action} failed:`, error)
    }
  }

  const fetchInstances = async () => {
    try {
      setRefreshing(true)
      const res = await axios.get(`${apiUrl}/instances`, {
        headers: { Authorization: `Bearer ${email}` },
      })
      setInstances(res.data)

      // ✅ Log refresh event
      await logToSplunk({
        session: email,
        action: "lab_instance_refresh",
        details: { total_instances: res.data.length },
      })
    } catch (error) {
      console.error("Error fetching instances:", error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // This useEffect previously contained the setInterval for auto-refresh.
    // It has been removed to stop automatic refreshing.
    // Instances will now only refresh on manual button click or initial load.
  }, [email]) // Removed `email` from dependency array as it's not used for interval anymore

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const renderCopyField = (text: string, fieldId: string) => (
    <div className="relative inline-flex items-center">
      <span className="mr-1.5">{text}</span>
      <div
        onClick={() => handleCopy(text, fieldId)}
        className="cursor-pointer p-0.5 rounded-md flex items-center justify-center bg-gray-100 border border-gray-200 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200"
      >
        <Copy size={14} className="text-gray-500" />
      </div>
      {copiedField === fieldId && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200">
          Copied!
        </div>
      )}
    </div>
  )

  const baseStyle: React.CSSProperties = {
    padding: "6px 14px",
    fontSize: "0.85rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "Inter, sans-serif",
    color: "white",
    whiteSpace: "nowrap",
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
    "get-password": {
      backgroundColor: "#3b82f6", // Blue color for get password
      hover: "#2563eb",
    },
  }

  const renderButton = (label: string, action: string, instanceId: string) => {
    const key = `${instanceId}_${action}`
    const disabled = isCooldown(instanceId, action)
    const isLoading = loadingAction === key

    return (
      <button
        onClick={() => handleButtonClick(action, instanceId)}
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

  // New function to handle Get Password button click
  const handleGetPassword = async (instanceId: string) => {
    if (isPasswordRateLimited) {
      // Optionally, show a toast or alert that the limit has been reached
      console.warn("Password retrieval limit reached. Please wait for the next 20-minute window.")
      return
    }

    // Increment count and update state/localStorage BEFORE the async operation
    const newCount = passwordClickCount + 1
    setPasswordClickCount(newCount)
    localStorage.setItem(`${email}-passwordClickCount`, newCount.toString())
    localStorage.setItem(`${email}-passwordLastResetTime`, passwordLastResetTime.toString()) // Keep the same reset time for this window

    if (newCount >= MAX_PASSWORD_CLICKS) {
      setIsPasswordRateLimited(true)
    }

    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordDetails(null)
    setShowPasswordModal(true)

    const instance = instances.find((inst) => inst.InstanceId === instanceId)
    if (!instance) return

    try {
      const response = await axios.post(
        "/api/win-pass", // New API route
        {
          instance_id: instanceId,
          email: email, // Pass the user's email
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )

      if (response.data.status === "success" && response.data.decrypted_password) {
        setPasswordDetails({
          username: "Administrator",
          password: response.data.decrypted_password,
          publicIp: instance.PublicIp, // Add public IP here
        })
        await logToSplunk({
          session: email,
          action: "get_windows_password",
          details: {
            instance_id: instanceId,
            instance_name: "Windows(AD&DNS)",
            status: "success",
          },
        })
      } else {
        setPasswordError(response.data.message || "Failed to retrieve password.")
        await logToSplunk({
          session: email,
          action: "get_windows_password",
          details: {
            instance_id: instanceId,
            instance_name: "Windows(AD&DNS)",
            status: "failed",
            error: response.data.message || "Unknown error",
          },
        })
      }
    } catch (error) {
      console.error("Error fetching Windows password:", error)
      setPasswordError("An error occurred while fetching the password. Please try again.")
      await logToSplunk({
        session: email,
        action: "get_windows_password",
        details: {
          instance_id: instanceId,
          instance_name: "Windows(AD&DNS)",
          status: "failed",
          error: (error as Error).message || "Network error",
        },
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const toggleRowExpansion = (instanceId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }))
  }

  const groupedInstances = instances.reduce<Record<string, EC2Instance[]>>((acc, inst) => {
    const key = inst.ServiceType || "Unknown"
    if (!acc[key]) acc[key] = []
    acc[key].push(inst)
    return acc
  }, {})

  // Order the service types: Splunk first, then others
  const orderedServiceTypes = Object.keys(groupedInstances).sort((a, b) => {
    if (a === "Splunk") return -1 // Splunk comes first
    if (b === "Splunk") return 1 // Splunk comes first
    return 0 // Maintain original order for others
  })

  return (
    <div style={{ marginTop: 20 }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800"></h2>
        <button
          onClick={fetchInstances}
          disabled={refreshing}
          className={`p-2 rounded-full ${
            refreshing ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-gray-700"
          } text-white`}
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 🔽 Split by ServiceType */}
      {orderedServiceTypes.map((serviceType) => (
        <div key={serviceType} style={{ marginBottom: 40 }}>
          <h3 className="text-md font-semibold text-green-600 mb-2">
            {serviceType} Servers
            {serviceType === "Splunk" && (
              <span className="text-gray-500 text-sm font-normal ml-2">(username: admin, password: admin123)</span>
            )}
          </h3>

          <div
            style={{
              overflowX: "auto",
              width: "100%",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 800,
                fontSize: "0.95rem",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Server Name</th>
                  <th style={{ padding: "10px" }}>State</th>
                  <th style={{ padding: "10px" }}>Private IP</th>
                  <th style={{ padding: "10px" }}>Public IP</th>
                  <th style={{ padding: "10px" }}>SSH Command</th>
                  <th style={{ padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedInstances[serviceType].map((inst) => {
                  const state = inst.State.toLowerCase()
                  const isStopped = state === "stopped"
                  const isRunning = state === "running"
                  const isMutedState = ["pending", "starting"].includes(state)
                  const isBusyState = ["pending", "starting", "stopping", "rebooting"].includes(state)
                  const isExpanded = expandedRows[inst.InstanceId]
                  const showToggle = ["MYSQL", "Jenkins", "MSSQL", "OSSEC"].includes(inst.Name) // Show toggle for these names
                  const isWindowsADDNS = inst.Name === "Windows(AD&DNS)"

                  return (
                    <React.Fragment key={inst.InstanceId}>
                      <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "10px" }}>
                          <div className="flex items-center gap-2">
                            <span>{inst.Name}</span>
                            {showToggle && (
                              <button
                                onClick={() => toggleRowExpansion(inst.InstanceId)}
                                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                aria-expanded={isExpanded}
                                aria-controls={`details-${inst.InstanceId}`}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                          {inst.State}
                          {isBusyState && <Loader2 size={14} className="animate-spin text-gray-500" />}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {inst.PrivateIp ? renderCopyField(inst.PrivateIp, `${inst.InstanceId}_private`) : "-"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {inst.PublicIp ? renderCopyField(inst.PublicIp, `${inst.InstanceId}_public`) : "-"}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {isWindowsADDNS
                            ? "-"
                            : inst.State === "running" && inst.PublicIp && inst.SSHCommand
                              ? renderCopyField(inst.SSHCommand, `${inst.InstanceId}_ssh`)
                              : "-"}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            whiteSpace: "nowrap",
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {!isMutedState && isStopped && renderButton("Start", "start", inst.InstanceId)}
                          {!isMutedState && isRunning && (
                            <>
                              {renderButton("Stop", "stop", inst.InstanceId)}
                              {renderButton("Reboot", "reboot", inst.InstanceId)}
                            </>
                          )}
                          {isWindowsADDNS && inst.State === "running" && (
                            <button
                              onClick={() => handleGetPassword(inst.InstanceId)}
                              style={{
                                ...baseStyle,
                                backgroundColor:
                                  passwordLoading || isPasswordRateLimited
                                    ? "#9ca3af"
                                    : actionStyles["get-password"].backgroundColor,
                                cursor: passwordLoading || isPasswordRateLimited ? "not-allowed" : "pointer",
                                opacity: passwordLoading || isPasswordRateLimited ? 0.6 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                position: "relative", // For positioning the counter
                              }}
                              disabled={passwordLoading || isPasswordRateLimited}
                              title={
                                isPasswordRateLimited ? `Try again in ${formatRemainingTime(remainingTime)}` : undefined
                              }
                            >
                              {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                              {isPasswordRateLimited ? formatRemainingTime(remainingTime) : "Get Password"}
                              <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs font-bold rounded-full h-5 w-auto min-w-[20px] px-1 flex items-center justify-center">
                                {MAX_PASSWORD_CLICKS - passwordClickCount}/{MAX_PASSWORD_CLICKS}
                              </span>
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr id={`details-${inst.InstanceId}`} className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={6} style={{ padding: "10px 10px 10px 20px" }}>
                            <div className="text-xs text-gray-700 dark:text-gray-300 flex flex-wrap gap-x-4 gap-y-1">
                              {inst.Name === "MYSQL" && (
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
                              {inst.Name === "Jenkins" && (
                                <>
                                  <span>
                                    <strong>Admin Username:</strong> admin
                                  </span>
                                  <span>
                                    <strong>Admin Password:</strong> admin123
                                  </span>
                                </>
                              )}
                              {inst.Name === "MSSQL" && (
                                <>
                                  <span>
                                    <strong>Root Password:</strong> Admin@123!
                                  </span>
                                  <span>
                                    <strong>User Password:</strong> Admin@123!
                                  </span>
                                </>
                              )}
                              {inst.Name === "OSSEC" && (
                                <>
                                  <span>
                                    <strong>Admin User:</strong> admin
                                  </span>
                                  <span>
                                    <strong>Admin Password:</strong> admin123
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Password Display Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="relative bg-green-50 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl">
            <div className="text-center pr-12">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Windows Server Credentials
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Use these credentials to connect to your Windows server.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div
            data-modal-content
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6"
            onWheel={(e) => {
              e.stopPropagation()
            }}
          >
            {passwordLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Fetching password...</span>
              </div>
            ) : passwordError ? (
              <div className="text-red-500 text-center py-4">{passwordError}</div>
            ) : passwordDetails ? (
              <div className="space-y-4">
                {passwordDetails.publicIp && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-0">Public IP:</span>
                    <div className="flex items-center gap-2 flex-wrap justify-end sm:justify-start">
                      <span className="font-semibold text-gray-800 dark:text-white text-base break-all">
                        {passwordDetails.publicIp}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(passwordDetails.publicIp ?? "", "win-public-ip")}
                        className="relative h-7 w-7 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedField === "win-public-ip" && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200">
                            Copied!
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-0">Username:</span>
                  <div className="flex items-center gap-2 flex-wrap justify-end sm:justify-start">
                    <span className="font-semibold text-gray-800 dark:text-white text-base break-all">
                      {passwordDetails.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(passwordDetails.username, "win-username")}
                      className="relative h-7 w-7 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedField === "win-username" && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200">
                          Copied!
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-start bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Password:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 dark:text-white text-base break-all">
                      {passwordDetails.password}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(passwordDetails.password, "win-password")}
                      className="relative h-7 w-7 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedField === "win-password" && (
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 duration-200">
                          Copied!
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4">No password details available.</div>
            )}
          </div>
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-6 rounded-b-2xl">
            <div className="flex justify-center">
              <Button
                onClick={() => setShowPasswordModal(false)}
                className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EC2Table
