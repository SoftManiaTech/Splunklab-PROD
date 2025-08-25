"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface InstallSplunkModalState {
  isOpen: boolean
}

interface InstallSplunkModalProps {
  installSplunkModal: InstallSplunkModalState
  setInstallSplunkModal: React.Dispatch<React.SetStateAction<InstallSplunkModalState>>
  instances?: Array<{
    InstanceId: string
    Name: string
    PublicIp: string
    State: string
  }>
}

const InstallSplunkModal: React.FC<InstallSplunkModalProps> = ({
  installSplunkModal,
  setInstallSplunkModal,
  instances = [],
}) => {
  const handleClose = () => {
    setInstallSplunkModal({ isOpen: false })
  }

  const managementServer = instances.find(
    (instance) => instance.Name.includes("Management_server") && instance.State.toLowerCase() === "running",
  )
  const managementServerIp = managementServer?.PublicIp || "<management-server-ip>"
  const splunkUrl = `http://${managementServerIp}:8000`

  const handleNavigateToSplunk = () => {
    if (managementServer?.PublicIp) {
      window.open(splunkUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <Dialog open={installSplunkModal.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-[95vw] max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative bg-gradient-to-r from-orange-50 to-red-100 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl flex-shrink-0">
          <div className="text-center pr-12">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Splunk License Installation Guide
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Follow these steps to install your Splunk license on the Management Server
            </DialogDescription>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">Prerequisites</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc list-inside">
                <li>Ensure your Management Server is running</li>
                <li>Have your Splunk license file (.lic) ready</li>
                <li>Access to the Management Server via RDP or SSH</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Step-by-Step Installation</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 1: Access Management Server</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connect to your Management Server using RDP (Windows) or SSH (Linux)
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 2: Open Splunk Web Interface</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Navigate to{" "}
                    <div className="flex items-center gap-2 mt-2">
                      <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                        {managementServer?.PublicIp ? splunkUrl : "http://<management-server-ip>:8000"}
                      </code>
                      {managementServer?.PublicIp && (
                        <Button
                          onClick={handleNavigateToSplunk}
                          size="sm"
                          variant="outline"
                          className="px-2 py-1 h-auto text-xs flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                          title="Open Splunk Web Interface"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </Button>
                      )}
                    </div>
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 3: Login to Splunk</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Use credentials: <strong>admin / admin123</strong>
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 4: Navigate to License Manager</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Go to <strong>Settings → Licensing → Add License</strong>
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 5: Upload License File</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Click "Choose File" and select your .lic file, then click "Install"
                  </p>
                </div>

                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Step 6: Restart Splunk</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Restart Splunk service to apply the new license
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">Verification</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                After installation, verify the license is active by checking <strong>Settings → Licensing</strong>. The
                license should show as "Active" with the correct volume and expiration date.
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                If you encounter any issues during license installation, please contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <Button
              onClick={handleClose}
              className="px-8 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            >
              Close Guide
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InstallSplunkModal
