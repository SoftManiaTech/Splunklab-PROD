"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface ExtendValidityModalState {
  isOpen: boolean
  instanceId: string
  instanceName: string
  endDate: string
}

interface ExtendValidityModalProps {
  extendValidityModal: ExtendValidityModalState
  setExtendValidityModal: React.Dispatch<React.SetStateAction<ExtendValidityModalState>>
}

const ExtendValidityModal: React.FC<ExtendValidityModalProps> = ({ extendValidityModal, setExtendValidityModal }) => {
  const handleClose = () => {
    setExtendValidityModal({
      isOpen: false,
      instanceId: "",
      instanceName: "",
      endDate: "",
    })
  }

  return (
    <Dialog open={extendValidityModal.isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="w-[95vw] max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="relative bg-gradient-to-r from-yellow-50 to-yellow-100 dark:bg-gray-800 p-6 pb-4 rounded-t-2xl flex-shrink-0">
          <div className="text-center pr-12">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Extend Validity</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Extend your server quota and validity period
            </DialogDescription>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 p-6"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Quota Increase Options</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <p>To extend your server validity, you can:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Chat with our support team directly on WhatsApp</li>
                  <li>Request validity extension based on your needs</li>
                  <li>Pay for additional quota hours to increase your limit</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Quick Support</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Get instant help from our support team via WhatsApp for quota extension and validity increase.
              </p>
              <a
                href="https://chat.whatsapp.com/CsWBpBxMyDO3bV2Rz9r39H"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm"
                onClick={() => {}}
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-center">
            <Button onClick={handleClose} variant="outline" className="px-8 py-2 bg-transparent">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExtendValidityModal
