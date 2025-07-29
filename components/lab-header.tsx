"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SoftmaniaLogo } from "@/components/softmania-logo"
import { UserRoundCheck, Info, Phone, Menu, X, ShoppingCart } from "lucide-react" // Import ShoppingCart
import { logToSplunk } from "@/lib/splunklogger"
import type { CartItem } from "./cart-sidebar" // Import CartItem type

interface LabHeaderProps {
  onContactClick: () => void
  cartItems: CartItem[] // Add cartItems prop
  onOpenCart: () => void // Add onOpenCart prop
}

export function LabHeader({ onContactClick, cartItems, onOpenCart }: LabHeaderProps) {
  const router = useRouter()
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }
  const handleMyLabClick = async () => {
    await logToSplunk({
      action: "Clicked MyLab Button",
      details: { location: "lab-header", type: "desktop" },
    })
    router.push("/lab")
  }

  const handleMobileMyLabClick = async () => {
    await logToSplunk({
      action: "Clicked MyLab Button",
      details: { location: "lab-header", type: "mobile" },
    })
    closeMobileMenu()
    router.push("/lab")
  }

  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between w-full">
          <Link href="/" passHref>
            <SoftmaniaLogo size="md" />
          </Link>
          <div className="absolute left-1/2 -translate-x-1/2 z-0">
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-green-50 border-green-500 transition-all duration-300 hover:scale-105 shadow-sm bg-transparent"
              onClick={() => router.push("/lab")}
            >
              <UserRoundCheck className="w-4 h-4 mr-2" />
              MyLab
            </Button>
          </div>

          {/* Right: Disclaimer, Contact Sales, and Cart Buttons */}
          <div className="flex items-center space-x-3 z-10">
            <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 border-red-500 transition-all duration-300 hover:scale-105 shadow-sm bg-transparent"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Disclaimer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-medium text-gray-900 mb-4">Important Disclaimer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-400 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-base">
                      This lab provides infrastructure with pre-installed Splunk under its Free or Trial license. We do
                      not sell or resell Splunk software. All usage is subject to Splunk's official license terms. This
                      service is intended for educational and personal learning only.
                    </p>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => setShowDisclaimerModal(false)}
                      className="bg-red-800 hover:bg-red-700 text-white"
                    >
                      I Understand
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={onContactClick}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-sm bg-transparent"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>

            {/* Cart Icon in Header */}
            <Button
              variant="outline"
              size="sm"
              className="relative hover:bg-green-50 transition-all duration-300 hover:scale-105 shadow-sm bg-transparent"
              onClick={onOpenCart}
              aria-label="Open shopping cart"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Cart
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between w-full">
          <Link href="/" passHref>
            <SoftmaniaLogo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-green-50 border-green-500 bg-transparent"
                onClick={() => {
                  router.push("/lab")
                  closeMobileMenu()
                }}
              >
                <UserRoundCheck className="w-4 h-4 mr-2" />
                MyLab
              </Button>

              <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start hover:bg-red-50 border-red-500 bg-transparent"
                    onClick={closeMobileMenu}
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Disclaimer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-medium text-gray-900 mb-4">Important Disclaimer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <p className="text-gray-700 leading-relaxed text-base">
                        This lab provides infrastructure with pre-installed Splunk under its Free or Trial license. We
                        do not sell or resell Splunk software. All usage is subject to Splunk's official license terms.
                        This service is intended for educational and personal learning only.
                      </p>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => setShowDisclaimerModal(false)}
                        className="bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        I Understand
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onContactClick()
                  closeMobileMenu()
                }}
                className="w-full justify-start hover:bg-gray-50"
              >
                <Phone className="w-4 h-4 mr-2" />
                Contact Sales
              </Button>

              {/* Cart Icon in Mobile Menu */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start relative hover:bg-green-50 bg-transparent"
                onClick={() => {
                  onOpenCart()
                  closeMobileMenu()
                }}
                aria-label="Open shopping cart"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {cartItems.length > 0 && (
                  <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
