"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, X } from "lucide-react"
import type { CartItem } from "./cart-sidebar" // Import CartItem type

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id?: string
  prefill: {
    name: string
    email: string
    contact: string
  }
  notes: {
    environment: string // This will now be a JSON string of the array
    splunk_install?: string
    botsv3_dataset?: string
    name?: string // Added name to notes
    cart_items_summary: string // New: summary of cart items
    cart_components_summary?: string // New: summary of components
  }
  theme: {
    color: string
  }
  handler: (response: any) => void
  modal: {
    ondismiss: () => void
  }
}

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayCheckoutProps {
  isOpen: boolean
  onClose: () => void
  onPreviousStep: () => void
  amount: number
  packageDetails: {
    envTitle: string // Combined title from cart
    envId: string // Combined IDs from cart
    items: CartItem[] // Full cart items array
  } | null // Can be null if cart is empty
  onSuccess: (response: any) => void
  onError: (error: any) => void
  currentStep: number
}

export function RazorpayCheckout({
  isOpen,
  onClose,
  onPreviousStep,
  amount,
  packageDetails,
  onSuccess,
  onError,
  currentStep,
}: RazorpayCheckoutProps) {
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [userPhone, setUserPhone] = useState("")
  const [splunkInstall, setSplunkInstall] = useState<"yes" | "no" | "">("")
  const [botsv3Dataset, setBotsv3Dataset] = useState<"yes" | "no" | "">("")
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Determine if any Splunk package is in the cart
  const hasSplunkPackage = packageDetails?.items.some((item) => item.type === "splunk") || false
  // Determine if a clustered Splunk package is in the cart
  const hasClusteredSplunkPackage = packageDetails?.items.some((item) => item.id === "clustered") || false

  const getEnvironmentName = (envId: string, itemAmount: number): string => {
    switch (envId) {
      case "standalone":
        return `Splunk-SE-${itemAmount}.template`
      case "distributed":
        return `Splunk-DNC-${itemAmount}.template`
      case "clustered":
        return `Splunk-DC-${itemAmount}.template`
      case "syslog-ng":
        return `syslog-${itemAmount}.template`
      case "mysql-logs":
        return `mysql-${itemAmount}.template`
      case "mssql-logs":
        return `mssql-${itemAmount}.template`
      case "windows-ad-dns":
        return `winadns-${itemAmount}.template`
      case "linux-data-sources":
        return `linux-${itemAmount}.template`
      case "ossec":
        return `ossec-${itemAmount}.template`
      case "jenkins":
        return `jenkins-${itemAmount}.template`
      // Removed "all-security-data-sources" case
      default:
        return `package-${itemAmount}.template`
    }
  }

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

  useEffect(() => {
    if (isOpen) {
      setUserName("")
      setUserEmail("")
      setUserPhone("")
      setSplunkInstall("")
      setBotsv3Dataset("")
      setFormError(null)
    }
  }, [isOpen])

  const handleProceed = async () => {
    setFormError(null)
    if (!userName || !userEmail || !userPhone) {
      setFormError("Please fill in all common details.")
      return
    }

    if (hasSplunkPackage) {
      if (!splunkInstall) {
        setFormError("Please fill in the Splunk Installation field.")
        return
      }
      if (!hasClusteredSplunkPackage && !botsv3Dataset) {
        setFormError("Please fill in the BotsV3 Dataset field.")
        return
      }
    }

    setLoading(true)

    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.message || "Failed to create Razorpay order.")
      }

      const order = await orderResponse.json()

      const allComponents = packageDetails?.items.flatMap((item) => item.components || []) || []
      const uniqueComponents = Array.from(new Set(allComponents))

      // Generate the array of environment templates
      const environmentTemplates = packageDetails?.items.map((item) => getEnvironmentName(item.id, item.amount)) || []

      const notes: any = {
        environment: JSON.stringify(environmentTemplates), // Send as JSON string to Razorpay
        name: userName,
        cart_items_summary:
          packageDetails?.items.map((item) => `${item.title} (₹${item.amount}, ${item.hours}h)`).join("; ") || "N/A",
        cart_components_summary: uniqueComponents.length > 0 ? uniqueComponents.join(", ") : "N/A",
      }

      if (hasSplunkPackage) {
        notes.splunk_install = splunkInstall
        if (!hasClusteredSplunkPackage) {
          notes.botsv3_dataset = botsv3Dataset
        }
      }

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: amount * 100,
        currency: "INR",
        name: "Splunk Lab Environments",
        description: packageDetails?.envTitle || "Selected Lab Packages",
        order_id: order.id,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        notes: notes,
        theme: {
          color: "#16a34a",
        },
        handler: (response: any) => {
          onSuccess({
            ...response,
            userDetails: {
              name: userName,
              email: userEmail,
              phone: userPhone,
              splunk_install: splunkInstall,
              botsv3_dataset: botsv3Dataset,
              environment: environmentTemplates, // Pass the actual array here
            },
          })
          setLoading(false)
          onClose()
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            onClose()
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response: any) => {
        onError(response.error)
        setLoading(false)
        onClose()
      })
      rzp.open()
    } catch (err: any) {
      console.error("Error during payment process:", err)
      setFormError(err.message || "An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        // Razorpay script loaded
      }
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 pb-4 border-b border-green-100 dark:border-gray-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/80 dark:hover:bg-gray-600/80 transition-colors duration-200 group"
          >
            <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200" />
          </button>

          <div className="text-center pr-12">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentStep === 1 ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  currentStep === 2 ? "bg-green-600" : "bg-gray-300"
                }`}
              ></div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
              Enter Your Details
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
              Please provide your information to proceed with the payment
            </p>
          </div>
        </div>

        <div
          data-modal-content
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-green-200 scrollbar-track-transparent hover:scrollbar-thumb-green-300 p-6"
          onWheel={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
              >
                Full Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 focus:shadow-lg focus:shadow-green-100 dark:focus:shadow-green-900/20 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
              >
                Email Address <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 focus:shadow-lg focus:shadow-green-100 dark:focus:shadow-green-900/20 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
              >
                Phone Number <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 focus:shadow-lg focus:shadow-green-100 dark:focus:shadow-green-900/20 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
              />
            </div>

            {hasSplunkPackage && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="splunk-install"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                  >
                    Splunk Installation <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={splunkInstall} onValueChange={(value: "yes" | "no") => setSplunkInstall(value)}>
                    <SelectTrigger
                      id="splunk-install"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 focus:shadow-lg focus:shadow-green-100 dark:focus:shadow-green-900/20 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
                    >
                      <SelectValue placeholder="Do you want Splunk to be installed?" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-xl">
                      <SelectItem value="yes" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                        yes
                      </SelectItem>
                      <SelectItem value="no" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                        no
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!hasClusteredSplunkPackage && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="botsv3-dataset"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center"
                    >
                      BotsV3 Dataset <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select value={botsv3Dataset} onValueChange={(value: "yes" | "no") => setBotsv3Dataset(value)}>
                      <SelectTrigger
                        id="botsv3-dataset"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-0 focus:border-green-500 dark:focus:border-green-400 focus:shadow-lg focus:shadow-green-100 dark:focus:shadow-green-900/20 transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-500"
                      >
                        <SelectValue placeholder="Include BotsV3 dataset?" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-xl">
                        <SelectItem value="yes" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                          yes
                        </SelectItem>
                        <SelectItem value="no" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                          no
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
          {formError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{formError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={onPreviousStep}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold"
            >
              Previous
            </Button>
            <Button
              onClick={handleProceed}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
