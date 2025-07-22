"use client"

import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LaunchSoonBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem("launch-banner-dismissed")
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("launch-banner-dismissed", "true")
  }

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white shadow-lg border-b border-green-500/20">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3 lg:py-4 gap-2 sm:gap-3">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-200 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Mobile Layout */}
              <div className="block sm:hidden">
                <p className="text-xs font-medium leading-tight">
                  <span className="font-semibold block mb-1">New Features Coming Soon!</span>
                  <span className="text-green-100 text-xs block mb-2">Security Data Sources for Splunk use cases</span>
                  <a
                    href="https://chat.whatsapp.com/CsWBpBxMyDO3bV2Rz9r39H"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-xs font-small transition-all duration-200 border border-white/20 hover:border-white/30 touch-manipulation min-h-[25px]"
                  >
                    More details
                  </a>
                </p>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:block">
                <p className="text-sm lg:text-base font-medium">
                  <span className="hidden lg:inline">🚀 </span>
                  <span className="font-semibold">New Features Coming Soon!</span>
                  <span className="ml-2 text-green-100 text-sm">Security Data Sources for Splunk use cases</span>
                  <a
                    href="https://chat.whatsapp.com/CsWBpBxMyDO3bV2Rz9r39H"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center ml-3 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors duration-200 border border-white/20 hover:border-white/30"
                  >
                    More details
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/10 hover:text-white p-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full transition-colors duration-200 touch-manipulation min-h-[28px] min-w-[28px] sm:min-h-[32px] sm:min-w-[32px]"
              aria-label="Dismiss banner"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle animation border */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-60 animate-pulse"></div>
    </div>
  )
}
