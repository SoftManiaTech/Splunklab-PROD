"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Eye, EyeOff } from "lucide-react"
import type { PasswordModalState } from "./types"

interface PasswordModalProps {
  passwordModal: PasswordModalState
  setPasswordModal: React.Dispatch<React.SetStateAction<PasswordModalState>>
  isPasswordRateLimited: boolean
  remainingTime: number
  formatRemainingTime: (seconds: number) => string
  copiedField: string | null
  setCopiedField: React.Dispatch<React.SetStateAction<string | null>>
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  passwordModal,
  setPasswordModal,
  isPasswordRateLimited,
  remainingTime,
  formatRemainingTime,
  copiedField,
  setCopiedField,
}) => {
  const [showPassword, setShowPassword] = React.useState(false)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const handleClose = () => {
    setPasswordModal({
      isOpen: false,
      loading: false,
      error: null,
      details: null,
    })
    setShowPassword(false)
  }

  return (
    <Dialog open={passwordModal.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-[200vw] max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[100vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative bg-gradient-to-r from-blue-50 to-indigo-100 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl flex-shrink-0">
          <div className="text-center pr-12">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Windows Credentials</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Use these credentials to access your Windows server
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6">
            {passwordModal.loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">Fetching credentials...</span>
              </div>
            ) : passwordModal.error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200 text-sm">{passwordModal.error}</p>
              </div>
            ) : isPasswordRateLimited ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Rate Limit Reached</h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                  You've reached the maximum number of password requests. Please wait before trying again.
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-800/30 rounded-lg p-3">
                  <p className="text-yellow-800 dark:text-yellow-200 font-mono text-lg text-center">
                    {formatRemainingTime(remainingTime)}
                  </p>
                  <p className="text-yellow-600 dark:text-yellow-400 text-xs text-center mt-1">Time remaining</p>
                </div>
              </div>
            ) : passwordModal.details ? (
              <div className="space-y-4">
                {passwordModal.details.publicIp && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Server IP:
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded text-sm font-mono">
                        {passwordModal.details.publicIp}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(passwordModal.details!.publicIp!, "ip")}
                        size="sm"
                        variant="outline"
                        className="px-3 flex-shrink-0"
                      >
                        {copiedField === "ip" ? "Copied!" : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                  <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">Username:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded text-sm font-mono">
                      {passwordModal.details.username}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(passwordModal.details!.username, "username")}
                      size="sm"
                      variant="outline"
                      className="px-3 flex-shrink-0"
                    >
                      {copiedField === "username" ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <label className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                    Password:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 relative">
                      <code className="block w-full px-3 py-2 pr-12 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded text-sm font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                        {showPassword ? passwordModal.details.password : "••••••••••••"}
                      </code>
                    </div>
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      size="sm"
                      variant="outline"
                      className="px-3 flex-shrink-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => copyToClipboard(passwordModal.details!.password, "password")}
                      size="sm"
                      variant="outline"
                      className="px-3 flex-shrink-0"
                    >
                      {copiedField === "password" ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Connection Instructions:</h3>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Open Remote Desktop Connection (RDP)</li>
                    <li>Enter the server IP address</li>
                    <li>Use the provided username and password</li>
                    <li>Click "Connect" to access your Windows server</li>
                  </ol>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <Button
              onClick={handleClose}
              className="px-8 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PasswordModal
