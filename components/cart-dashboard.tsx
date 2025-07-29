"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import type { CartItem } from "./cart-sidebar"

interface CartDashboardProps {
  cartItems: CartItem[]
  onRemoveItem: (id: string) => void
  onOpenCart: () => void
}

export function CartDashboard({ cartItems, onRemoveItem, onOpenCart }: CartDashboardProps) {
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.amount, 0)
  }, [cartItems])

  const totalItems = cartItems.length

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 inset-x-0 z-50 flex justify-center items-center px-4"
        >
          <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-full px-3 sm:px-4 py-2 sm:py-3 shadow-2xl w-auto">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Cart Icon with Badge */}
              <div className="relative flex-shrink-0">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-full">
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-green-500 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center min-w-[16px] sm:min-w-[20px]">
                  {totalItems}
                </span>
              </div>

              {/* Total Amount */}
              <div className="text-white font-semibold text-sm sm:text-base whitespace-nowrap">₹{totalAmount}</div>

              {/* View Cart Button */}
              <Button
                onClick={onOpenCart}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 flex-shrink-0"
              >
                View Cart
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
