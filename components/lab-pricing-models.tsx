"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Server,
  Database,
  Network,
  CheckCircle,
  Star,
  Check,
  ArrowUpRightFromSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  Terminal,
  MessageSquare,
  ShieldCheck,
  ShieldOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import type { CartItem } from "./cart-sidebar"
import { cn } from "@/lib/utils"

interface EnvironmentOption {
  id?: string
  title?: string
  subtitle?: string
  icon: React.ReactNode
  description?: string
  features: string[]
  info: string[]
  components?: string[]
  pricing: { amount: number; days?: number; hours: number; popular?: boolean }[]
  color: string
  bgColor: string
  type: "splunk" | "security-data-source" | "all-security-data-sources"
  isComingSoon?: boolean
}

interface PricingCategory {
  id: string
  title: string
  description?: string
  environments: EnvironmentOption[]
}

interface LabPricingModelsProps {
  onAddToCart: (item: CartItem) => void
  cartItems: CartItem[]
  onSplunkConflict: (newPackage: CartItem, existingPackage: CartItem) => void
}

const pricingCategories: PricingCategory[] = [
  {
    id: "splunk-environments",
    title: "Splunk Lab Environments",
    description: "Choose the perfect environment for your Splunk learning journey",
    environments: [
      {
        id: "standalone",
        title: " Splunk Standalone",
        subtitle: "Perfect for Learning",
        icon: <Server className="w-6 h-6" />,
        features: [
          "Pre-configured Splunk instance (optional)",
          "BOTSv3 – Real-world logs with Splunk tutorial data. (optional)",
          "Supporting Add-ons for seamless data ingestion. (optional)",
        ],
        info: [
          "(OS: Red Hat-9.6) (RAM: 4 GB) (vCPUs: 2)",
          "Splunk Enterprise Version: 9.4.1",
          "Storage: 30GB",
          "Enabled ports: 22, 8000-9999",
          "Dynamic Public IP",
        ],
        components: ["Splunk Enterprise"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40, popular: true },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/50",
        type: "splunk",
      },
      {
        id: "distributed",
        title: "Splunk Distributed Non-Clustered",
        subtitle: "Scalable Architecture",
        icon: <Network className="w-6 h-6" />,
        features: [
          "4-component architecture",
          "Distributed search capabilities",
          "BOTSv3 – Real-world logs with Splunk tutorial data. (optional)",
        ],
        info: [
          "(OS: Red Hat-9.6) (RAM: 4 GB) (vCPUs: 2)",
          "Splunk Enterprise Version: 9.4.1",
          "Storage: 30GB",
          "Enabled ports: 22, 8000-9999",
          "Dynamic Public IP",
        ],
        components: ["Search Head", "Indexer", "Heavy Forwarder", "Universal Forwarder"],
        pricing: [
          { amount: 2800, hours: 58 },
          { amount: 2500, hours: 52 },
          { amount: 2000, hours: 42 },
          { amount: 1500, hours: 31 },
          { amount: 1000, hours: 21, popular: true },
          { amount: 500, hours: 10 },
          { amount: 200, hours: 3 },
        ],
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
        type: "splunk",
      },
      {
        id: "clustered",
        title: "Splunk Distributed Cluster",
        subtitle: "High Availability",
        icon: <Database className="w-6 h-6" />,
        features: [
          "Search head cluster (3 nodes)",
          "Indexer cluster (3 nodes)",
          "Management server (Deployer, License manager, Deployment server, Monitoring Console)",
        ],
        info: [
          "(OS: Red Hat-9.6) (RAM: 4 GB) (vCPUs: 2)",
          "Splunk Enterprise Version: 9.4.1",
          "Storage: 30GB",
          "Enabled ports: 22, 8000-9999",
          "Dynamic Public IP",
        ],
        components: ["SH Cluster", "IDX Cluster", "Cluster Master", "HF", "Management server"],
        pricing: [
          { amount: 6000, hours: 56 },
          { amount: 5000, hours: 47 },
          { amount: 4000, hours: 38 },
          { amount: 3000, hours: 28, popular: true },
          { amount: 2000, hours: 19 },
          { amount: 1000, hours: 9 },
          { amount: 500, hours: 5 },
        ],
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/50",
        type: "splunk",
      },
    ],
  },
  {
    id: "security-data-sources",
    title: "Security Data Sources",
    description: "Explore various security data sources for your Splunk use cases.",
    environments: [
      {
        id: "syslog-ng",
        title: "Syslog-ng",
        subtitle: "Advanced Syslog Collection",
        icon: <MessageSquare className="w-6 h-6" />,
        features: [
          "Syslog-ng is installed and configured on a Linux host",
          "Logs are forwarded to a Splunk indexer via TCP (port 9997)",
          "Custom templates are used to format the logs for ingestion",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 30GB",
          "Enabled ports: 22, 80, 443, 514, 5514",
          "Dynamic Public IP",
        ],
        components: ["Syslog-ng Server"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40 },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-cyan-600",
        bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
        type: "security-data-source",
      },
      {
        id: "mysql-logs",
        title: "MySQL Database",
        subtitle: "Database Activity Monitoring",
        icon: <Database className="w-6 h-6" />,
        features: ["General query logs", "Error logs", "Slow query logs", "Audit logs (if enabled)"],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 30GB",
          "Enabled ports: 22, 80, 443, 3306",
          "Dynamic Public IP",
        ],
        components: ["MySQL Server"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40 },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
        type: "security-data-source",
      },
      {
        id: "mssql-logs",
        title: "MSSQL Database",
        subtitle: "SQL Server Monitoring",
        icon: <Database className="w-6 h-6" />,
        features: ["SQL Server audit logs", "Error logs", "SQL Agent logs", "Trace logs"],
        info: [
          "(OS: Red Hat-8.10) (RAM: 16 GB) (vCPUs: 4)",
          "Storage: 30GB",
          "Enabled ports: 22, 80, 443, 1433",
          "Dynamic Public IP",
        ],
        components: ["MSSQL Server"],
        pricing: [
          { amount: 1400, hours: 56 },
          { amount: 1200, hours: 48 },
          { amount: 1000, hours: 40 },
          { amount: 800, hours: 31 },
          { amount: 600, hours: 23 },
          { amount: 400, hours: 14 },
          { amount: 200, hours: 6 },
        ],
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/50",
        type: "security-data-source",
      },
      {
        id: "windows-ad-dns",
        title: "Windows (AD & DNS)",
        subtitle: "Active Directory & DNS Monitoring",
        icon: <ShieldCheck className="w-6 h-6" />,
        features: [
          "Active Directory logs (Security, System, Application)",
          "DNS server logs",
          "Group Policy changes",
          "User authentication events",
          "Domain Controller health monitoring",
        ],
        info: [
          "(OS: Windows Server 2022) (RAM: 8 GB) (vCPUs: 2)",
          "Storage: 50GB",
          "Enabled ports: 80, 88, 53, 464, 5985, 5986, 3389, 636, 389",
          "Dynamic Public IP",
        ],
        components: ["Windows Server", "Active Directory", "DNS Server"],
        pricing: [
          { amount: 1400, hours: 56 },
          { amount: 1200, hours: 48 },
          { amount: 1000, hours: 40, popular: true },
          { amount: 800, hours: 31 },
          { amount: 600, hours: 23 },
          { amount: 400, hours: 14 },
          { amount: 200, hours: 6 },
        ],
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
        type: "security-data-source",
      },
      {
        id: "ossec",
        title: "OSSEC",
        subtitle: "Host-based Intrusion Detection",
        icon: <FileText className="w-6 h-6" />,
        features: [
          "Log analysis and correlation",
          "File integrity monitoring (FIM)",
          "Rootkit detection",
          "Active response capabilities",
        ],
        info: [
          "(OS: Ubuntu 22.04) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 30GB",
          "OSSEC Server and Agent setup",
          "Integration with Splunk for centralized logging",
          "Dynamic Public IP",
        ],
        components: ["OSSEC Server", "OSSEC Agent"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40, popular: true },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/50",
        type: "security-data-source",
      },
      {
        id: "jenkins",
        title: "Jenkins",
        subtitle: "DevOps Pipeline Monitoring",
        icon: <Terminal className="w-6 h-6" />,
        features: [
          "Jenkins server setup",
          "Build logs collection",
          "Deployment status monitoring",
          "User activity tracking",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 30GB",
          "Enabled ports: 22, 80, 443, 8080",
          "Dynamic Public IP",
        ],
        components: ["Jenkins Server"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40 },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/50",
        type: "security-data-source",
      },
      {
        id: "linux-server",
        title: "Linux Server",
        // subtitle: "Coming Soon",
        subtitle: "System Logs & Monitoring",
        icon: <ShieldOff className="w-6 h-6" />,
        features: [
          "Linux system logs",
          "Audit logs",
          "SSH activity monitoring",
          "Process monitoring",
        ],
        info: [
          "(OS: RHEL 9.6) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 30GB",
          "Enabled ports: 22, 8000-9999",
          "Dynamic Public IP",
        ],
        components: ["Linux OS"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40 },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/50",
        type: "security-data-source",
         // isComingSoon: true,
      },

      {
        id: "openvpn",
        title: "OpenVPN",
        // subtitle: "Coming Soon",
        subtitle: "Secure VPN Access Monitoring",
        icon: <Lock className="w-6 h-6" />,
        features: [
          "OpenVPN server logs",
          "Connection logs",
          "User authentication logs",
          "Traffic monitoring",
        ],
        info: [
          "(OS:  Ubuntu 22.04 ) (RAM: 4 GB) (vCPUs: 2)",
          "Storage: 20GB",
          "Enabled ports: 22, 943, 443, 1194",
          "Dynamic Public IP",
        ],
        components: ["OpenVPN Server"],
        pricing: [
          { amount: 700, hours: 56 },
          { amount: 600, hours: 48 },
          { amount: 500, hours: 40 },
          { amount: 400, hours: 31 },
          { amount: 300, hours: 23 },
          { amount: 200, hours: 14 },
          { amount: 100, hours: 6 },
        ],
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950/50",
        type: "security-data-source",
         // isComingSoon: true,
      },

    ],
  },
]

// Scroll Indicator Component
interface ScrollIndicatorProps {
  isVisible: boolean
}

function ScrollIndicator({ isVisible }: ScrollIndicatorProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-1/2 right-4 z-40 transform -translate-y-1/2 animate-in slide-in-from-right-2 duration-500">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <MousePointer2 className="w-5 h-5 animate-pulse" />
            <div className="text-xs font-medium mt-1">Scroll</div>
          </div>
          <div className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4 animate-bounce" />
            <ArrowRight className="w-4 h-4 animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
        <div className="text-xs text-center mt-1 opacity-90">Drag to explore</div>
      </div>
    </div>
  )
}

// Enhanced Carousel Component
interface CarouselProps {
  children: React.ReactNode[]
  className?: string
}

function Carousel({ children, className }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftValue, setScrollLeftValue] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)

  // Calculate items per view based on screen size
  const getItemsPerView = () => {
    if (typeof window === "undefined") return 3
    if (window.innerWidth < 768) return 1 // Mobile
    if (window.innerWidth < 1024) return 2 // Tablet
    return 3 // Desktop
  }

  const [itemsPerView, setItemsPerView] = useState(getItemsPerView)

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const maxIndex = Math.max(0, children.length - itemsPerView)

  // Show scroll indicator when carousel is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollIndicator(entry.isIntersecting && maxIndex > 0)
      },
      { threshold: 0.3 },
    )

    if (carouselRef.current) {
      observer.observe(carouselRef.current)
    }

    return () => observer.disconnect()
  }, [maxIndex])

  // Hide scroll indicator after 5 seconds
  useEffect(() => {
    if (showScrollIndicator) {
      const timer = setTimeout(() => {
        setShowScrollIndicator(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showScrollIndicator])

  const updateScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
  }, [currentIndex, itemsPerView])

  const scrollToIndex = (index: number) => {
    if (carouselRef.current) {
      const newIndex = Math.max(0, Math.min(index, maxIndex))
      setCurrentIndex(newIndex)

      const cardWidth = carouselRef.current.clientWidth / itemsPerView
      const scrollPosition = newIndex * cardWidth

      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      })
    }
  }

  const scrollLeftFunc = () => {
    scrollToIndex(currentIndex - 1)
  }

  const scrollRightFunc = () => {
    scrollToIndex(currentIndex + 1)
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeftValue(carouselRef.current.scrollLeft)
    carouselRef.current.style.cursor = "grabbing"
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2
    carouselRef.current.scrollLeft = scrollLeftValue - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab"

      // Snap to nearest card
      const cardWidth = carouselRef.current.clientWidth / itemsPerView
      const newIndex = Math.round(carouselRef.current.scrollLeft / cardWidth)
      scrollToIndex(newIndex)
    }
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab"
    }
  }

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft)
    setScrollLeftValue(carouselRef.current.scrollLeft)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !carouselRef.current) return
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 2
    carouselRef.current.scrollLeft = scrollLeftValue - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.clientWidth / itemsPerView
      const newIndex = Math.round(carouselRef.current.scrollLeft / cardWidth)
      scrollToIndex(newIndex)
    }
  }

  return (
    <>
      <div className={cn("relative group mx-3", className)}>
        {/* Enhanced Left Arrow - Always Visible */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
            "border-2 border-gray-200 dark:border-gray-700",
            "hover:shadow-xl hover:scale-110 hover:border-blue-500 dark:hover:border-blue-400",
            "backdrop-blur-sm",
            !canScrollLeft ? "opacity-40 cursor-not-allowed" : "opacity-90 hover:opacity-100",
            "-translate-x-6 hover:-translate-x-4",
          )}
          onClick={scrollLeftFunc}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </Button>

        {/* Carousel Container */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto scrollbar-hide cursor-grab select-none px-8 flex-row gap-7 my-2.5 py-5"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onScroll={updateScrollButtons}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0"
              style={{
                width: `calc(${100 / itemsPerView}% - ${(24 * (itemsPerView - 1)) / itemsPerView}px)`,
              }}
            >
              {child}
            </div>
          ))}
        </div>

        {/* Enhanced Right Arrow - Always Visible */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
            "border-2 border-gray-200 dark:border-gray-700",
            "hover:shadow-xl hover:scale-110 hover:border-blue-500 dark:hover:border-blue-400",
            "backdrop-blur-sm",
            !canScrollRight ? "opacity-40 cursor-not-allowed" : "opacity-90 hover:opacity-100",
            "translate-x-6 hover:translate-x-4",
          )}
          onClick={scrollRightFunc}
          disabled={!canScrollRight}
        >
          <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </Button>

        {/* Enhanced Dots Indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-8 gap-3">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "rounded-full transition-all duration-300 hover:scale-125",
                  index === currentIndex
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-3 shadow-lg"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 w-3 h-3",
                )}
                onClick={() => scrollToIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Mobile Swipe Hint */}
        <div className="md:hidden text-center mt-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            <ArrowLeft className="w-3 h-3" />
            <span>Swipe to explore</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator isVisible={showScrollIndicator} />
    </>
  )
}

export function LabPricingModels({ onAddToCart, cartItems, onSplunkConflict }: LabPricingModelsProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const [expandedPricing, setExpandedPricing] = useState<Record<string, boolean>>({})
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({})

  const [selectedPricingOption, setSelectedPricingOption] = useState<
    Record<string, { amount: number; hours: number } | null>
  >({})

  const [isCategoryExpanded, setIsCategoryExpanded] = useState<Record<string, boolean>>({})

  const [notification, setNotification] = useState<{
    message: string
    type: "add" | "replace"
    show: boolean
  } | null>(null)

  // Initialize category expansion state
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {}
    pricingCategories.forEach((category) => {
      initialExpandedState[category.id] = true
    })
    setIsCategoryExpanded(initialExpandedState)
  }, [])

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setIsCategoryExpanded((prev) => ({
      ...prev,
      [categoryId]: checked,
    }))
  }

  const toggleFeatures = (envId: string) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [envId]: !prev[envId],
    }))
  }

  const toggleInfo = (envId: string) => {
    setExpandedInfo((prev) => ({
      ...prev,
      [envId]: !prev[envId],
    }))
  }

  const togglePricing = (envId: string) => {
    setExpandedPricing((prev) => ({
      ...prev,
      [envId]: !prev[envId],
    }))
  }

  const toggleComponents = (envId: string) => {
    setExpandedComponents((prev) => ({
      ...prev,
      [envId]: !prev[envId],
    }))
  }

  const handlePricingOptionSelect = (
    envId: string,
    option: { amount: number; hours: number },
    env: EnvironmentOption,
  ) => {
    if (env.isComingSoon) return

    const isSplunkPackage = env.type === "splunk"
    const existingSplunkItem = cartItems.find((item) => item.type === "splunk")

    if (isSplunkPackage && existingSplunkItem && existingSplunkItem.id !== envId) {
      onSplunkConflict(
        {
          id: env.id || "",
          title: env.title || "",
          amount: option.amount,
          hours: option.hours,
          type: env.type,
          selectedPricingOption: option,
          components: env.components,
        },
        existingSplunkItem,
      )
      return
    }

    setSelectedPricingOption((prev) => ({
      ...prev,
      [envId]: option,
    }))

    onAddToCart({
      id: env.id || "",
      title: env.title || "",
      amount: option.amount,
      hours: option.hours,
      type: env.type,
      selectedPricingOption: option,
      components: env.components,
    })

    const isReplacing = cartItems.some((item) => item.id === envId)
    setNotification({
      message: isReplacing ? `${env.title} updated in cart!` : `${env.title} added to cart!`,
      type: isReplacing ? "replace" : "add",
      show: true,
    })

    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const getSelectedPricingForDisplay = (envId: string) => {
    const itemInCart = cartItems.find((item) => item.id === envId)
    if (itemInCart) {
      return itemInCart.selectedPricingOption
    }
    return selectedPricingOption[envId]
  }

  const renderEnvironmentCard = (env: EnvironmentOption, categoryIsExpanded: boolean) => (
    <Card
      key={env.id || env.title || "environment"}
      className={cn(
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 group h-full",
        env.isComingSoon ? "opacity-50 pointer-events-none" : "hover:scale-[1.02] hover:border-green-500",
      )}
    >
      <CardHeader className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`p-3 rounded-xl ${env.bgColor} ${env.color} group-hover:scale-110 transition-transform duration-300`}
          >
            {env.icon}
          </div>
          <div className="flex-1">
            {env.title && (
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{env.title}</CardTitle>
            )}
            {env.subtitle && <p className="text-sm text-gray-400 dark:text-gray-400 mb-2">{env.subtitle}</p>}
            {env.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{env.description}</p>
            )}
            {env.isComingSoon ? (
              <Badge className="mt-3 bg-gray-500 text-white text-xs animate-pulse">Coming Soon</Badge>
            ) : (
              getSelectedPricingForDisplay(env.id || "") && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />₹{getSelectedPricingForDisplay(env.id || "")?.amount} for{" "}
                  {getSelectedPricingForDisplay(env.id || "")?.hours} hours
                </div>
              )
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6 opacity-100">
        {!env.isComingSoon && (
          <>
            {/* Key Features Section */}
            {categoryIsExpanded && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFeatures(env.id || "")
                }}
                className="cursor-pointer"
              >
                <button className="w-full text-left flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Key Features
                  </div>
                  {expandedFeatures[env.id || ""] ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                <div
                  className={cn(
                    "space-y-2 transition-all duration-300 ease-in-out",
                    expandedFeatures[env.id || ""] ? "max-h-[1000px]" : "max-h-24 overflow-hidden relative",
                    !expandedFeatures[env.id || ""] &&
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 dark:after:to-transparent after:pointer-events-none",
                  )}
                >
                  {env.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Components Section */}
            {categoryIsExpanded && env.components && env.components.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  toggleComponents(env.id || "")
                }}
                className="cursor-pointer"
              >
                <button className="w-full text-left flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 transition-colors duration-200">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-green-600" />
                    Components
                  </div>
                  {expandedComponents[env.id || ""] ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 opacity-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 opacity-0" />
                  )}
                </button>
                <div
                  className={cn(
                    "flex flex-wrap gap-2 transition-all duration-300 ease-in-out",
                    expandedComponents[env.id || ""] ? "max-h-[1000px]" : "max-h-24 overflow-hidden relative",
                    !expandedComponents[env.id || ""] &&
                    env.components.length > 6 &&
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 dark:after:to-transparent after:pointer-events-none",
                  )}
                >
                  {env.components.map((component, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs py-1 px-2 hover:scale-105 transition-transform duration-200"
                    >
                      {component}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Info Section */}
            {categoryIsExpanded && (
              <div className="leading-7">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInfo(env.id || "")
                  }}
                  className="w-full text-left flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Info
                  </div>
                  {expandedInfo[env.id || ""] ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                <div
                  className={cn(
                    "space-y-2 transition-all duration-300 ease-in-out",
                    expandedInfo[env.id || ""] ? "max-h-[1000px]" : "max-h-24 overflow-hidden relative",
                    !expandedInfo[env.id || ""] &&
                    "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 dark:after:to-transparent after:pointer-events-none",
                  )}
                >
                  {env.info.map((info, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{info}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Section */}
            <div className="opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  togglePricing(env.id || "")
                }}
                className="w-full text-left flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 transition-colors duration-200"
              >
                Choose Package
                {expandedPricing[env.id || ""] ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <div
                className={cn(
                  "grid grid-cols-2 gap-2 transition-all duration-300 ease-in-out",
                  expandedPricing[env.id || ""] ? "max-h-[1000px]" : "max-h-[15rem] overflow-hidden relative",
                )}
              >
                {env.pricing.map((option, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePricingOptionSelect(env.id || "", option, env)
                    }}
                    className={`relative p-3 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] my-0.5 py-2.5 border mx-3 ${getSelectedPricingForDisplay(env.id || "")?.amount === option.amount
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-200 dark:ring-blue-800 shadow-md"
                        : option.popular
                          ? "border-green-500 bg-green-50 dark:bg-green-950/50 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                  >
                    {getSelectedPricingForDisplay(env.id || "")?.amount === option.amount && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 text-white text-xs animate-pulse">
                          <CheckCircle className="w-2 h-2 mr-1" />
                          Selected
                        </Badge>
                      </div>
                    )}

                    {option.popular && getSelectedPricingForDisplay(env.id || "")?.amount !== option.amount && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 text-white text-xs animate-bounce">
                          <Star className="w-2 h-2 mr-1" />
                          Popular
                        </Badge>
                      </div>
                    )}

                    <ArrowUpRightFromSquare className="absolute top-2 right-2 w-4 h-4 dark:text-gray-500 text-neutral-300 opacity-0" />

                    <div className="text-base font-semibold text-gray-900 dark:text-white">
                      {option.hours} {option.hours === 1 ? "Hr" : "Hrs"}{" "}
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">(2h/day)</span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">₹{option.amount}</div>
                  </div>
                ))}
              </div>
              {env.pricing.length > 6 && (
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePricing(env.id || "")
                  }}
                  className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 py-1 px-2"
                >
                  {expandedPricing[env.id || ""] ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" /> View Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" /> View More
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {pricingCategories.map((category) => {
          const categoryId = category.id
          const isExpanded = isCategoryExpanded[categoryId]
          const shouldUseCarousel = category.environments.length > 3 // Dynamic check for carousel

          return (
            <div key={categoryId} className="mb-12 sm:mb-16 lg:mb-20">
              <div className="text-center mb-8 sm:mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-center w-full">
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-9">
                    {category.title}
                  </h2>
                  {category.description && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                  )}
                  <p className="text-[14px] text-red-400 font-bold dark:text-red-500 mt-[8px] italic">
                    (For practice and learning purposes only — not for production use)
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-auto">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isExpanded ? "More Details" : "More Details"}
                  </span>
                  <Switch
                    checked={isExpanded}
                    onCheckedChange={(checked) => handleCategoryToggle(categoryId, checked)}
                    aria-label={`Toggle ${category.title} visibility`}
                  />
                </div>
              </div>

              {/* Dynamic rendering: Carousel for >3 cards, Grid for ≤3 cards */}
              {shouldUseCarousel ? (
                <Carousel className="px-4">
                  {category.environments.map((env) => renderEnvironmentCard(env, isExpanded))}
                </Carousel>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
                  {category.environments.length > 0 ? (
                    category.environments.map((env) => renderEnvironmentCard(env, isExpanded))
                  ) : (
                    <div className="lg:col-span-3 text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No services available in this category yet. Check back soon!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {notification?.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-black/90 backdrop-blur-lg border border-white/20 rounded-full px-4 py-2 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${notification.type === "add" ? "bg-green-400" : "bg-blue-400"}`} />
              <span className="text-white text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export { pricingCategories }
export type { EnvironmentOption, PricingCategory }
