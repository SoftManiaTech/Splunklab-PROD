import type React from "react"
export interface EC2Instance {
  Name: string
  InstanceId: string
  State: string
  PrivateIp: string
  PublicIp: string
  SSHCommand: string
  Region: string
  ServiceType: string
  PublicIpAddress?: string
}

export interface ClusterInstance {
  InstanceId: string
  Name: string
  State: string
  PublicIpAddress?: string
  PrivateIpAddress?: string
  [key: string]: any
}

export interface SplunkValidationResult {
  ip: string
  status: "UP" | "DOWN"
  details: string
}

export interface EC2TableProps {
  email: string
  instances: EC2Instance[]
  setInstances: React.Dispatch<React.SetStateAction<EC2Instance[]>>
  loading: boolean
  rawUsageSummary: any[]
  fetchUsageSummary: () => Promise<void>
  isRefreshingUsage: boolean
  hasLab: boolean
  onPasswordModalOpenChange?: (isOpen: boolean) => void
}
