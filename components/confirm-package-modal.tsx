"use client"

import { useMemo, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import type { CartItem } from "./cart-sidebar"

interface ConfirmPackageModalProps {
  isOpen: boolean
  onClose: () => void
  onPreviousStep: () => void
  onConfirm: () => void
  cartItems: CartItem[]
  currentStep: number // Added currentStep for progress indicator
}

export function ConfirmPackageModal({
  isOpen,
  onClose,
  onPreviousStep,
  onConfirm,
  cartItems,
  currentStep,
}: ConfirmPackageModalProps) {
  const [policyConfirmed, setPolicyConfirmed] = useState(false)

  const totalHours = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.hours, 0)
  }, [cartItems])

  const combinedTitle = useMemo(() => {
    return cartItems.map((item) => item.title).join(", ")
  }, [cartItems])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      document.body.style.overflow = "hidden"
      document.body.style.paddingRight = "0px"

      const preventBodyScroll = (e: WheelEvent) => {
        const target = e.target as Element
        const modalContent = document.querySelector("[data-modal-content]")

        if (modalContent && !modalContent.contains(target)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      const preventTouchScroll = (e: TouchEvent) => {
        const target = e.target as Element
        const modalContent = document.querySelector("[data-modal-content]")

        if (modalContent && !modalContent.contains(target)) {
          e.preventDefault()
        }
      }

      document.addEventListener("wheel", preventBodyScroll, { passive: false })
      document.addEventListener("touchmove", preventTouchScroll, { passive: false })

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight

        document.removeEventListener("wheel", preventBodyScroll)
        document.removeEventListener("touchmove", preventTouchScroll)
      }
    }
  }, [isOpen])

  // Reset checkbox state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPolicyConfirmed(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] sm:w-[500px] flex flex-col bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <DialogHeader className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 pb-4 border-b border-green-100 dark:border-gray-600">
          <div className="text-center pr-12">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentStep === 2 ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentStep === 3 ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Confirm Your Package
            </DialogTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              You are about to purchase:{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">{combinedTitle}</span>
            </p>
          </div>
        </DialogHeader>

        <div
          data-modal-content
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent hover:scrollbar-thumb-green-300 p-6"
          onWheel={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Validity Information:</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Your server will be terminated based on whichever limit is reached first:</li>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>The total hours you purchased.</li>
                    <li>A maximum number of days, which is approximately half of your purchased hours.</li>
                  </ul>
                </ul>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={policyConfirmed}
                onCheckedChange={(checked) => setPolicyConfirmed(!!checked)}
                className="h-5 w-5 border-gray-300 dark:border-gray-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
              />
              <label
                htmlFor="terms"
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 py-0 tracking-normal text-xs font-medium leading-[1.1rem]"
              >
                I understand and agree to{" "}
                <Link href="/terms" className="text-green-600 hover:underline" target="_blank">
                  terms and conditions
                </Link>{" "}
                and{" "}
                <Link href="/refund" className="text-green-600 hover:underline" target="_blank">
                  refund policy
                </Link>
                .
              </label>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose} // Changed to onClose to directly close the modal
              className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!policyConfirmed || cartItems.length === 0}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
