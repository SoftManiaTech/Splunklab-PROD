"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Database } from "lucide-react"
import type { EC2Instance } from "../types"

interface ClusterActionsProps {
  serviceType: string
  serviceInstances: EC2Instance[]
  hasCompleteClusterSet: (instances: EC2Instance[]) => { hasComplete: boolean; username: string | null }
  onClusterConfiguration: (instances: EC2Instance[]) => Promise<void>
}

const ClusterActions: React.FC<ClusterActionsProps> = ({
  serviceType,
  serviceInstances,
  hasCompleteClusterSet,
  onClusterConfiguration,
}) => {
  if (serviceType !== "Splunk") return null

  const clusterInfo = hasCompleteClusterSet(serviceInstances)
  if (!clusterInfo.hasComplete) return null

  return (
    <div className="mb-4 flex justify-end">
      <Button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClusterConfiguration(serviceInstances)
        }}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        size="sm"
      >
        <Database className="w-4 h-4 mr-2" />
        Configure Splunk Cluster
      </Button>
    </div>
  )
}

export default ClusterActions
