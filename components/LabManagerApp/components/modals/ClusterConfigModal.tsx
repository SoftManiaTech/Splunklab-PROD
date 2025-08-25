"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface ClusterConfigModalState {
  isOpen: boolean
  loading: boolean
  error: string | React.ReactNode | null
  success: boolean
  username: string
  email: string
  editableUsername: boolean
  startingInstances: boolean
  checkingLicense: boolean
  licenseError: string | null
  needsLicenseUpload: boolean
  managementServerNotFound: boolean
  stoppedInstances: any[]
  splunkValidationTimer: number
  splunkValidationInProgress: boolean
  splunkValidationResults: any
  showProceedAfterTimer: boolean
  splunkServerStatus: Array<{
    ip: string
    status: string
    details: string
    instanceName?: string
  }>
  showSplunkStatus: boolean
  licenseValidationComplete: boolean
  finalConfigurationInProgress: boolean
  finalConfigurationComplete: boolean
  configurationResponse: any
}

interface ClusterConfigModalProps {
  clusterConfigModal: ClusterConfigModalState
  setClusterConfigModal: React.Dispatch<React.SetStateAction<ClusterConfigModalState>>
  clusterInstancesFreeze: {
    frozen: boolean
    freezeEndTime: number | null
    remainingTime: number
  }
  formatRemainingTime: (seconds: number) => string
  onSubmit: () => Promise<void>
  onClose: () => void
  onRetryValidation: () => Promise<void>
  onProceedToLicense: () => Promise<void>
  onTriggerConfiguration: () => Promise<void>
  setInstallSplunkModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean }>>
}

const ClusterConfigModal: React.FC<ClusterConfigModalProps> = ({
  clusterConfigModal,
  setClusterConfigModal,
  clusterInstancesFreeze,
  formatRemainingTime,
  onSubmit,
  onClose,
  onRetryValidation,
  onProceedToLicense,
  onTriggerConfiguration,
  setInstallSplunkModal,
}) => {
  return (
    <Dialog open={clusterConfigModal.isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative bg-gradient-to-r from-purple-50 to-indigo-100 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl flex-shrink-0">
          <div className="text-center pr-12">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Splunk Cluster Configuration
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Configure and validate your Splunk cluster setup
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6">
          {clusterConfigModal.error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-red-800 dark:text-red-200 text-sm">
                  {typeof clusterConfigModal.error === "string" ? clusterConfigModal.error : clusterConfigModal.error}
                </div>
              </div>
            </div>
          )}

          {clusterInstancesFreeze.frozen && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-3" />
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Cluster instances are temporarily frozen
                </p>
              </div>
              <p className="text-orange-700 dark:text-orange-300 text-sm mb-3">
                Configuration is in progress. Please wait for the process to complete.
              </p>
              <div className="bg-orange-100 dark:bg-orange-800/30 rounded-lg p-3">
                <p className="text-orange-800 dark:text-orange-200 font-mono text-lg text-center">
                  {formatRemainingTime(clusterInstancesFreeze.remainingTime)}
                </p>
                <p className="text-orange-600 dark:text-orange-400 text-xs text-center mt-1">Time remaining</p>
              </div>
            </div>
          )}

          {clusterConfigModal.success && clusterConfigModal.finalConfigurationComplete && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Cluster configuration completed successfully!
                </p>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Your Splunk cluster has been configured and is ready for use. All instances are now frozen for 25
                minutes to allow the configuration to complete.
              </p>
            </div>
          )}

          {!clusterConfigModal.success && (
            <>
              {clusterConfigModal.startingInstances && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">Starting stopped instances...</p>
                  </div>
                </div>
              )}

              {clusterConfigModal.splunkValidationInProgress && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">Validating Splunk installation...</p>
                  </div>
                </div>
              )}

              {clusterConfigModal.showSplunkStatus && clusterConfigModal.splunkServerStatus.length > 0 && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Splunk Server Status:</h3>
                  <div className="space-y-2">
                    {clusterConfigModal.splunkServerStatus.map((server, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {server.instanceName || `Server ${index + 1}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{server.ip}</p>
                          {server.details && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{server.details}</p>
                          )}
                        </div>
                        <div className="ml-4">
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
                        onClick={onRetryValidation}
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
                          onClick={onProceedToLicense}
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
                    onClick={onTriggerConfiguration}
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
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={clusterConfigModal.loading || clusterConfigModal.finalConfigurationInProgress}
                  className="px-6 py-2 bg-transparent"
                >
                  Cancel
                </Button>
                {!clusterConfigModal.showSplunkStatus && !clusterConfigModal.licenseValidationComplete && (
                  <Button
                    onClick={onSubmit}
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
  )
}

export default ClusterConfigModal
