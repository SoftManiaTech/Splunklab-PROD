"use client"

import React from "react"
import { useEffect, useState } from "react"
import axios from "axios"
import { Copy, Loader2, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react" // Import Chevron icons
import { logToSplunk } from "@/lib/splunklogger"

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

const EC2Table: React.FC<EC2TableProps> = ({ email, instances, setInstances, loading }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string

  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({})
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({}) // State to manage expanded rows

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
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <span style={{ marginRight: 6 }}>{text}</span>
      <div
        onClick={() => handleCopy(text, fieldId)}
        style={{
          cursor: "pointer",
          padding: 2,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
          border: "1px solid #e2e8f0",
        }}
      >
        <Copy size={14} color="#4b5563" />
      </div>
      {copiedField === fieldId && (
        <div
          style={{
            position: "absolute",
            top: "-20px",
            left: 0,
            backgroundColor: "#10b981",
            color: "white",
            fontSize: "0.7rem",
            padding: "2px 6px",
            borderRadius: 4,
            whiteSpace: "nowrap",
          }}
        >
          Copied!
        </div>
      )}
    </div>
  )

  const baseStyle: React.CSSProperties = {
    padding: "6px 14px",
    marginRight: "6px",
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
                          {inst.State === "running" && inst.PublicIp && inst.SSHCommand
                            ? renderCopyField(inst.SSHCommand, `${inst.InstanceId}_ssh`)
                            : "-"}
                        </td>
                        <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                          {!isMutedState && isStopped && renderButton("Start", "start", inst.InstanceId)}
                          {!isMutedState && isRunning && (
                            <>
                              {renderButton("Stop", "stop", inst.InstanceId)}
                              {renderButton("Reboot", "reboot", inst.InstanceId)}
                            </>
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
    </div>
  )
}

export default EC2Table
