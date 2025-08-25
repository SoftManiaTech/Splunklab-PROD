"use client"

import type React from "react"
import InstanceRow from "./InstanceRow"
import type { EC2Instance } from "../types"

interface ServiceTableProps {
  serviceType: string
  instances: EC2Instance[]
  showExpiryColumn: boolean
  selectedInstances: Set<string>
  expandedCredentials: Record<string, boolean>
  expandedUsageRows: Record<string, boolean>
  disabledButtons: Record<string, boolean>
  loadingAction: string | null
  copiedField: string | null
  passwordModal: {
    loading: boolean
  }
  isPasswordRateLimited: boolean
  passwordClickCount: number
  remainingTime: number
  onSelectAll: (serviceType: string, checked: boolean) => void
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
  allSelectedInService: boolean
  someSelectedInService: boolean
}

const ServiceTable: React.FC<ServiceTableProps> = ({
  serviceType,
  instances,
  showExpiryColumn,
  selectedInstances,
  expandedCredentials,
  expandedUsageRows,
  disabledButtons,
  loadingAction,
  copiedField,
  passwordModal,
  isPasswordRateLimited,
  passwordClickCount,
  remainingTime,
  onSelectAll,
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
  allSelectedInService,
  someSelectedInService,
}) => {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        minWidth: showExpiryColumn ? 900 : 800,
        fontSize: "0.95rem",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <thead>
        <tr
          style={{
            backgroundColor: "#f1f5f9",
            textAlign: "left",
          }}
        >
          <th style={{ padding: "10px", width: "40px" }}>
            <input
              type="checkbox"
              checked={allSelectedInService}
              ref={(input) => {
                if (input) input.indeterminate = someSelectedInService
              }}
              onChange={(e) => {
                e.stopPropagation()
                onSelectAll(serviceType, e.target.checked)
              }}
              className="rounded"
            />
          </th>
          <th style={{ padding: "10px" }}>Server Name</th>
          <th style={{ padding: "10px" }}>State</th>
          <th style={{ padding: "10px" }}>Private IP</th>
          <th style={{ padding: "10px" }}>Public IP</th>
          <th style={{ padding: "10px" }}>SSH Command</th>
          {showExpiryColumn && <th style={{ padding: "10px" }}>Expiry</th>}
          <th style={{ padding: "10px" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {instances.map((instance) => (
          <InstanceRow
            key={instance.InstanceId}
            instance={instance}
            isSelected={selectedInstances.has(instance.InstanceId)}
            showExpiryColumn={showExpiryColumn}
            expandedCredentials={expandedCredentials[instance.InstanceId] || false}
            expandedUsageRows={expandedUsageRows[instance.InstanceId] || false}
            disabledButtons={disabledButtons}
            loadingAction={loadingAction}
            copiedField={copiedField}
            passwordModal={passwordModal}
            isPasswordRateLimited={isPasswordRateLimited}
            passwordClickCount={passwordClickCount}
            remainingTime={remainingTime}
            onInstanceSelection={onInstanceSelection}
            onToggleCredentials={onToggleCredentials}
            onToggleUsageDetails={onToggleUsageDetails}
            onAction={onAction}
            onGetPassword={onGetPassword}
            onExtendValidity={onExtendValidity}
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
          />
        ))}
      </tbody>
    </table>
  )
}

export default ServiceTable
