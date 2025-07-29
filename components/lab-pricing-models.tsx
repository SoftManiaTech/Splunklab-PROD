"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" // Import Button
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
} from "lucide-react"
import type { CartItem } from "./cart-sidebar" // Import CartItem type
import { cn } from "@/lib/utils" // Import cn for conditional class names

interface EnvironmentOption {
  id?: string // Made optional
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
  type: "splunk" | "security-data-source" | "all-security-data-sources" // Add type to differentiate
}

interface PricingCategory {
  id?: string // Made optional
  title?: string
  description?: string
  environments: EnvironmentOption[]
}

interface LabPricingModelsProps {
  onAddToCart: (item: CartItem) => void
  cartItems: CartItem[] // Pass cartItems to determine selected state
  onSplunkConflict: (newPackage: CartItem, existingPackage: CartItem) => void // New prop for conflict handling
}

const pricingCategories: PricingCategory[] = [
  {
    environments: [
      {
        id: "standalone",
        title: " Splunk Standalone",
        subtitle: "Perfect for Learning",
        icon: <Server className="w-6 h-6" />,
        description: "Single instance with BOTSv3 dataset for hands-on security training and threat hunting practice.",
        features: [
          "Pre-configured Splunk instance (optional)",
          "BOTSv3 – Real-world logs with Splunk tutorial data. (optional)",
          "Supporting Add-ons for seamless data ingestion. (optional)",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
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
        description:
          "Multi-component architecture with search head, indexer, and forwarders for realistic deployments.",
        features: [
          "4-component architecture",
          "Distributed search capabilities",
          "BOTSv3 – Real-world logs with Splunk tutorial data. (optional)",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
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
        description:
          "Full enterprise deployment with clustering, load balancing, and fault tolerance for production scenarios.",
        features: [
          "Search head cluster (3 nodes)",
          "Indexer cluster (3 nodes)",
          "Management server (Deployer, License manager, Deployment server, Monitoring Console)",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
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
      // Removed "All Security Data Sources" card
      {
        id: "syslog-ng",
        title: "Syslog-ng",
        subtitle: "Advanced Syslog Collection",
        icon: <MessageSquare className="w-6 h-6" />,
        description: "Collect and analyze logs from Syslog-ng for robust and flexible log management.",
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
        description:
          "Monitor MySQL database activity, including queries, errors, and audit trails for security and performance.",
        features: ["General query logs", "Error logs", "Slow query logs", "Audit logs (if enabled)"],
        info: ["Requires MySQL server", "Supports database inputs/scripts in Splunk", "Important for data security"],
        components: ["MySQL Server", "Universal Forwarder"],
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
        description:
          "Collect and analyze logs from Microsoft SQL Server for security, compliance, and performance insights.",
        features: ["SQL Server audit logs", "Error logs", "SQL Agent logs", "Trace logs"],
        info: [
          "Requires MSSQL Server",
          "Supports database inputs/scripts in Splunk",
          "Critical for enterprise databases",
        ],
        components: ["MSSQL Server", "Universal Forwarder"],
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
        id: "ossec",
        title: "OSSEC",
        subtitle: "Host-based Intrusion Detection",
        icon: <FileText className="w-6 h-6" />,
        description:
          "Deploy and monitor OSSEC HIDS for real-time log analysis, file integrity checking, and rootkit detection.",
        features: [
          "Log analysis and correlation",
          "File integrity monitoring (FIM)",
          "Rootkit detection",
          "Active response capabilities",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
          "OSSEC Server and Agent setup",
          "Integration with Splunk for centralized logging",
          "Dynamic Public IP",
        ],
        components: ["OSSEC Server", "OSSEC Agent", "Universal Forwarder"],
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
        description:
          "Monitor Jenkins build and deployment logs for insights into your CI/CD pipeline's performance and security.",
        features: [
          "Jenkins server setup",
          "Build logs collection",
          "Deployment status monitoring",
          "User activity tracking",
        ],
        info: [
          "(OS: Red Hat-9) (RAM: 4 GB) (vCPUs: 2)",
          "Jenkins LTS Version",
          "Integration with Splunk for CI/CD observability",
          "Dynamic Public IP",
        ],
        components: ["Jenkins Server", "Universal Forwarder"],
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
    ],
  },
]

export function LabPricingModels({ onAddToCart, cartItems, onSplunkConflict }: LabPricingModelsProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({})
  const [expandedPricing, setExpandedPricing] = useState<Record<string, boolean>>({})
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({}) // New state for components expansion

  const [selectedPricingOption, setSelectedPricingOption] = useState<
    Record<string, { amount: number; hours: number } | null>
  >({})

  // Add this after the existing useState declarations
  const [notification, setNotification] = useState<{
    message: string
    type: "add" | "replace"
    show: boolean
  } | null>(null)

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
    const isSplunkPackage = env.type === "splunk"
    const existingSplunkItem = cartItems.find((item) => item.type === "splunk")

    // If the user is trying to select a Splunk package, and there's already a DIFFERENT Splunk package in the cart
    if (isSplunkPackage && existingSplunkItem && existingSplunkItem.id !== envId) {
      onSplunkConflict(
        {
          id: env.id || "", // Ensure id is not undefined
          title: env.title || "",
          amount: option.amount,
          hours: option.hours,
          type: env.type,
          selectedPricingOption: option,
          components: env.components,
        },
        existingSplunkItem,
      )
      return // Prevent adding to cart immediately
    }

    setSelectedPricingOption((prev) => ({
      ...prev,
      [envId]: option,
    }))

    // Add to cart
    onAddToCart({
      id: env.id || "", // Ensure id is not undefined
      title: env.title || "",
      amount: option.amount,
      hours: option.hours,
      type: env.type,
      selectedPricingOption: option,
      components: env.components,
    })

    // Show notification instead of toast
    const isReplacing = cartItems.some((item) => item.id === envId)
    setNotification({
      message: isReplacing ? `${env.title} updated in cart!` : `${env.title} added to cart!`,
      type: isReplacing ? "replace" : "add",
      show: true,
    })

    // Auto hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const isItemInCart = (itemId: string) => {
    return cartItems.some((item) => item.id === itemId)
  }

  const getSelectedPricingForDisplay = (envId: string) => {
    const itemInCart = cartItems.find((item) => item.id === envId)
    if (itemInCart) {
      return itemInCart.selectedPricingOption
    }
    return selectedPricingOption[envId]
  }

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {pricingCategories.map((category) => (
          <div key={category.id || category.title || "category"} className="mb-12 sm:mb-16 lg:mb-20">
            <div className="text-center mb-8 sm:mb-12">
              {category.title && (
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">{category.title}</h2>
              )}
              {category.description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{category.description}</p>
              )}
            </div>
            <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
              {category.environments.length > 0 ? (
                category.environments.map((env) => (
                  <Card
                    key={env.id || env.title || "environment"}
                    className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group hover:border-green-500"
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
                            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                              {env.title}
                            </CardTitle>
                          )}
                          {env.subtitle && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{env.subtitle}</p>
                          )}
                          {env.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {env.description}
                            </p>
                          )}
                          {getSelectedPricingForDisplay(env.id || "") && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />₹{getSelectedPricingForDisplay(env.id || "")?.amount}{" "}
                              for {getSelectedPricingForDisplay(env.id || "")?.hours} hours
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 space-y-6 opacity-100">
                      {/* Key Features Section - Now Collapsible with Fade */}
                      <div
                        onClick={() => toggleFeatures(env.id || "")} // Clickable area for the whole section
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
                            expandedFeatures[env.id || ""] ? "max-h-[1000px]" : "max-h-24 overflow-hidden relative", // Explicit max-height for expanded
                            !expandedFeatures[env.id || ""] &&
                              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 dark:after:to-transparent after:pointer-events-none", // Fade effect
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

                      {env.components && env.components.length > 0 && (
                        <div
                          onClick={() => toggleComponents(env.id || "")} // Clickable area for the whole section
                          className="cursor-pointer"
                        >
                          <button className="w-full text-left flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white mb-3 hover:text-green-600 transition-colors duration-200">
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-green-600" />
                              Components
                            </div>
                            {expandedComponents[env.id || ""] ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          <div
                            className={cn(
                              "flex flex-wrap gap-2 transition-all duration-300 ease-in-out",
                              expandedComponents[env.id || ""] ? "max-h-[1000px]" : "max-h-24 overflow-hidden relative", // Adjust max-height as needed for components
                              !expandedComponents[env.id || ""] &&
                                env.components.length > 6 && // Only apply fade if more than 6 components (approx 3 rows)
                                "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-12 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 dark:after:to-transparent after:pointer-events-none", // Fade effect
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

                      <div>
                        <button
                          onClick={() => toggleInfo(env.id || "")}
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
                            expandedInfo[env.id || ""] ? "max-h-[1000px]" : "max-h-0 overflow-hidden", // Explicit max-height for expanded, max-h-0 for collapsed
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

                      <div className="opacity-100">
                        <button
                          onClick={() => togglePricing(env.id || "")} // Make the whole button clickable
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
                            expandedPricing[env.id || ""] ? "max-h-[1000px]" : "max-h-[15rem] overflow-hidden relative", // Changed to max-h-[15rem] for 3 rows
                            // Removed the fade effect from here
                          )}
                        >
                          {env.pricing.map((option, index) => (
                            <div
                              key={index}
                              onClick={() => handlePricingOptionSelect(env.id || "", option, env)} // Pass env object
                              className={`relative p-3 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] my-0.5 py-2.5 border mx-3 ${
                                getSelectedPricingForDisplay(env.id || "")?.amount === option.amount
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

                              {option.popular &&
                                getSelectedPricingForDisplay(env.id || "")?.amount !== option.amount && (
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
                        {env.pricing.length > 6 && ( // Only show button if there are more than 6 options (more than 3 rows)
                          <Button
                            variant="ghost"
                            onClick={() => togglePricing(env.id || "")}
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
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="lg:col-span-3 text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No services available in this category yet. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Premium Notification */}
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
