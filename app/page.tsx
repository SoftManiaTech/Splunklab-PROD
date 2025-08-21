"use client"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useMemo } from "react"
import Salesiq from "@/components/salesiq"
import { LabHeader } from "@/components/lab-header"
import { LabFAQ } from "@/components/lab-faq"
import { LabFooter } from "@/components/lab-footer"
import { ContactModal } from "@/components/contact-modal"
import { LabPricingModels } from "@/components/lab-pricing-models"
import { event } from "@/lib/gtag"
import { event as sendToGA4 } from "@/lib/gtag"
import { RazorpayCheckout } from "@/components/razorpay-checkout"
import { CartSidebar, type CartItem } from "@/components/cart-sidebar" // Import CartSidebar and CartItem type
import { ConfirmPackageModal } from "@/components/confirm-package-modal" // Import new ConfirmPackageModal
import { CartDashboard } from "@/components/cart-dashboard" // Import new CartDashboard
// Import the new encryption utilities
import { encryptData, decryptData } from "@/lib/encryption"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react" // Added AlertTriangle icon

// Splunk Logging Integration
const getClientIp = async () => {
  try {
    const res = await fetch("https://api.ipify.org/ip?format=json")
    const data = await res.json()
    return data.ip || "unknown"
  } catch {
    return "unknown"
  }
}

const sendLogToGA4 = async ({
  sessionId = "anonymous-session",
  action = "unknown_action",
  title = "User Event",
  browser = navigator.userAgent,
  ipOverride,
  details = {},
}: {
  sessionId?: string
  action: string
  title?: string
  browser?: string
  ipOverride?: string
  details?: Record<string, any>
}) => {
  try {
    const ip = ipOverride || (await getClientIp())

    const payload: Record<string, any> = {
      title,
      action,
      session: sessionId,
      ip,
      browser,
      timestamp: new Date().toISOString(),
      ...details,
    }

    // ✅ 2. Send to GA4
    sendToGA4({
      action, // e.g., "select_package"
      params: {
        session: sessionId,
        ip,
        browser,
        title,
        ...details,
      },
    })
  } catch (err) {
    console.error("GA4 logging failed:", err)
  }
}

interface SelectedPackageDetails {
  amount: number
  hours: number
  paymentLink: string
  components?: string[]
  envTitle?: string
  envId?: string // Add this line
}

export default function LabEnvironments() {
  const [selectedPricing, setSelectedPricing] = useState<Record<string, { amount: number; days: number }>>({})
  const [showContactModal, setShowContactModal] = useState(false)
  const router = useRouter()
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const [policyConfirmed, setPolicyConfirmed] = useState(false)
  const sessionId = useRef("")
  const sessionStart = useRef(performance.now())

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  // Multi-step flow: 0=closed, 1=cart sidebar, 2=confirm package, 3=customer details (Razorpay)
  const [currentStep, setCurrentStep] = useState(0)
  const popupRef = useRef<HTMLDivElement | null>(null)

  // State for Splunk conflict alert
  const [showSplunkConflictAlert, setShowSplunkConflictAlert] = useState(false)
  const [newSplunkPackageToReplace, setNewSplunkPackageToReplace] = useState<CartItem | null>(null)
  const [existingSplunkPackageToReplace, setExistingSplunkPackageToReplace] = useState<CartItem | null>(null)

  // Calculate total amount for Razorpay from cart items
  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.amount, 0)
  }, [cartItems])

  // Get package details for Razorpay from cart items
  const razorpayPackageDetails = useMemo(() => {
    if (cartItems.length === 0) return null
    // Combine titles for description
    const combinedTitle = cartItems.map((item) => item.title).join(", ")
    // For notes, we might need more detailed info, but for now, just pass the array
    return {
      envTitle: combinedTitle,
      envId: cartItems.map((item) => item.id).join(","), // Comma-separated IDs
      items: cartItems, // Pass the full cart items array
    }
  }, [cartItems])

  useEffect(() => {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    if (!encryptionKey) {
      console.error("NEXT_PUBLIC_ENCRYPTION_KEY is not defined. Cart persistence will not work.")
      return
    }

    const existingSession = sessionStorage.getItem("lab-session-id")
    if (existingSession) {
      sessionId.current = existingSession
    } else {
      const newSession = `SID-${Math.random().toString(36).substring(2, 10)}`
      sessionId.current = newSession
      sessionStorage.setItem("lab-session-id", newSession)
    }

    // Load cart from localStorage
    const loadCart = async () => {
      try {
        const encryptedCart = localStorage.getItem("softmania-cart")
        if (encryptedCart) {
          const decryptedCartString = await decryptData(encryptedCart, encryptionKey)
          if (decryptedCartString) {
            const parsedCart: CartItem[] = JSON.parse(decryptedCartString)
            setCartItems(parsedCart)
          }
        }
      } catch (error) {
        console.error("Failed to load or decrypt cart from localStorage:", error)
        localStorage.removeItem("softmania-cart") // Clear corrupted data
      }
    }

    loadCart()

    sessionStorage.setItem("lab-refreshing", "true")

    const handleBeforeUnload = () => {
      sessionStorage.removeItem("lab-refreshing")

      setTimeout(() => {
        const refreshed = sessionStorage.getItem("lab-refreshing")
        if (!refreshed) {
          const durationInSeconds = Math.floor((performance.now() - sessionStart.current) / 1000)

          navigator.sendBeacon(
            "/api/log",
            JSON.stringify({
              ip: "pending",
              session: sessionId.current,
              event: "User Session Ended",
              action: "user_session_ended",
              title: "User session ended",
              browser: navigator.userAgent,
              extra: {
                durationInSeconds,
                timestamp: new Date().toISOString(),
              },
            }),
          )
        }
      }, 100)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
    if (!encryptionKey) {
      console.error("NEXT_PUBLIC_ENCRYPTION_KEY is not defined. Cart persistence will not work.")
      return
    }

    const saveCart = async () => {
      try {
        const cartString = JSON.stringify(cartItems)
        const encryptedCart = await encryptData(cartString, encryptionKey)
        localStorage.setItem("softmania-cart", encryptedCart)
      } catch (error) {
        console.error("Failed to encrypt or save cart to localStorage:", error)
      }
    }

    saveCart()
  }, [cartItems])

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      // If it's a Splunk package, remove any existing Splunk package
      if (item.type === "splunk") {
        const filteredItems = prevItems.filter((cartItem) => cartItem.type !== "splunk")
        return [...filteredItems, item]
      }
      // If it's a security data source, check if it already exists
      const existingItemIndex = prevItems.findIndex((cartItem) => cartItem.id === item.id)
      if (existingItemIndex > -1) {
        // Update existing item (e.g., if a different tier is selected)
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = item
        return updatedItems
      }
      // Add new item
      return [...prevItems, item]
    })
    // No longer automatically open cart sidebar here, dashboard will appear
    sendLogToGA4({
      sessionId: sessionId.current,
      action: "add_to_cart",
      title: "User added item to cart",
      details: {
        itemId: item.id,
        itemTitle: item.title,
        amount: item.amount,
        hours: item.hours,
        components: item.components, // Log components
      },
    })
  }

  const handleRemoveItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id))
    sendLogToGA4({
      sessionId: sessionId.current,
      action: "remove_from_cart",
      title: "User removed item from cart",
      details: { itemId: id },
    })
  }

  const handleProceedToConfirmPackage = () => {
    if (cartItems.length === 0) return // Should not happen if button is disabled

    sendLogToGA4({
      sessionId: sessionId.current,
      action: "user_clicked_proceed_to_confirm_package",
      title: "User clicked proceed to confirm package from cart",
      details: {
        cartContents: cartItems.map((item) => ({
          id: item.id,
          amount: item.amount,
          hours: item.hours,
          components: item.components,
        })), // Log components
        totalAmount: totalCartAmount,
      },
    })
    setCurrentStep(2) // Open the Confirm Package dialog
  }

  const handleConfirmPackageAndProceedToCheckout = () => {
    sendLogToGA4({
      sessionId: sessionId.current,
      action: "user_confirmed_package_proceed_to_checkout",
      title: "User confirmed package and proceeded to checkout",
      details: {
        cartContents: cartItems.map((item) => ({
          id: item.id,
          amount: item.amount,
          hours: item.hours,
          components: item.components,
        })),
        totalAmount: totalCartAmount,
      },
    })
    setCurrentStep(3) // Open the Razorpay checkout dialog
  }

  const handleRazorpaySuccess = async (response: any) => {
    try {
      const verifyResponse = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      })

      if (verifyResponse.ok) {
        sendLogToGA4({
          sessionId: sessionId.current,
          action: "payment_success_razorpay",
          title: "Razorpay payment success",
          details: {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            userDetails: response.userDetails,
            cartContents: cartItems.map((item) => ({
              id: item.id,
              amount: item.amount,
              hours: item.hours,
              components: item.components,
            })), // Log components
          },
        })

        setCurrentStep(0) // Close all popups
        setShowSuccessPopup(true)
        setCartItems([]) // Clear cart on successful payment

        event({
          action: "payment_success",
          params: {
            source: "LabEnvironments",
            payment_method: "razorpay",
            payment_id: response.razorpay_payment_id,
          },
        })
      } else {
        throw new Error("Payment verification failed")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      handleRazorpayError({ description: "Payment verification failed" })
    }
  }

  const handleRazorpayError = (error: any) => {
    sendLogToGA4({
      sessionId: sessionId.current,
      action: "payment_failure_razorpay",
      title: "Razorpay payment failure",
      details: {
        error: error.description || "Payment failed",
        cartContents: cartItems.map((item) => ({
          id: item.id,
          amount: item.amount,
          hours: item.hours,
          components: item.components,
        })), // Log components
      },
    })

    setCurrentStep(0) // Close all popups

    event({
      action: "payment_failure",
      params: {
        source: "LabEnvironments",
        payment_method: "razorpay",
        error: error.description,
      },
    })

    alert("Payment failed. Please try again.")
  }

  useEffect(() => {
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    const navType = navEntry?.type || (performance as any).navigation?.type

    const isFirstVisit = !sessionStorage.getItem("lab-page-visited")

    if (navType === "reload" || !isFirstVisit) {
      sendLogToGA4({
        sessionId: sessionId.current,
        action: "user_reloaded_environment",
        title: "User reloaded environment",
      })
    } else {
      sendLogToGA4({
        sessionId: sessionId.current,
        action: "user_visited_environment",
        title: "User visited environment",
      })
      sessionStorage.setItem("lab-page-visited", "true")
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("payment") === "success") {
      sendLogToGA4({
        sessionId: sessionId.current,
        action: "payment_success",
        title: "Payment success",
      })
      setShowSuccessPopup(true)
      event({
        action: "payment_success",
        params: { source: "LabEnvironments" },
      })
    }

    if (params.get("payment") === "failure") {
      sendLogToGA4({
        sessionId: sessionId.current,
        action: "payment_failure",
        title: "Payment failure",
      })
      event({
        action: "payment_failure",
        params: { source: "LabEnvironments" },
      })
    }

    const url = new URL(window.location.href)
    url.searchParams.delete("payment")
    window.history.replaceState({}, document.title, url.pathname)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowSuccessPopup(false)
      }
    }

    if (showSuccessPopup) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSuccessPopup])

  // Handler for Splunk conflict from LabPricingModels
  const handleSplunkConflict = (newPackage: CartItem, existingPackage: CartItem) => {
    setNewSplunkPackageToReplace(newPackage)
    setExistingSplunkPackageToReplace(existingPackage)
    setShowSplunkConflictAlert(true)
  }

  // Handler to replace the Splunk package
  const handleReplaceSplunkPackage = () => {
    if (existingSplunkPackageToReplace && newSplunkPackageToReplace) {
      handleRemoveItem(existingSplunkPackageToReplace.id) // Remove the old one
      handleAddToCart(newSplunkPackageToReplace) // Add the new one

      // Show notification for replacement
      // You can add a notification state here similar to lab-pricing-models if needed
    }
    setShowSplunkConflictAlert(false)
    setNewSplunkPackageToReplace(null)
    setExistingSplunkPackageToReplace(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <LabHeader
        onContactClick={() => {
          setShowContactModal(true)
          sendLogToGA4({
            sessionId: sessionId.current,
            action: "user_clicked_contact",
            title: "User clicked contact",
            details: { source: "header_contact" },
          })
        }}
        cartItems={cartItems} // Pass cart items to header
        onOpenCart={() => setCurrentStep(1)} // Open cart sidebar
      />

      <LabPricingModels onAddToCart={handleAddToCart} cartItems={cartItems} onSplunkConflict={handleSplunkConflict} />

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={currentStep === 1}
        onClose={() => setCurrentStep(0)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={handleProceedToConfirmPackage} // Proceed to Confirm Package
      />

      {/* Confirm Package Modal */}
      <ConfirmPackageModal
        isOpen={currentStep === 2}
        onClose={() => setCurrentStep(0)}
        onPreviousStep={() => setCurrentStep(1)} // Go back to Cart Sidebar
        onConfirm={handleConfirmPackageAndProceedToCheckout} // Proceed to Razorpay Checkout
        cartItems={cartItems}
        currentStep={currentStep} // Pass current step for progress indicator
      />

      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      <div
        onClick={() => {
          sendLogToGA4({
            sessionId: sessionId.current,
            action: "user_clicked_faq",
            title: "User clicked FAQ",
            details: {
              location: "LabEnvironments Page",
              timestamp: new Date().toISOString(),
            },
          })
        }}
      >
        <LabFAQ />
      </div>

      <LabFooter />
      <Salesiq />
      {razorpayPackageDetails && (
        <RazorpayCheckout
          isOpen={currentStep === 3} // Open when currentStep is 3
          onClose={() => setCurrentStep(0)} // Close all popups
          onPreviousStep={() => setCurrentStep(2)} // Go back to Confirm Package
          amount={totalCartAmount}
          packageDetails={razorpayPackageDetails} // Pass the combined details
          onSuccess={handleRazorpaySuccess}
          onError={handleRazorpayError}
          currentStep={currentStep} // Pass current step for tracker UI
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div
            ref={popupRef}
            className="relative max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all"
          >
            <button
              onClick={() => setShowSuccessPopup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              aria-label="Close"
            >
              <span className="text-lg font-semibold">&times;</span>
            </button>
            <h2 className="text-2xl font-semibold text-green-600 mb-3">Payment Successful!</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Your lab setup ticket has been created successfully.
              <br />
              Lab setup in progress — ready within <strong>20-30 mins</strong>.
              <br />
              You'll get a welcome email once it's live.
              <br />
              Server auto-stops after <strong>2 hours</strong>, or stop manually to save usage.
            </p>
          </div>
        </div>
      )}

      {/* New Cart Dashboard - now conditionally rendered */}
      {currentStep < 2 && ( // Only show dashboard if currentStep is 0 (closed) or 1 (cart sidebar)
        <CartDashboard
          cartItems={cartItems}
          onRemoveItem={handleRemoveItem}
          onOpenCart={() => setCurrentStep(1)} // Opens the CartSidebar
        />
      )}

      {/* Splunk Conflict Alert Dialog - Refined to match Razorpay style */}
      <Dialog open={showSplunkConflictAlert} onOpenChange={setShowSplunkConflictAlert}>
        <DialogContent className="w-[95vw] max-w-lg mx-auto bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 pb-4 border-b border-green-100 dark:border-gray-600">
            <div className="text-center pr-12">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-600 dark:text-red-400" />
                Splunk Environment Conflict
              </DialogTitle>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                You can only select one Splunk environment at a time.
              </p>
            </div>
          </DialogHeader>
          <DialogDescription className="text-gray-700 dark:text-gray-300 text-base space-y-3 mx-[7px] px-1.5 py-[27px]">
            {existingSplunkPackageToReplace && newSplunkPackageToReplace && (
              <>
                You currently have{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {existingSplunkPackageToReplace.title}
                </span>{" "}
                (₹{existingSplunkPackageToReplace.amount}) in your cart.
                <br />
                <br /> {/* Add line breaks for separation */}
                Would you like to replace it with{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {newSplunkPackageToReplace.title}
                </span>{" "}
                (₹{newSplunkPackageToReplace.amount})?
              </>
            )}
          </DialogDescription>
          <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSplunkConflictAlert(false)}
                className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReplaceSplunkPackage}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
              >
                Replace Package
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
