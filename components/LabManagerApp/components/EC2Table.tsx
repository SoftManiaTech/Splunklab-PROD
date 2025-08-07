"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { Copy, Loader2, RefreshCcw, ChevronDown, ChevronUp, Key, X, Eye, EyeOff } from 'lucide-react' // Import Eye icons
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
  loading: boolean
  rawUsageSummary: any[] // Add this prop
  fetchUsageSummary: () => Promise<void> // New prop for refreshing usage
  isRefreshingUsage: boolean // New prop for usage refresh loading state
  hasLab: boolean
  onPasswordModalOpenChange?: (isOpen: boolean) => void // New prop
}

const MAX_PASSWORD_CLICKS = 5 // Maximum clicks allowed
const PASSWORD_RESET_INTERVAL_MS = 20 * 60 * 1000 // 20 minutes in milliseconds

const EC2Table: React.FC<EC2TableProps> = ({ email, instances, setInstances, loading, rawUsageSummary, fetchUsageSummary, isRefreshingUsage, hasLab, onPasswordModalOpenChange }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string

  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false) // This is for instance list refresh
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({}) // State to manage expanded rows
  const [showExpiryColumn, setShowExpiryColumn] = useState<Record<string, boolean>>({}) // State for expiry column visibility
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set()) // State for bulk selection - FIX APPLIED HERE
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null) // State for bulk action loading
  const [expandedUsageRows, setExpandedUsageRows] = useState<Record<string, boolean>>({})
  const [expandedCredentials, setExpandedCredentials] = useState<Record<string, boolean>>({})

  // State for password modal - consolidated and stabilized
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    loading: false,
    error: null as string | null,
    details: null as {
      username: string
      password: string
      publicIp?: string
    } | null
  })

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

  // Function to get expiry date for an instance
  const getInstanceExpiryDate = (instanceId: string): string => {
    for (const summary of rawUsageSummary) {
      if (summary.InstanceIds && summary.InstanceIds.includes(instanceId)) {
        return summary.PlanEndDate || "N/A"
      }
    }
    return "N/A"
  }

  // Function to get usage details for an instance
  const getInstanceUsageDetails = (instanceId: string) => {
    for (const summary of rawUsageSummary) {
      if (summary.InstanceIds && summary.InstanceIds.includes(instanceId)) {
        return {
          quota_hours: summary.QuotaHours || 0,
          used_hours: summary.ConsumedHours || 0,
          balance_hours: summary.BalanceHours || 0,
          quota_days: summary.QuotaExpiryDays || 0,
          used_days: summary.ConsumedDays || 0,
          balance_days: summary.BalanceDays || 0,
          plan_start_date: summary.PlanStartDate || "",
          plan_end_date: summary.PlanEndDate || "",
        }
      }
    }
    return null
  }

  // Function to toggle usage details expansion
  const toggleUsageDetails = useCallback((instanceId: string) => {
    setExpandedUsageRows((prev) => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }))
  }, [])

  // Effect to manage expanded states (credentials, usage, and general row expansion)
  useEffect(() => {
    setExpandedRows(prevExpandedRows => {
      const newExpandedRows = { ...prevExpandedRows };
      const currentInstanceIds = new Set(instances.map(inst => inst.InstanceId));

      // Remove instances that no longer exist
      for (const instanceId in newExpandedRows) {
        if (!currentInstanceIds.has(instanceId)) {
          delete newExpandedRows[instanceId];
        }
      }

      // Add/update default expanded state for current instances
      instances.forEach((instance) => {
        const shouldBeExpandedByDefault = 
          (instance.ServiceType === "DataSources" && ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(instance.Name)) ||
          (instance.ServiceType !== "DataSources" && ["MYSQL", "Jenkins", "MSSQL", "OSSEC"].includes(instance.Name));
        
        // If it should be expanded by default AND it's not already explicitly collapsed by the user
        if (shouldBeExpandedByDefault && newExpandedRows[instance.InstanceId] !== false) {
          newExpandedRows[instance.InstanceId] = true;
        }
      });
      return newExpandedRows;
    });

    setExpandedCredentials(prevExpandedCredentials => {
      const newExpandedCredentials = { ...prevExpandedCredentials };
      const currentInstanceIds = new Set(instances.map(inst => inst.InstanceId));

      // Remove instances that no longer exist
      for (const instanceId in newExpandedCredentials) {
        if (!currentInstanceIds.has(instanceId)) {
          delete newExpandedCredentials[instanceId];
        }
      }

      // Add/update default expanded state for current instances
      instances.forEach((instance) => {
        const shouldBeExpandedByDefault = 
          (instance.ServiceType === "DataSources" && ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(instance.Name)) ||
          (instance.ServiceType !== "DataSources" && ["MYSQL", "Jenkins", "MSSQL", "OSSEC"].includes(instance.Name));
        
        // If it should be expanded by default AND it's not already explicitly collapsed by the user
        if (shouldBeExpandedByDefault && newExpandedCredentials[instance.InstanceId] !== false) {
          newExpandedCredentials[instance.InstanceId] = true;
        }
      });
      return newExpandedCredentials;
    });

    setExpandedUsageRows(prevExpandedUsageRows => {
      const newExpandedUsageRows = { ...prevExpandedUsageRows };
      const currentInstanceIds = new Set(instances.map(inst => inst.InstanceId));

      // Remove instances that no longer exist
      for (const instanceId in newExpandedUsageRows) {
        if (!currentInstanceIds.has(instanceId)) {
          delete newExpandedUsageRows[instanceId];
        }
      }
      // For usage, there's no "default expanded" based on instance type,
      // so we just ensure existing states are preserved and old ones removed.
      // If a new instance appears, its usage details will be collapsed by default (undefined/false).
      return newExpandedUsageRows;
    });

  }, [instances]); // Keep instances as a dependency, but handle state updates functionally.


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
        setRemainingTime(0) // Reset remaining time
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

  // Bulk action handler
  const handleBulkAction = async (action: string) => {
    if (selectedInstances.size === 0) return

    setBulkActionLoading(action)
    const promises = Array.from(selectedInstances).map(instanceId => callAction(action, instanceId))
    
    try {
      await Promise.all(promises)
      // After all actions are done, refresh the instances list
      await fetchInstances()
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
    } finally {
      setBulkActionLoading(null)
      setSelectedInstances(new Set()) // Clear selection after bulk action
    }
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

      // No need to fetch instances here, it's done after all bulk actions or after single action
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
    let interval: NodeJS.Timeout

    // Only start auto-refresh if user has email, lab access, AND there are instances
    if (email && hasLab && instances.length > 0) {
      interval = setInterval(() => {
        fetchInstances()
      }, 3000)
    }

    // Cleanup interval when dependencies change or component unmounts
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [email, hasLab, instances.length]) // Added instances.length as dependency

  const handleCopy = useCallback((text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  const renderCopyField = (text: string, fieldId: string, truncate?: boolean) => {
    const displayText = truncate && text.length > 25 ? text.substring(0, 25) + "..." : text; // Changed to 25
    return (
      <div className="relative inline-flex items-center">
        <span className="mr-1.5">{displayText}</span>
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopy(text, fieldId)
          }} // Always copy the full text
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
  }

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
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleButtonClick(action, instanceId)
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

  // Bulk action button renderer
  const renderBulkButton = (label: string, action: string) => {
    const isLoading = bulkActionLoading === action
    const disabled = selectedInstances.size === 0 || isLoading

    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleBulkAction(action)
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
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : `${label} Selected (${selectedInstances.size})`}
      </button>
    )
  }

  // Stabilized function to handle Get Password button click
  const handleGetPassword = useCallback(async (instanceId: string) => {
    if (isPasswordRateLimited) {
      console.warn("Password retrieval limit reached. Please wait for the next 20-minute window.")
      return
    }

    // Prevent multiple simultaneous requests
    if (passwordModal.loading) {
      return
    }

    // Increment count and update state/localStorage BEFORE the async operation
    const newCount = passwordClickCount + 1
    setPasswordClickCount(newCount)
    localStorage.setItem(`${email}-passwordClickCount`, newCount.toString())
    localStorage.setItem(`${email}-passwordLastResetTime`, passwordLastResetTime.toString())

    if (newCount >= MAX_PASSWORD_CLICKS) {
      setIsPasswordRateLimited(true)
    }

    // Set modal state in one update to prevent flickering
    setPasswordModal(prev => ({
      ...prev,
      isOpen: true,
      loading: true,
      error: null,
      details: null
    }))
    onPasswordModalOpenChange?.(true) // Notify parent that modal is open

    const instance = instances.find((inst) => inst.InstanceId === instanceId)
    if (!instance) {
      setPasswordModal(prev => ({
        ...prev,
        loading: false,
        error: "Instance not found"
      }))
      return
    }

    try {
      const response = await axios.post(
        "/api/win-pass",
        {
          instance_id: instanceId,
          email: email,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      )

      if (response.data.status === "success" && response.data.decrypted_password) {
        setPasswordModal(prev => ({
          ...prev,
          loading: false,
          error: null,
          details: {
            username: "Administrator",
            password: response.data.decrypted_password,
            publicIp: instance.PublicIp,
          }
        }))

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
        setPasswordModal(prev => ({
          ...prev,
          loading: false,
          error: response.data.message || "Failed to retrieve password.",
          details: null
        }))

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
      setPasswordModal(prev => ({
        ...prev,
        loading: false,
        error: "An error occurred while fetching the password. Please try again.",
        details: null
      }))

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
    }
  }, [isPasswordRateLimited, passwordModal.loading, passwordClickCount, passwordLastResetTime, email, instances, onPasswordModalOpenChange])

  // Stabilized modal close handler
  const handleClosePasswordModal = useCallback(() => {
    setPasswordModal(prev => ({
      ...prev,
      isOpen: false,
      loading: false,
      error: null,
      details: null
    }))
    onPasswordModalOpenChange?.(false) // Notify parent that modal is closed
  }, [onPasswordModalOpenChange])

  const toggleRowExpansion = useCallback((instanceId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }))
  }, [])

  const toggleExpiryColumn = useCallback((serviceType: string) => {
    setShowExpiryColumn((prev) => ({
      ...prev,
      [serviceType]: !prev[serviceType],
    }))
  }, [])

  // Handle individual instance selection
  const handleInstanceSelection = useCallback((instanceId: string, checked: boolean) => {
    setSelectedInstances(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(instanceId)
      } else {
        newSet.delete(instanceId)
      }
      return newSet
    })
  }, [])

  // Handle select all for a service type
  const handleSelectAllForServiceType = useCallback((serviceType: string, checked: boolean) => {
    const serviceInstances = groupedInstances[serviceType]
    setSelectedInstances(prev => {
      const newSet = new Set(prev)
      serviceInstances.forEach(instance => {
        if (checked) {
          newSet.add(instance.InstanceId)
        } else {
          newSet.delete(instance.InstanceId)
        }
      })
      return newSet
    })
  }, [instances]) // Only depend on instances, not groupedInstances to avoid recreating

  const handleKeepOnlyRunning = useCallback(() => {
    setSelectedInstances(prev => {
      const newSet = new Set<string>();
      Array.from(prev).forEach(instanceId => {
        const instance = instances.find(inst => inst.InstanceId === instanceId);
        if (instance && instance.State === "running") {
          newSet.add(instanceId);
        }
      });
      return newSet;
    });
  }, [instances]);

  const handleKeepOnlyStopped = useCallback(() => {
    setSelectedInstances(prev => {
      const newSet = new Set<string>();
      Array.from(prev).forEach(instanceId => {
        const instance = instances.find(inst => inst.InstanceId === instanceId);
        if (instance && instance.State === "stopped") {
          newSet.add(instanceId);
        }
      });
      return newSet;
    });
  }, [instances]);

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

  // Determine the state of selected instances for conditional bulk actions
  const selectedInstanceDetails = Array.from(selectedInstances).map(id => instances.find(inst => inst.InstanceId === id)).filter(Boolean) as EC2Instance[];
  
  const allSelectedStopped = selectedInstanceDetails.length > 0 && selectedInstanceDetails.every(inst => inst.State === "stopped");
  const allSelectedRunning = selectedInstanceDetails.length > 0 && selectedInstanceDetails.every(inst => inst.State === "running");
  const hasMixedStates = selectedInstances.size > 0 && (!allSelectedStopped && !allSelectedRunning);


  const formatFloatHours = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const toggleCredentialExpansion = useCallback((instanceId: string) => {
    setExpandedCredentials((prev) => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }))
  }, [])

  return (
    <div style={{ marginTop: 20 }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800"></h2>
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            fetchInstances()
          }}
          disabled={refreshing}
          className={`p-2 rounded-full ${
            refreshing ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-gray-700"
          } text-white`}
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Show "No Servers" message when instances array is empty */}
      {instances.length === 0 && !loading ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">You don't have any servers here.</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                It looks like you don't have a lab assigned yet. Choose a plan to get started with your personalized lab setup.
              </p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = "/"
              }}
              className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Choose Lab Plan
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {selectedInstances.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-blue-800">
                  {selectedInstances.size} server{selectedInstances.size > 1 ? 's' : ''} selected:
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
                        handleKeepOnlyRunning()
                      }}
                      className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Keep only Running
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleKeepOnlyStopped()
                      }}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      Keep only Stopped
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedInstances(new Set())
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* 🔽 Split by ServiceType */}
          {orderedServiceTypes.map((serviceType) => {
            const serviceInstances = groupedInstances[serviceType]
            const selectedInService = serviceInstances.filter(inst => selectedInstances.has(inst.InstanceId)).length
            const allSelectedInService = selectedInService === serviceInstances.length
            const someSelectedInService = selectedInService > 0 && selectedInService < serviceInstances.length

            // Determine if all usage rows for this service type are expanded
            const allUsageRowsExpanded = serviceInstances.every(inst => expandedUsageRows[inst.InstanceId]);

            return (
              <div key={serviceType} style={{ marginBottom: 40 }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold text-green-600">
                    {serviceType} Servers
                    {serviceType === "Splunk" && (
                      <span className="text-gray-500 text-sm font-normal ml-2">(username: admin, password: admin123)</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleExpiryColumn(serviceType)
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title={`${showExpiryColumn[serviceType] ? 'Hide' : 'Show'} Expiry`}
                    >
                      {showExpiryColumn[serviceType] ? <EyeOff size={16} /> : <Eye size={16} />}
                      Expiry
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const newState = !allUsageRowsExpanded; // Toggle based on current state of all
                        serviceInstances.forEach(inst => {
                          setExpandedUsageRows(prev => ({
                            ...prev,
                            [inst.InstanceId]: newState
                          }))
                        })
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                      title="Toggle Usage Details"
                    >
                      {allUsageRowsExpanded ? (
                        <EyeOff size={16} className="transition-transform duration-300" />
                      ) : (
                        <Eye size={16} className="transition-transform duration-300" />
                      )}
                      More Details
                    </button>
                  </div>
                </div>

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
                      minWidth: showExpiryColumn[serviceType] ? 900 : 800,
                      fontSize: "0.95rem",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
                        <th style={{ padding: "10px", width: "40px" }}>
                          <input
                            type="checkbox"
                            checked={allSelectedInService}
                            ref={input => {
                              if (input) input.indeterminate = someSelectedInService
                            }}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleSelectAllForServiceType(serviceType, e.target.checked)
                            }}
                            className="rounded"
                          />
                        </th>
                        <th style={{ padding: "10px" }}>Server Name</th>
                        <th style={{ padding: "10px" }}>State</th>
                        <th style={{ padding: "10px" }}>Private IP</th>
                        <th style={{ padding: "10px" }}>Public IP</th>
                        <th style={{ padding: "10px" }}>SSH Command</th>
                        {showExpiryColumn[serviceType] && (
                          <th style={{ padding: "10px" }}>Expiry</th>
                        )}
                        <th style={{ padding: "10px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceInstances.map((inst) => {
                        const state = inst.State.toLowerCase()
                        const isStopped = state === "stopped"
                        const isRunning = state === "running"
                        const isMutedState = ["pending", "starting"].includes(state)
                        const isBusyState = ["pending", "starting", "stopping", "rebooting"].includes(state)
                        const showToggle = ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(inst.Name) // Show toggle for these names
                        const isWindowsADDNS = inst.Name === "Windows(AD&DNS)"
                        const isSelected = selectedInstances.has(inst.InstanceId)

                        return (
                          <React.Fragment key={inst.InstanceId}>
                            <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                              <td style={{ padding: "10px" }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleInstanceSelection(inst.InstanceId, e.target.checked)
                                  }}
                                  className="rounded"
                                />
                              </td>
                              <td style={{ padding: "10px" }}>
                                <div className="flex items-center gap-2">
                                  <span>{inst.Name}</span>
                                  {/* Toggle for general row expansion (credentials) */}
                                  {showToggle && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleCredentialExpansion(inst.InstanceId)
                                      }}
                                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                      title="Toggle Credentials"
                                    >
                                      {expandedCredentials[inst.InstanceId] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                                    ? renderCopyField(inst.SSHCommand, `${inst.InstanceId}_ssh`, true) // Truncate SSH command
                                    : "-"}
                              </td>
                              {showExpiryColumn[serviceType] && (
                                <td style={{ padding: "10px" }}>
                                  <div className="flex items-center gap-2">
                                    <span>{getInstanceExpiryDate(inst.InstanceId)}</span>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        toggleUsageDetails(inst.InstanceId)
                                      }}
                                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                      title="Toggle Usage Details"
                                    >
                                      {expandedUsageRows[inst.InstanceId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
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
                                {!isMutedState && isStopped && renderButton("Start", "start", inst.InstanceId)}
                                {!isMutedState && isRunning && (
                                  <>
                                    {renderButton("Stop", "stop", inst.InstanceId)}
                                    {renderButton("Reboot", "reboot", inst.InstanceId)}
                                  </>
                                )}
                                {isWindowsADDNS && inst.State === "running" && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleGetPassword(inst.InstanceId)
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
                                      position: "relative", // For positioning the counter
                                    }}
                                    disabled={passwordModal.loading || isPasswordRateLimited}
                                    title={
                                      isPasswordRateLimited ? `Try again in ${formatRemainingTime(remainingTime)}` : undefined
                                    }
                                  >
                                    {passwordModal.loading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                                    {isPasswordRateLimited ? formatRemainingTime(remainingTime) : "Get Password"}
                                    <span className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs font-bold rounded-full h-5 w-auto min-w-[20px] px-1 flex items-center justify-center">
                                      {MAX_PASSWORD_CLICKS - passwordClickCount}/{MAX_PASSWORD_CLICKS}
                                    </span>
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedCredentials[inst.InstanceId] && (
                              <tr id={`details-${inst.InstanceId}`} className="bg-gray-50 dark:bg-gray-800">
                                <td colSpan={showExpiryColumn[serviceType] ? 8 : 7} style={{ padding: "10px 10px 10px 20px" }}>
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
                                    {inst.Name === "OpenVPN" && (
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
                            {expandedUsageRows[inst.InstanceId] && (() => {
                              const usageDetails = getInstanceUsageDetails(inst.InstanceId)
                              return usageDetails ? (
                                <tr className="bg-blue-50 dark:bg-blue-900/20">
                                  <td colSpan={showExpiryColumn[serviceType] ? 8 : 7} style={{ padding: "10px 10px 10px 20px" }}>
                                    <div className="text-sm">
                                      <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-semibold text-blue-800">Usage Summary</h4>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            fetchUsageSummary()
                                          }} // Call the passed function
                                          disabled={isRefreshingUsage} // Use the passed state
                                          className={`p-1 rounded-full ${
                                            isRefreshingUsage ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-gray-700"
                                          } text-white`}
                                          title="Refresh Usage"
                                        >
                                          <RefreshCcw className={`w-4 h-4 ${isRefreshingUsage ? "animate-spin" : ""}`} />
                                        </button>
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
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Password Display Modal - Stabilized */}
      <Dialog 
        open={passwordModal.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleClosePasswordModal()
          }
        }}
      >
        <DialogContent 
          className="w-[95vw] max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
          onPointerDownOutside={(e) => {
            e.preventDefault()
            handleClosePasswordModal()
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            handleClosePasswordModal()
          }}
        >
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
            {passwordModal.loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Fetching password...</span>
              </div>
            ) : passwordModal.error ? (
              <div className="text-red-500 text-center py-4">{passwordModal.error}</div>
            ) : passwordModal.details ? (
              <div className="space-y-4">
                {passwordModal.details.publicIp && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 mb-1 sm:mb-0">Public IP:</span>
                    <div className="flex items-center gap-2 flex-wrap justify-end sm:justify-start">
                      <span className="font-semibold text-gray-800 dark:text-white text-base break-all">
                        {passwordModal.details.publicIp}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleCopy(passwordModal.details?.publicIp ?? "", "win-public-ip")
                        }}
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
                      {passwordModal.details.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCopy(passwordModal.details?.username ?? "", "win-username")
                      }}
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
                      {passwordModal.details.password}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCopy(passwordModal.details?.password ?? "", "win-password")
                      }}
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
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClosePasswordModal()
                }}
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
