"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import axios from "axios"
import { Copy, Loader2, RefreshCcw, Eye, EyeOff, Database, Play, AlertCircle, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ServiceTable from "./table/ServiceTable"
import PasswordModal from "./password-management/PasswordModal"
import ExtendValidityModal from "./modals/ExtendValidityModal"
import InstallSplunkModal from "./modals/InstallSplunkModal"
import { usePasswordState } from "./password-management/usePasswordState"
import { useInstanceActions } from "./actions/useInstanceActions"
import { MAX_PASSWORD_CLICKS } from "./password-management/types"
import type { EC2Instance, ClusterInstance, SplunkValidationResult } from "./types"

const FREEZE_STORAGE_KEY = "cluster_freeze_state"
const FREEZE_TIMER_KEY = "cluster_freeze_timer"

interface EC2TableProps {
  email: string
  instances: EC2Instance[]
  setInstances: (instances: EC2Instance[]) => void
  loading: boolean
  rawUsageSummary: any[]
  fetchUsageSummary: () => void
  isRefreshingUsage: boolean
  hasLab: boolean
  onPasswordModalOpenChange?: (open: boolean) => void
}

const EC2Table: React.FC<EC2TableProps> = ({
  email,
  instances,
  setInstances,
  loading,
  rawUsageSummary,
  fetchUsageSummary,
  isRefreshingUsage,
  hasLab,
  onPasswordModalOpenChange,
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string

  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [showExpiryColumn, setShowExpiryColumn] = useState<Record<string, boolean>>({})
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set())
  const [expandedUsageRows, setExpandedUsageRows] = useState<Record<string, boolean>>({})
  const [expandedCredentials, setExpandedCredentials] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ec2-expanded-credentials")
        if (saved) {
          const savedState = JSON.parse(saved)
          // Only return saved state if it has collapsed items, otherwise use defaults
          const hasCollapsedItems = Object.values(savedState).some((value) => value === false)
          if (hasCollapsedItems) {
            return savedState
          }
        }
      } catch (error) {
        console.error("Failed to load expanded credentials state:", error)
      }
    }
    // Default to expanded for specific services
    const defaultExpanded: Record<string, boolean> = {}
    return defaultExpanded
  })

  const {
    passwordModal,
    setPasswordModal,
    passwordClickCount,
    isPasswordRateLimited,
    remainingTime,
    formatRemainingTime,
    incrementPasswordClick,
  } = usePasswordState(email)

  const [clusterConfigModal, setClusterConfigModal] = useState({
    isOpen: false,
    loading: false,
    error: null as string | React.ReactNode | null,
    success: false,
    username: "",
    email: "",
    editableUsername: false,
    startingInstances: false,
    checkingLicense: false,
    licenseError: null as string | null,
    needsLicenseUpload: false,
    managementServerNotFound: false,
    stoppedInstances: [] as any[],
    splunkValidationTimer: 0,
    splunkValidationInProgress: false,
    splunkValidationResults: null as any,
    showProceedAfterTimer: false,
    splunkServerStatus: [] as Array<{
      ip: string
      status: string
      details: string
      instanceName?: string
    }>,
    showSplunkStatus: false,
    licenseValidationComplete: false,
    finalConfigurationInProgress: false,
    finalConfigurationComplete: false,
    configurationResponse: null as any,
  })

  const [clusterInstancesFreeze, setClusterInstancesFreeze] = useState({
    frozen: false,
    freezeEndTime: null as number | null,
    remainingTime: 0,
  })

  const [frozenClusterInstances, setFrozenClusterInstances] = useState<Record<string, number>>({})
  const [frozenClusterRemainingTimes, setFrozenClusterRemainingTimes] = useState<Record<string, number>>({})

  const [extendValidityModal, setExtendValidityModal] = useState({
    isOpen: false,
    instanceId: "",
    instanceName: "",
    endDate: "",
  })

  const [installSplunkModal, setInstallSplunkModal] = useState({
    isOpen: false,
  })

  const [stableTooltips, setStableTooltips] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Only save to localStorage if there are collapsed items
        const hasCollapsedItems = Object.values(expandedCredentials).some((value) => value === false)
        if (hasCollapsedItems) {
          localStorage.setItem("ec2-expanded-credentials", JSON.stringify(expandedCredentials))
        } else {
          // Remove from localStorage if all are expanded (default state)
          localStorage.removeItem("ec2-expanded-credentials")
        }
      } catch (error) {
        console.error("Failed to save expanded credentials state:", error)
      }
    }
  }, [expandedCredentials])

  useEffect(() => {
    // Clean up stable tooltips for instances that no longer exist
    const currentInstanceIds = new Set(instances.map((inst) => inst.InstanceId))
    setStableTooltips((prev) => {
      const newState = { ...prev }
      let hasChanges = false

      Object.keys(newState).forEach((key) => {
        const instanceId = key.split("_")[0]
        if (instanceId && !currentInstanceIds.has(instanceId)) {
          delete newState[key]
          hasChanges = true
        }
      })

      return hasChanges ? newState : prev
    })
  }, [instances])

  useEffect(() => {
    const loadFreezeStateFromStorage = () => {
      try {
        const storedFreezeState = localStorage.getItem(FREEZE_STORAGE_KEY)
        const storedTimerState = localStorage.getItem(FREEZE_TIMER_KEY)

        if (storedFreezeState && storedTimerState) {
          const freezeState = JSON.parse(storedFreezeState)
          const timerState = JSON.parse(storedTimerState)

          // Check if any freeze states are still valid
          const currentTime = Date.now()
          const validFrozenInstances: Record<string, number> = {}
          const validRemainingTimes: Record<string, number> = {}
          let hasValidFreeze = false

          Object.entries(freezeState.frozenClusterInstances || {}).forEach(([instanceId, endTime]) => {
            if (currentTime < (endTime as number)) {
              validFrozenInstances[instanceId] = endTime as number
              const remainingSeconds = Math.ceil(((endTime as number) - currentTime) / 1000)
              validRemainingTimes[instanceId] = remainingSeconds
              hasValidFreeze = true
            }
          })

          if (hasValidFreeze) {
            setFrozenClusterInstances(validFrozenInstances)
            setFrozenClusterRemainingTimes(validRemainingTimes)

            // Restore global freeze state if valid
            if (timerState.freezeEndTime && currentTime < timerState.freezeEndTime) {
              const globalRemainingSeconds = Math.ceil((timerState.freezeEndTime - currentTime) / 1000)
              setClusterInstancesFreeze({
                frozen: true,
                freezeEndTime: timerState.freezeEndTime,
                remainingTime: globalRemainingSeconds,
              })

              // Restart the countdown timer
              startFreezeCountdown(validFrozenInstances, validRemainingTimes, globalRemainingSeconds)
            }
          } else {
            // Clean up expired storage
            localStorage.removeItem(FREEZE_STORAGE_KEY)
            localStorage.removeItem(FREEZE_TIMER_KEY)
          }
        }
      } catch (error) {
        console.error("Error loading freeze state from localStorage:", error)
        localStorage.removeItem(FREEZE_STORAGE_KEY)
        localStorage.removeItem(FREEZE_TIMER_KEY)
      }
    }

    loadFreezeStateFromStorage()
  }, [])

  let activeFreezeTimer: NodeJS.Timeout | null = null

  const startFreezeCountdown = (
    initialFrozenInstances: Record<string, number>,
    initialRemainingTimes: Record<string, number>,
    initialGlobalTime: number,
  ) => {
    // Clear any old timer before starting a new one
    if (activeFreezeTimer) {
      clearInterval(activeFreezeTimer)
      activeFreezeTimer = null
    }

    const freezeTimer = setInterval(() => {
      // Update global freeze state
      setClusterInstancesFreeze((prev) => {
        const newRemaining = Math.max(0, prev.remainingTime - 1)

        if (newRemaining <= 0) {
          clearInterval(freezeTimer)
          activeFreezeTimer = null
          localStorage.removeItem(FREEZE_STORAGE_KEY)
          localStorage.removeItem(FREEZE_TIMER_KEY)
          return { frozen: false, freezeEndTime: null, remainingTime: 0 }
        }

        const newState = { ...prev, remainingTime: newRemaining }
        localStorage.setItem(
          FREEZE_TIMER_KEY,
          JSON.stringify({
            freezeEndTime: newState.freezeEndTime,
            remainingTime: newRemaining,
          }),
        )
        return newState
      })

      // Update per-instance freeze state
      setFrozenClusterRemainingTimes((prev) => {
        const updated: Record<string, number> = {}

        let allExpired = true
        Object.keys(prev).forEach((instanceId) => {
          const newValue = prev[instanceId] - 1
          if (newValue >= 0) {
            updated[instanceId] = newValue
            allExpired = false
          }
        })

        if (allExpired) {
          setTimeout(() => {
            setFrozenClusterInstances({})
            localStorage.removeItem(FREEZE_STORAGE_KEY)
            localStorage.removeItem(FREEZE_TIMER_KEY)
          }, 1000)
          clearInterval(freezeTimer)
          activeFreezeTimer = null
          return {}
        }

        setFrozenClusterInstances((prevFrozen) => {
          const newFrozenState = { ...prevFrozen }
          Object.keys(prevFrozen).forEach((instanceId) => {
            if (updated[instanceId] === undefined) {
              delete newFrozenState[instanceId]
            }
          })

          localStorage.setItem(
            FREEZE_STORAGE_KEY,
            JSON.stringify({
              frozenClusterInstances: newFrozenState,
              frozenClusterRemainingTimes: updated,
            }),
          )
          return newFrozenState
        })

        return updated
      })
    }, 1000)

    activeFreezeTimer = freezeTimer
    return freezeTimer
  }

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (email && hasLab && instances.length > 0) {
      interval = setInterval(() => {
        fetchInstances()
      }, 3000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [email, hasLab, instances.length])

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
          plan_start_date: summary.PlanStartDate || "",
          plan_end_date: summary.PlanEndDate || "",
          balance_days: summary.BalanceDays || 0,
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

  // Helper function to check if instances match cluster pattern
  const isClusterInstance = (instanceName: string) => {
    const clusterPatterns = ["ClusterMaster", "idx1", "idx2", "idx3", "Management_server", "IF", "SH1", "SH2", "SH3"]
    return clusterPatterns.some((pattern) => instanceName.includes(pattern))
  }

  // Helper function to extract username from instance name
  const extractUsernameFromInstance = (instanceName: string) => {
    const patterns = ["ClusterMaster", "idx1", "idx2", "idx3", "Management_server", "IF", "SH1", "SH2", "SH3"]

    for (const pattern of patterns) {
      if (instanceName.includes(`-${pattern}`)) {
        return instanceName.split(`-${pattern}`)[0]
      }
    }
    return instanceName.split("-")[0]
  }

  // Helper function to check if service type has complete cluster set
  const hasCompleteClusterSet = (serviceInstances: EC2Instance[]) => {
    const requiredPatterns = ["ClusterMaster", "idx1", "idx2", "idx3", "Management_server", "IF", "SH1", "SH2", "SH3"]

    // Get all usernames from cluster instances
    const usernames = new Set<string>()
    serviceInstances.forEach((inst) => {
      if (isClusterInstance(inst.Name)) {
        usernames.add(extractUsernameFromInstance(inst.Name))
      }
    })

    // Check if any username has all required patterns
    for (const username of usernames) {
      const userInstances = serviceInstances.filter((inst) => inst.Name.startsWith(username))
      const foundPatterns = userInstances
        .map((inst) => {
          for (const pattern of requiredPatterns) {
            if (inst.Name.includes(`-${pattern}`)) {
              return pattern
            }
          }
          return null
        })
        .filter(Boolean)

      if (requiredPatterns.every((pattern) => foundPatterns.includes(pattern))) {
        return { hasComplete: true, username }
      }
    }

    return { hasComplete: false, username: null }
  }

  // Helper function to get cluster instances for a specific username
  const getClusterInstancesForUsername = useCallback(
    (username: string) => {
      return instances.filter((inst) => inst.Name.startsWith(username) && isClusterInstance(inst.Name))
    },
    [instances],
  )

  // Helper function to check if instance is frozen
  const isInstanceFrozen = useCallback(
    (instanceId: string) => {
      const endTime = frozenClusterInstances[instanceId]
      if (!endTime) return false
      return Date.now() < endTime
    },
    [frozenClusterInstances],
  )

  // Helper function to calculate notification dot urgency
  const getNotificationUrgency = (instanceId: string) => {
    const usageDetails = getInstanceUsageDetails(instanceId)
    if (!usageDetails) return null

    const now = new Date()
    const endDate = new Date(usageDetails.plan_end_date)
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const usagePercentage = (usageDetails.used_hours / usageDetails.quota_hours) * 100

    // Check if we should show notification (2 days before end OR 80% usage)
    const shouldShowByDate = daysUntilEnd <= 2 && daysUntilEnd >= 0
    const shouldShowByUsage = usagePercentage >= 80

    if (!shouldShowByDate && !shouldShowByUsage) return null

    // Determine urgency level
    const isHighUrgency = daysUntilEnd <= 1 || usagePercentage >= 90

    return {
      level: isHighUrgency ? "high" : "medium",
      daysUntilEnd,
      usagePercentage: Math.round(usagePercentage),
      endDate: usageDetails.plan_end_date,
    }
  }

  // Helper function to get notification tooltip text
  const getNotificationTooltip = (urgency: any) => {
    if (!urgency) return ""

    const messages = []
    if (urgency.daysUntilEnd <= 2 && urgency.daysUntilEnd >= 0) {
      messages.push(`Quota expires in ${urgency.daysUntilEnd} day${urgency.daysUntilEnd !== 1 ? "s" : ""}`)
    }
    if (urgency.usagePercentage >= 80) {
      messages.push(`${urgency.usagePercentage}% quota used`)
    }

    return `${messages.join(" • ")} - Click to extend validity`
  }

  // Helper function to handle extend validity
  const handleExtendValidity = (instanceId: string, instanceName: string) => {
    const usageDetails = getInstanceUsageDetails(instanceId)
    setExtendValidityModal({
      isOpen: true,
      instanceId,
      instanceName,
      endDate: usageDetails?.plan_end_date || "",
    })
  }

  const fetchFreshInstanceData = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/instances`, {
        headers: { Authorization: `Bearer ${email}` },
      })
      return res.data
    } catch (error) {
      console.error("Error fetching instances:", error)
      return []
    }
  }, [apiUrl, email])

  const fetchInstances = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await axios.get(`${apiUrl}/instances`, {
        headers: { Authorization: `Bearer ${email}` },
      })
      setInstances(res.data)
    } catch (error) {
      console.error("Error fetching instances:", error)
    } finally {
      setRefreshing(false)
    }
  }, [apiUrl, email, setInstances])

  const {
    disabledButtons,
    loadingAction,
    bulkActionLoading,
    cooldowns,
    handleButtonClick,
    handleBulkAction,
    callAction,
  } = useInstanceActions(email, instances, fetchInstances, isInstanceFrozen)

  const validateSplunkInstallation = useCallback(
    async (username: string) => {
      try {
        // Get fresh instance data
        const freshInstances: ClusterInstance[] = await fetchFreshInstanceData()

        const clusterInstances = freshInstances.filter(
          (inst: ClusterInstance) => inst.Name && inst.Name.toLowerCase().includes(username.toLowerCase()),
        )

        const runningInstances = clusterInstances.filter(
          (inst: ClusterInstance) => inst.State && inst.State.toLowerCase() === "running",
        )

        if (runningInstances.length === 0) {
          const currentStates = clusterInstances
            .map((inst: ClusterInstance) => `${inst.Name}: ${inst.State}`)
            .join(", ")
          throw new Error(`No running servers found for Splunk validation. Current states: ${currentStates}`)
        }

        const publicIps: string[] = []
        const serverDetails: { name: string; ip: string | null }[] = []

        runningInstances.forEach((inst: ClusterInstance) => {
          // Try all possible property names for public IP
          const possibleIpProps = [
            "PublicIpAddress",
            "PublicIP",
            "Public IP",
            "publicIp",
            "public_ip",
            "PublicIp",
            "public_ip_address",
            "publicIpAddress",
            "ip",
            "IP",
          ]

          let publicIp: string | null = null

          for (const prop of possibleIpProps) {
            if (inst[prop] && typeof inst[prop] === "string" && inst[prop].trim()) {
              publicIp = inst[prop].trim()
              break
            }
          }

          // If still no IP found, check if it's nested in an object
          if (!publicIp && typeof inst === "object") {
            const allKeys = Object.keys(inst)

            // Look for any property that might contain an IP address pattern
            for (const key of allKeys) {
              const value = inst[key]
              if (typeof value === "string" && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value)) {
                publicIp = value
                break
              }
            }
          }

          serverDetails.push({ name: inst.Name || "Unknown", ip: publicIp })

          if (publicIp) {
            publicIps.push(publicIp)
          }
        })

        if (publicIps.length === 0) {
          const serverNames = runningInstances.map((inst: ClusterInstance) => inst.Name).join(", ")
          throw new Error(
            `No public IPs found for running servers: ${serverNames}. Please check if instances have public IP addresses assigned.`,
          )
        }

        const response = await fetch("/api/lab-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email,
          },
          body: JSON.stringify({
            path: "/splunk-validate",
            method: "POST",
            body: {
              public_ips: publicIps,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Splunk validation API failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        const results = data.results || []
        const enhancedResults = results.map((result: SplunkValidationResult) => {
          const serverDetail = serverDetails.find((s) => s.ip === result.ip)
          return {
            ...result,
            serverName: serverDetail?.name || `Server (${result.ip})`,
          }
        })

        return {
          success: true,
          results: enhancedResults,
          instances: runningInstances,
        }
      } catch (error) {
        console.error("Splunk validation error:", error)
        throw error
      }
    },
    [email, fetchFreshInstanceData],
  )

  const validateSplunkLicense = useCallback(
    async (username: string) => {
      try {
        // Find the Management_server instance
        const managementServer = instances.find(
          (inst) => inst.Name.includes(`${username}-Management_server`) && inst.ServiceType === "Splunk",
        )

        if (!managementServer || !managementServer.PublicIp) {
          throw new Error("Management server not found or doesn't have a public IP")
        }

        // Check if Management_server is running
        if (managementServer.State !== "running") {
          throw new Error("Management server is not running. Please start it first.")
        }

        // Use our backend proxy to handle HTTPS certificate issues
        const response = await fetch("/api/lab-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": email,
          },
          body: JSON.stringify({
            path: "/validate-splunk-license",
            method: "POST",
            body: {
              management_server_ip: managementServer.PublicIp,
              username: "admin",
              password: "admin123",
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to connect to Management server: ${response.status}`)
        }

        const data = await response.json()

        if (data.message === "Internal Server Error") {
          return {
            valid: false,
            error: "Public IP not correct. Please try again.",
          }
        }

        if (data.status === "Splunk License updated") {
          return {
            valid: true,
            message: "Splunk license updated successfully",
          }
        }

        if (data.status === "Splunk Enterprise Trial free account") {
          return {
            valid: false,
            needsLicenseUpload: true,
            message: (
              <>
                Splunk license update required. Please update the license in the Management_server.
                <button
                  onClick={() => setInstallSplunkModal({ isOpen: true })}
                  className="ml-2 text-blue-600 underline text-xs"
                >
                  Read more
                </button>
              </>
            ),
          }
        }

        // For any other status, assume license needs to be uploaded
        return {
          valid: false,
          needsLicenseUpload: true,
          message: "License validation failed. Please check your license configuration.",
        }
      } catch (error) {
        console.error("License validation error:", error)
        throw error
      }
    },
    [instances, email],
  )

  const triggerClusterConfiguration = useCallback(async () => {
    try {
      setClusterConfigModal((prev) => ({
        ...prev,
        finalConfigurationInProgress: true,
        error: null,
      }))

      const response = await fetch("/api/lab-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email,
        },
        body: JSON.stringify({
          path: "/cluster-config",
          method: "POST",
          body: {
            username: clusterConfigModal.username,
            email: clusterConfigModal.email,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Cluster configuration failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.status === "success") {
        const freezeEndTime = Date.now() + 25 * 60 * 1000 // 25 minutes

        const clusterInstances = getClusterInstancesForUsername(clusterConfigModal.username)

        // Set freeze for each cluster instance
        const newFrozenInstances: Record<string, number> = {}
        const newFrozenRemainingTimes: Record<string, number> = {}

        clusterInstances.forEach((instance) => {
          newFrozenInstances[instance.InstanceId] = freezeEndTime
          newFrozenRemainingTimes[instance.InstanceId] = 25 * 60 // 25 minutes in seconds
        })

        // Update states
        setFrozenClusterInstances((prev) => {
          const newState = { ...prev, ...newFrozenInstances }
          return newState
        })

        setFrozenClusterRemainingTimes((prev) => {
          const newState = { ...prev, ...newFrozenRemainingTimes }
          return newState
        })

        // Save to localStorage immediately
        localStorage.setItem(
          FREEZE_STORAGE_KEY,
          JSON.stringify({
            frozenClusterInstances: newFrozenInstances,
            frozenClusterRemainingTimes: newFrozenRemainingTimes,
          }),
        )

        // Also set global freeze state for display in modal
        setClusterInstancesFreeze({
          frozen: true,
          freezeEndTime,
          remainingTime: 25 * 60, // 25 minutes in seconds
        })

        localStorage.setItem(
          FREEZE_TIMER_KEY,
          JSON.stringify({
            freezeEndTime,
            remainingTime: 25 * 60,
          }),
        )

        startFreezeCountdown(newFrozenInstances, newFrozenRemainingTimes, 25 * 60)

        setClusterConfigModal((prev) => ({
          ...prev,
          finalConfigurationInProgress: false,
          finalConfigurationComplete: true,
          configurationResponse: data,
          success: true,
        }))
      } else {
        throw new Error("Cluster configuration failed")
      }
    } catch (error) {
      console.error("Cluster configuration error:", error)
      setClusterConfigModal((prev) => ({
        ...prev,
        finalConfigurationInProgress: false,
        error: error instanceof Error ? error.message : "Cluster configuration failed. Please try again.",
      }))
    }
  }, [email, clusterConfigModal.username, clusterConfigModal.email, getClusterInstancesForUsername])

  const retrySplunkValidation = useCallback(async () => {
    setClusterConfigModal((prev) => ({
      ...prev,
      splunkValidationInProgress: true,
      showSplunkStatus: false,
      error: null,
    }))

    try {
      const splunkValidation = await validateSplunkInstallation(clusterConfigModal.username)

      setClusterConfigModal((prev) => ({
        ...prev,
        splunkValidationInProgress: false,
        splunkServerStatus: splunkValidation.results,
        showSplunkStatus: true,
      }))
    } catch (error) {
      console.error("Retry Splunk validation error:", error)
      setClusterConfigModal((prev) => ({
        ...prev,
        splunkValidationInProgress: false,
        error: error instanceof Error ? error.message : "Splunk validation failed. Please try again.",
      }))
    }
  }, [clusterConfigModal.username, validateSplunkInstallation])

  const handleClusterConfigSubmit = useCallback(async () => {
    setClusterConfigModal((prev) => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
      splunkValidationInProgress: false,
      splunkValidationResults: null,
      showProceedAfterTimer: false,
      showSplunkStatus: false,
      licenseValidationComplete: false,
    }))

    try {
      // First, get fresh instance data to check server states
      const freshInstances = await fetchFreshInstanceData()
      const clusterInstances = freshInstances.filter(
        (inst: ClusterInstance) =>
          inst.Name && inst.Name.toLowerCase().includes(clusterConfigModal.username.toLowerCase()),
      )

      const stoppedInstances = clusterInstances.filter(
        (inst: ClusterInstance) => inst.State && inst.State.toLowerCase() !== "running",
      )

      // If there are stopped instances, show them and allow starting
      if (stoppedInstances.length > 0) {
        setClusterConfigModal((prev) => ({
          ...prev,
          loading: false,
          stoppedInstances,
          managementServerNotFound: true,
          error: `Please start all cluster servers before configuring the cluster.`,
        }))
        return
      }

      // All servers are running, proceed with Splunk validation
      setClusterConfigModal((prev) => ({
        ...prev,
        splunkValidationInProgress: true,
      }))

      const splunkValidation = await validateSplunkInstallation(clusterConfigModal.username)

      setClusterConfigModal((prev) => ({
        ...prev,
        loading: false,
        splunkValidationInProgress: false,
        splunkServerStatus: splunkValidation.results,
        showSplunkStatus: true,
      }))
    } catch (error) {
      console.error("Cluster configuration error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to configure cluster. Please try again."

      setClusterConfigModal((prev) => ({
        ...prev,
        loading: false,
        splunkValidationInProgress: false,
        error: errorMessage,
        success: false,
      }))
    }
  }, [clusterConfigModal.username, clusterConfigModal.email, email, validateSplunkInstallation, fetchFreshInstanceData])

  const proceedToLicenseValidation = useCallback(async () => {
    setClusterConfigModal((prev) => ({
      ...prev,
      loading: true,
      checkingLicense: true,
      error: null,
    }))

    try {
      const licenseValidation = await validateSplunkLicense(clusterConfigModal.username)

      if (licenseValidation.valid) {
        setClusterConfigModal((prev) => ({
          ...prev,
          loading: false,
          checkingLicense: false,
          licenseValidationComplete: true,
          error: null,
        }))
      } else {
        setClusterConfigModal((prev) => ({
          ...prev,
          loading: false,
          checkingLicense: false,
          error: licenseValidation.message || "License validation failed",
          needsLicenseUpload: licenseValidation.needsLicenseUpload || false,
        }))
      }
    } catch (error) {
      console.error("License validation error:", error)
      setClusterConfigModal((prev) => ({
        ...prev,
        loading: false,
        checkingLicense: false,
        error: error instanceof Error ? error.message : "License validation failed. Please try again.",
      }))
    }
  }, [clusterConfigModal.username, validateSplunkLicense])

  const handleStartAllInstances = useCallback(
    async (instancesToStart: EC2Instance[]) => {
      setClusterConfigModal((prev) => ({ ...prev, startingInstances: true }))

      try {
        const promises = instancesToStart.map((inst) => callAction("start", inst.InstanceId))
        await Promise.all(promises)

        // Refresh instances to get updated states
        await fetchInstances()

        // Clear the error after starting instances
        setClusterConfigModal((prev) => ({
          ...prev,
          error: null,
          startingInstances: false,
          managementServerNotFound: false,
          stoppedInstances: [],
        }))
      } catch (error) {
        console.error("Error starting cluster instances:", error)
        setClusterConfigModal((prev) => ({
          ...prev,
          startingInstances: false,
        }))
      }
    },
    [callAction, fetchInstances],
  )

  const handleCloseClusterModal = useCallback(() => {
    setClusterConfigModal({
      isOpen: false,
      loading: false,
      error: null,
      success: false,
      username: "",
      email: "",
      editableUsername: false,
      startingInstances: false,
      checkingLicense: false,
      licenseError: null,
      needsLicenseUpload: false,
      managementServerNotFound: false,
      stoppedInstances: [],
      splunkValidationTimer: 0,
      splunkValidationInProgress: false,
      splunkValidationResults: null,
      showProceedAfterTimer: false,
      splunkServerStatus: [],
      showSplunkStatus: false,
      licenseValidationComplete: false,
      finalConfigurationInProgress: false,
      finalConfigurationComplete: false,
      configurationResponse: null,
    })
  }, [])

  const handleCopy = useCallback((text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  const renderCopyField = (text: string, fieldId: string, truncate?: boolean) => {
    const displayText = truncate && text.length > 25 ? text.substring(0, 25) + "..." : text
    return (
      <div className="relative inline-flex items-center">
        <span className="mr-1.5">{displayText}</span>
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopy(text, fieldId)
          }}
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
      backgroundColor: "#3b82f6",
      hover: "#2563eb",
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

  const getBulkButtonTooltip = useCallback(
    (action: string) => {
      const frozenSelected = Array.from(selectedInstances).filter((id) => isInstanceFrozen(id))

      if (frozenSelected.length > 0) {
        return "Cluster configuration is in progress. Please wait until the runtime is complete."
      }

      if (selectedInstances.size === 0) {
        return `Select servers to perform bulk ${action}`
      }

      return `${action.charAt(0).toUpperCase() + action.slice(1)} all selected servers`
    },
    [selectedInstances, isInstanceFrozen],
  )

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
            handleBulkAction(action, selectedInstances)
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
            handleButtonClick(action, instanceId)
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

  const handleGetPassword = useCallback(
    async (instanceId: string) => {
      if (isPasswordRateLimited) {
        console.warn("Password retrieval limit reached. Please wait for the next 20-minute window.")
        return
      }

      if (passwordModal.loading) {
        return
      }

      incrementPasswordClick()

      setPasswordModal((prev) => ({
        ...prev,
        isOpen: true,
        loading: true,
        error: null,
        details: null,
      }))
      onPasswordModalOpenChange?.(true)

      const instance = instances.find((inst) => inst.InstanceId === instanceId)
      if (!instance) {
        setPasswordModal((prev) => ({
          ...prev,
          loading: false,
          error: "Instance not found",
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
          setPasswordModal((prev) => ({
            ...prev,
            loading: false,
            error: null,
            details: {
              username: "Administrator",
              password: response.data.decrypted_password,
              publicIp: instance.PublicIp,
            },
          }))
        } else {
          setPasswordModal((prev) => ({
            ...prev,
            loading: false,
            error: response.data.message || "Failed to retrieve password.",
            details: null,
          }))
        }
      } catch (error) {
        console.error("Error fetching Windows password:", error)
        setPasswordModal((prev) => ({
          ...prev,
          loading: false,
          error: "An error occurred while fetching the password. Please try again.",
          details: null,
        }))
      }
    },
    [
      isPasswordRateLimited,
      passwordModal.loading,
      email,
      instances,
      onPasswordModalOpenChange,
      incrementPasswordClick,
      setPasswordModal,
    ],
  )

  const toggleExpiryColumn = useCallback((serviceType: string) => {
    setShowExpiryColumn((prev) => ({
      ...prev,
      [serviceType]: !prev[serviceType],
    }))
  }, [])

  const handleInstanceSelection = useCallback((instanceId: string, checked: boolean) => {
    setSelectedInstances((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(instanceId)
      } else {
        newSet.delete(instanceId)
      }
      return newSet
    })
  }, [])

  const handleSelectAllForServiceType = useCallback(
    (serviceType: string, checked: boolean) => {
      const serviceInstances = groupedInstances[serviceType]
      setSelectedInstances((prev) => {
        const newSet = new Set(prev)
        serviceInstances.forEach((instance) => {
          if (checked) {
            newSet.add(instance.InstanceId)
          } else {
            newSet.delete(instance.InstanceId)
          }
        })
        return newSet
      })
    },
    [instances],
  )

  const handleKeepOnlyRunning = useCallback(() => {
    setSelectedInstances((prev) => {
      const newSet = new Set<string>()
      Array.from(prev).forEach((instanceId) => {
        const instance = instances.find((inst) => inst.InstanceId === instanceId)
        if (instance && instance.State === "running") {
          newSet.add(instanceId)
        }
      })
      return newSet
    })
  }, [instances])

  const handleKeepOnlyStopped = useCallback(() => {
    setSelectedInstances((prev) => {
      const newSet = new Set<string>()
      Array.from(prev).forEach((instanceId) => {
        const instance = instances.find((inst) => inst.InstanceId === instanceId)
        if (instance && instance.State === "stopped") {
          newSet.add(instanceId)
        }
      })
      return newSet
    })
  }, [instances])

  const groupedInstances = useMemo(() => {
    return instances.reduce<Record<string, EC2Instance[]>>((acc, inst) => {
      const key = inst.ServiceType || "Unknown"
      if (!acc[key]) acc[key] = []
      acc[key].push(inst)
      return acc
    }, {})
  }, [instances])

  const orderedServiceTypes = Object.keys(groupedInstances).sort((a, b) => {
    if (a === "Splunk") return -1
    if (b === "Splunk") return 1
    return 0
  })

  const selectedInstanceDetails = Array.from(selectedInstances)
    .map((id) => instances.find((inst) => inst.InstanceId === id))
    .filter(Boolean) as EC2Instance[]

  const allSelectedStopped =
    selectedInstanceDetails.length > 0 && selectedInstanceDetails.every((inst) => inst.State === "stopped")
  const allSelectedRunning =
    selectedInstanceDetails.length > 0 && selectedInstanceDetails.every((inst) => inst.State === "running")
  const hasMixedStates = selectedInstances.size > 0 && !allSelectedStopped && !allSelectedRunning

  const formatFloatHours = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const toggleCredentials = useCallback(
    (instanceId: string) => {
      const instance = instances.find((inst) => inst.InstanceId === instanceId)
      if (!instance) return

      const showToggle = ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(instance.Name)
      if (!showToggle) return

      setExpandedCredentials((prev) => {
        const newState = { ...prev }
        // If not set, default to expanded (true), then toggle
        const currentState = prev[instanceId] !== undefined ? prev[instanceId] : true
        newState[instanceId] = !currentState
        return newState
      })
    },
    [instances],
  )

  const getExpandedCredentials = useCallback(
    (instanceId: string) => {
      const instance = instances.find((inst) => inst.InstanceId === instanceId)
      if (!instance) return false

      const showToggle = ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"].includes(instance.Name)
      if (!showToggle) return false

      // Default to expanded (true) if not set
      return expandedCredentials[instanceId] !== undefined ? expandedCredentials[instanceId] : true
    },
    [expandedCredentials, instances],
  )

  // useEffect(() => {
  //   const defaultExpanded: Record<string, boolean> = {}
  //   const defaultExpandedSources = ["MYSQL", "Jenkins", "MSSQL", "OSSEC", "OpenVPN"]
  //   instances.forEach((inst) => {
  //     if (defaultExpandedSources.includes(inst.Name)) {
  //       defaultExpanded[inst.InstanceId] = true
  //     }
  //   })
  //   if (instances.length > 0) {
  //     // This was overriding user collapsed preferences
  //   }
  // }, [instances])

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

      {instances.length === 0 && !loading ? (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">You don't have any servers here.</h3>
            <div className="bg-blue-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                It looks like you don't have a lab assigned yet. Choose a plan to get started with your personalized lab
                setup.
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
          {selectedInstances.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
                        handleKeepOnlyRunning()
                      }}
                      className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
                      title="Keep only running servers selected"
                    >
                      Keep Running
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleKeepOnlyStopped()
                      }}
                      className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded-md transition-colors"
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
                    setSelectedInstances(new Set())
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
                  title="Clear selection"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {orderedServiceTypes.map((serviceType) => {
            const serviceInstances = groupedInstances[serviceType]
            const allUsageRowsExpanded = serviceInstances.every((inst) => expandedUsageRows[inst.InstanceId])

            const clusterInfo = hasCompleteClusterSet(serviceInstances)
            const allSelectedInService = serviceInstances.every((inst) => selectedInstances.has(inst.InstanceId))
            const someSelectedInService = serviceInstances.some((inst) => selectedInstances.has(inst.InstanceId))

            return (
              <div key={serviceType} style={{ marginBottom: 40 }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-md font-semibold text-green-600">
                    {serviceType} Servers
                    {serviceType === "Splunk" && (
                      <span className="text-gray-500 text-sm font-normal ml-2">
                        (username: admin, password: admin123)
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {clusterInfo.hasComplete && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setClusterConfigModal({
                            isOpen: true,
                            loading: false,
                            error: null,
                            success: false,
                            username: clusterInfo.username || "",
                            email: email,
                            editableUsername: false,
                            startingInstances: false,
                            checkingLicense: false,
                            licenseError: null,
                            needsLicenseUpload: false,
                            managementServerNotFound: false,
                            stoppedInstances: [],
                            splunkValidationTimer: 0,
                            splunkValidationInProgress: false,
                            splunkValidationResults: null,
                            showProceedAfterTimer: false,
                            splunkServerStatus: [],
                            showSplunkStatus: false,
                            licenseValidationComplete: false,
                            finalConfigurationInProgress: false,
                            finalConfigurationComplete: false,
                            configurationResponse: null,
                          })
                        }}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white rounded-md transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        title="Configure Cluster"
                      >
                        <Database size={14} className="sm:w-4 sm:h-4" />
                        <span>Configure Cluster</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleExpiryColumn(serviceType)
                      }}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      title={`${showExpiryColumn[serviceType] ? "Hide" : "Show"} Expiry`}
                    >
                      {showExpiryColumn[serviceType] ? (
                        <EyeOff size={14} className="sm:w-4 sm:h-4" />
                      ) : (
                        <Eye size={14} className="sm:w-4 sm:h-4" />
                      )}
                      <span>Expiry</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const newState = !allUsageRowsExpanded
                        serviceInstances.forEach((inst) => {
                          setExpandedUsageRows((prev) => ({
                            ...prev,
                            [inst.InstanceId]: newState,
                          }))
                        })
                      }}
                      className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                      title="Toggle Usage Details"
                    >
                      {allUsageRowsExpanded ? (
                        <EyeOff size={14} className="sm:w-4 sm:h-4 transition-transform duration-300" />
                      ) : (
                        <Eye size={14} className="sm:w-4 sm:h-4 transition-transform duration-300" />
                      )}
                      <span className="hidden sm:inline">More Details</span>
                      <span className="sm:hidden">Details</span>
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
                  <ServiceTable
                    serviceType={serviceType}
                    instances={serviceInstances}
                    showExpiryColumn={showExpiryColumn[serviceType]}
                    selectedInstances={selectedInstances}
                    expandedCredentials={expandedCredentials}
                    expandedUsageRows={expandedUsageRows}
                    disabledButtons={disabledButtons}
                    loadingAction={loadingAction}
                    copiedField={copiedField}
                    passwordModal={passwordModal}
                    isPasswordRateLimited={isPasswordRateLimited}
                    passwordClickCount={passwordClickCount}
                    remainingTime={remainingTime}
                    onSelectAll={handleSelectAllForServiceType}
                    onInstanceSelection={handleInstanceSelection}
                    onToggleCredentials={toggleCredentials}
                    onToggleUsageDetails={toggleUsageDetails}
                    onAction={handleButtonClick}
                    onGetPassword={handleGetPassword}
                    onExtendValidity={handleExtendValidity}
                    renderCopyField={renderCopyField}
                    renderButton={renderButton}
                    getInstanceExpiryDate={getInstanceExpiryDate}
                    getInstanceUsageDetails={getInstanceUsageDetails}
                    getNotificationUrgency={getNotificationUrgency}
                    getNotificationTooltip={getNotificationTooltip}
                    formatRemainingTime={formatRemainingTime}
                    formatFloatHours={formatFloatHours}
                    fetchUsageSummary={fetchUsageSummary}
                    isRefreshingUsage={isRefreshingUsage}
                    MAX_PASSWORD_CLICKS={MAX_PASSWORD_CLICKS}
                    allSelectedInService={allSelectedInService}
                    someSelectedInService={someSelectedInService}
                  />
                </div>
              </div>
            )
          })}
        </>
      )}

      <PasswordModal
        passwordModal={passwordModal}
        setPasswordModal={setPasswordModal}
        isPasswordRateLimited={isPasswordRateLimited}
        remainingTime={remainingTime}
        formatRemainingTime={formatRemainingTime}
        copiedField={copiedField}
        setCopiedField={setCopiedField}
      />

      <Dialog
        open={clusterConfigModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseClusterModal()
          }
        }}
      >
        <DialogContent
          className="w-[95vw] max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
          onPointerDownOutside={(e) => {
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader className="relative bg-gradient-to-r from-yellow-50 to-yellow-100 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl flex-shrink-0">
            <div className="text-center pr-12">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Cluster Configuration
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                Configure your Splunk cluster deployment
              </DialogDescription>
            </div>
          </DialogHeader>

          <div
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6"
            onWheel={(e) => {
              e.stopPropagation()
            }}
          >
            {clusterConfigModal.success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Database className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Successfully Triggered Cluster Configuration!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Your Splunk cluster configuration has been initiated. All cluster control buttons are now disabled for
                  20 minutes.
                </p>
                {clusterInstancesFreeze.frozen && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Cluster controls frozen for: {Math.floor(clusterInstancesFreeze.remainingTime / 60)}m{" "}
                      {clusterInstancesFreeze.remainingTime % 60}s
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {clusterConfigModal.error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Error:</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{clusterConfigModal.error}</p>

                        {/* Show stopped servers list if any */}
                        {clusterConfigModal.stoppedInstances.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                              Servers to be started:
                            </p>
                            <ul className="space-y-1">
                              {clusterConfigModal.stoppedInstances.map((instance) => (
                                <li key={instance.InstanceId} className="text-sm text-red-700 dark:text-red-300">
                                  • {instance.Name} ({instance.State})
                                </li>
                              ))}
                            </ul>
                            <Button
                              onClick={() => handleStartAllInstances(clusterConfigModal.stoppedInstances)}
                              className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
                              disabled={clusterConfigModal.startingInstances}
                            >
                              {clusterConfigModal.startingInstances ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Starting Servers...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start All Servers
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {clusterConfigModal.licenseError && !clusterConfigModal.licenseValidationComplete && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">License Validation Error:</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{clusterConfigModal.licenseError}</p>

                        {clusterConfigModal.needsLicenseUpload && (
                          <div className="mt-3">
                            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                              Please update your Splunk license on the management server:
                            </p>
                            <ol className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4">
                              <li>1. Access Splunk Web UI on your management server</li>
                              <li>2. Go to Settings → Licensing</li>
                              <li>3. Upload your Splunk Enterprise license file</li>
                              <li>4. Restart Splunk service</li>
                              <li>5. Try validation again</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {clusterConfigModal.splunkValidationInProgress && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Validating Splunk installation on all cluster servers...
                      </p>
                    </div>
                  </div>
                )}

                {clusterConfigModal.showSplunkStatus && clusterConfigModal.splunkServerStatus.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                      Splunk Installation Status: <br />
                      <span className="text-xs font-light text-gray-400">
                        Please wait some time. If you started your servers just now, it may take a minute for Splunk to
                        start.
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {clusterConfigModal.splunkServerStatus.map((server, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {server.instanceName}
                            </p>
                            <p className="text-xs text-gray-500">{server.ip}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {server.status === "UP" ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                ✓ Splunk Installed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                ✗ Not Installed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show install/retry buttons for DOWN servers */}
                    {clusterConfigModal.splunkServerStatus.some((server) => server.status === "DOWN") && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          onClick={retrySplunkValidation}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={clusterConfigModal.splunkValidationInProgress}
                        >
                          {clusterConfigModal.splunkValidationInProgress ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            "Retry Validation"
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Show proceed button if all servers are UP */}
                    {clusterConfigModal.splunkServerStatus.every((server) => server.status === "UP") &&
                      !clusterConfigModal.licenseValidationComplete && (
                        <div className="mt-3">
                          <Button
                            onClick={proceedToLicenseValidation}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={clusterConfigModal.checkingLicense}
                          >
                            {clusterConfigModal.checkingLicense ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Validating License...
                              </>
                            ) : (
                              "Proceed to License Validation"
                            )}
                          </Button>
                        </div>
                      )}
                  </div>
                )}

                {clusterConfigModal.licenseValidationComplete && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Splunk license validation completed successfully!
                      </p>
                    </div>
                    <Button
                      onClick={triggerClusterConfiguration}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                      disabled={clusterConfigModal.finalConfigurationInProgress}
                    >
                      {clusterConfigModal.finalConfigurationInProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Configuring Cluster...
                        </>
                      ) : (
                        "Trigger Cluster Configuration"
                      )}
                    </Button>
                  </div>
                )}

                {clusterConfigModal.finalConfigurationInProgress && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">Triggering cluster configuration...</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username:</label>
                    <input
                      type="text"
                      value={clusterConfigModal.username}
                      onChange={(e) =>
                        setClusterConfigModal((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      disabled={true} // Always disabled as requested
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Auto-detected from your cluster instances
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email:</label>
                    <input
                      type="email"
                      value={clusterConfigModal.email}
                      onChange={(e) =>
                        setClusterConfigModal((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      disabled={true} // Always disabled as requested
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your logged-in email address</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              {clusterConfigModal.success ? (
                <Button
                  onClick={handleCloseClusterModal}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCloseClusterModal}
                    variant="outline"
                    disabled={clusterConfigModal.loading || clusterConfigModal.finalConfigurationInProgress}
                    className="px-6 py-2 bg-transparent"
                  >
                    Cancel
                  </Button>
                  {!clusterConfigModal.showSplunkStatus && !clusterConfigModal.licenseValidationComplete && (
                    <Button
                      onClick={handleClusterConfigSubmit}
                      disabled={
                        clusterConfigModal.loading ||
                        clusterConfigModal.checkingLicense ||
                        clusterConfigModal.splunkValidationInProgress ||
                        !clusterConfigModal.username ||
                        !clusterConfigModal.email
                      }
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      {clusterConfigModal.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        "Start Validation"
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExtendValidityModal extendValidityModal={extendValidityModal} setExtendValidityModal={setExtendValidityModal} />

      <InstallSplunkModal installSplunkModal={installSplunkModal} setInstallSplunkModal={setInstallSplunkModal} />
    </div>
  )
}

export default EC2Table
