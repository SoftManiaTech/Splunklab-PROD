"use client"

import { useMemo, useEffect } from "react" // Import useEffect
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, ShoppingCart } from "lucide-react"

// Define the CartItem interface
export interface CartItem {
  id: string
  title: string
  amount: number
  hours: number
  type: "splunk" | "security-data-source" | "all-security-data-sources"
  selectedPricingOption: { amount: number; hours: number; popular?: boolean }
  components?: string[] // ✅ Added components property
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onRemoveItem: (id: string) => void
  onProceedToCheckout: () => void
}

export function CartSidebar({ isOpen, onClose, cartItems, onRemoveItem, onProceedToCheckout }: CartSidebarProps) {
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.amount, 0)
  }, [cartItems])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // Prevent body scroll
      document.body.style.overflow = "hidden"
      // Adjust padding to prevent content shifting if scrollbar disappears
      document.body.style.paddingRight = window.innerWidth - document.documentElement.clientWidth + "px"

      const preventBodyScroll = (e: WheelEvent) => {
        const target = e.target as Element
        const modalContent = document.querySelector("[data-modal-content]") // Assuming ScrollArea has this attribute or similar

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
        // Restore original body scroll
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight

        document.removeEventListener("wheel", preventBodyScroll)
        document.removeEventListener("touchmove", preventTouchScroll)
      }
    }
  }, [isOpen])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:w-[400px] flex flex-col bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-[90vh] overflow-hidden"
        onWheel={(e) => e.stopPropagation()} // Prevent scroll from bubbling up
        onTouchMove={(e) => e.stopPropagation()} // Prevent touch scroll from bubbling up
      >
        <SheetHeader className="relative flex-shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 pb-4 border-b border-green-100 dark:border-gray-600">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent flex items-center justify-center gap-2 pr-12">
            <ShoppingCart className="w-6 h-6 text-green-600" />
            Your Cart ({cartItems.length})
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-center">
            <ShoppingCart className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">Start adding packages!</p>
          </div>
        ) : (
          <ScrollArea
            data-modal-content // Added for event listener targeting
            className="flex-1 py-4 pr-4 -mr-4"
            onWheel={(e) => e.stopPropagation()} // Prevent scroll from bubbling up
            onTouchMove={(e) => e.stopPropagation()} // Prevent touch scroll from bubbling up
          >
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
                >
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      ₹{item.amount} for {item.hours} hours
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <SheetFooter className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-t border-gray-200 dark:border-gray-600 p-6">
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white">
              <span>Total:</span>
              <span>₹{totalAmount}</span>
            </div>
            <Button
              onClick={onProceedToCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Proceed to Checkout
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
