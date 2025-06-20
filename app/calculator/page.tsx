"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SoftmaniaLogo } from "@/components/softmania-logo"
import Link from 'next/link';
import { useRouter } from "next/navigation"
import {
  Calculator,
  DollarSign,
  Clock,
  Server,
  HardDrive,
  Users,
  ArrowRightLeft,
  Info,
  AlertTriangle,
  Download,
  Calendar,
  IndianRupee,
  Globe,
  Cpu,
  Phone,
  UserRoundCheck,
  MessageCircle,
  Mail,
  Headphones,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialogHeader } from "@/components/ui/alert-dialog"

// AWS Pricing Data - Separated by instance type
const T2_MEDIUM_REGIONS = {
  "us-east-1": { name: "US East (N. Virginia)", price: 0.0464 },
  "us-east-2": { name: "US East (Ohio)", price: 0.0464 },
  "us-west-1": { name: "US West (N. California)", price: 0.0552 },
  "us-west-2": { name: "US West (Oregon)", price: 0.0464 },
  "af-south-1": { name: "Africa (Cape Town)", price: 0.0616 },
  "ap-south-1": { name: "Asia Pacific (Mumbai)", price: 0.0496 },
  "ap-northeast-3": { name: "Asia Pacific (Osaka)", price: 0.0608 },
  "ap-northeast-2": { name: "Asia Pacific (Seoul)", price: 0.0576 },
  "ap-southeast-1": { name: "Asia Pacific (Singapore)", price: 0.0584 },
  "ap-southeast-2": { name: "Asia Pacific (Sydney)", price: 0.0584 },
  "ap-northeast-1": { name: "Asia Pacific (Tokyo)", price: 0.0608 },
  "ca-central-1": { name: "Canada (Central)", price: 0.0512 },
  "eu-central-1": { name: "Europe (Frankfurt)", price: 0.0536 },
  "eu-west-1": { name: "Europe (Ireland)", price: 0.05 },
  "eu-west-2": { name: "Europe (London)", price: 0.052 },
  "eu-west-3": { name: "Europe (Paris)", price: 0.0528 },
  "sa-east-1": { name: "South America (São Paulo)", price: 0.0744 },
}

const T3_MEDIUM_REGIONS = {
  "us-east-1": { name: "US East (N. Virginia)", price: 0.0416 },
  "us-east-2": { name: "US East (Ohio)", price: 0.0416 },
  "us-west-1": { name: "US West (N. California)", price: 0.0496 },
  "us-west-2": { name: "US West (Oregon)", price: 0.0416 },
  "ca-central-1": { name: "Canada (Central)", price: 0.0464 },
  "ca-west-1": { name: "Canada (West – Calgary)", price: 0.0464 },
  "sa-east-1": { name: "South America (São Paulo)", price: 0.0672 },
  "eu-central-1": { name: "Europe (Frankfurt)", price: 0.048 },
  "eu-central-2": { name: "Europe (Zurich)", price: 0.0528 },
  "eu-north-1": { name: "Europe (Stockholm)", price: 0.0432 },
  "eu-west-1": { name: "Europe (Ireland)", price: 0.0456 },
  "eu-west-2": { name: "Europe (London)", price: 0.0472 },
  "eu-west-3": { name: "Europe (Paris)", price: 0.0472 },
  "eu-south-1": { name: "Europe (Milan)", price: 0.0479 },
  "eu-south-2": { name: "Europe (Spain)", price: 0.0456 },
  "af-south-1": { name: "Africa (Cape Town)", price: 0.0542 },
  "ap-southeast-5": { name: "Asia Pacific (Malaysia)", price: 0.0475 },
  "ap-south-1": { name: "Asia Pacific (Mumbai)", price: 0.0448 },
  "ap-south-2": { name: "Asia Pacific (Hyderabad)", price: 0.0448 },
  "ap-northeast-2": { name: "Asia Pacific (Seoul)", price: 0.052 },
  "ap-northeast-3": { name: "Asia Pacific (Osaka)", price: 0.0544 },
  "ap-southeast-1": { name: "Asia Pacific (Singapore)", price: 0.0528 },
  "ap-southeast-2": { name: "Asia Pacific (Sydney)", price: 0.0528 },
  "ap-southeast-3": { name: "Asia Pacific (Jakarta)", price: 0.0528 },
  "ap-southeast-4": { name: "Asia Pacific (Melbourne)", price: 0.0528 },
  "ap-southeast-7": { name: "Asia Pacific (Bangkok)", price: 0.0528 },
  "me-south-1": { name: "Middle East (Bahrain)", price: 0.0502 },
  "me-central-1": { name: "Middle East (UAE)", price: 0.0502 },
  "il-central-1": { name: "Israel (Tel Aviv)", price: 0.0479 },
  "us-gov-east-1": { name: "AWS GovCloud (US-East)", price: 0.0488 },
  "us-gov-west-1": { name: "AWS GovCloud (US-West)", price: 0.0488 },
}

const INSTANCE_TYPES = {
  "t2.medium": {
    name: "t2.medium",
    description: "Burstable Performance - 2 vCPU, 4 GB RAM",
    regionCount: Object.keys(T2_MEDIUM_REGIONS).length,
  },
  "t3.medium": {
    name: "t3.medium",
    description: "Burstable Performance - 2 vCPU, 4 GB RAM (Latest Gen)",
    regionCount: Object.keys(T3_MEDIUM_REGIONS).length,
  },
}

export default function SplunkBudgetCalculator() {
  // Input states
  const [budget, setBudget] = useState(3000)
  const [runtimePerDay, setRuntimePerDay] = useState(5)
  const [instancesPerPerson, setInstancesPerPerson] = useState(9)
  const [storagePerInstance, setStoragePerInstance] = useState(30)
  const [numberOfUsers, setNumberOfUsers] = useState(1)
  const [exchangeRate, setExchangeRate] = useState(84)
  const [desiredDays, setDesiredDays] = useState(10)
  const [showContactModal, setShowContactModal] = useState(false)
  const router = useRouter()

  // AWS Configuration
  const [selectedRegion, setSelectedRegion] = useState("ap-south-1") // Default to Mumbai
  const [selectedInstanceType, setSelectedInstanceType] = useState("t2.medium")

  // Deployment type states
  const [deploymentType, setDeploymentType] = useState<"standalone" | "non-clustered" | "clustered">("clustered")
  const [maintenanceCostEnabled, setMaintenanceCostEnabled] = useState(true)

  // Toggle mode: false = Days→Budget (PRIMARY), true = Budget→Days
  const [budgetToDays, setBudgetToDays] = useState(false)

  // Calculation results
  const [results, setResults] = useState({
    dailyCostINR: 0,
    dailyCostUSD: 0,
    instanceCostINR: 0,
    instanceCostUSD: 0,
    storageCostINR: 0,
    storageCostUSD: 0,
    affordableDays: 0,
    requiredBudgetINR: 0,
    requiredBudgetUSD: 0,
    totalBudgetUsed: 0,
  })

  // Storage pricing constant
  const STORAGE_RATE_USD = 0.08 // per GB per month for gp3

  // Get current EC2 rate based on selected region and instance type
  const getCurrentEC2Rate = () => {
    if (selectedInstanceType === "t3.medium") {
      const region = T3_MEDIUM_REGIONS[selectedRegion as keyof typeof T3_MEDIUM_REGIONS]
      return region?.price || 0.0448 // fallback to Mumbai t3.medium
    } else {
      const region = T2_MEDIUM_REGIONS[selectedRegion as keyof typeof T2_MEDIUM_REGIONS]
      return region?.price || 0.0496 // fallback to Mumbai t2.medium
    }
  }

  // Get available regions based on instance type
  const getAvailableRegions = () => {
    return selectedInstanceType === "t3.medium" ? T3_MEDIUM_REGIONS : T2_MEDIUM_REGIONS
  }

  // Get current region info
  const getCurrentRegionInfo = () => {
    const availableRegions = getAvailableRegions()
    return availableRegions[selectedRegion as keyof typeof availableRegions]
  }

  // Handle instance type change and reset region if not available
  const handleInstanceTypeChange = (newInstanceType: string) => {
    setSelectedInstanceType(newInstanceType)

    // Check if current region is available in new instance type
    const newAvailableRegions = newInstanceType === "t3.medium" ? T3_MEDIUM_REGIONS : T2_MEDIUM_REGIONS

    if (!newAvailableRegions[selectedRegion as keyof typeof newAvailableRegions]) {
      // Reset to Mumbai if available, otherwise first available region
      if (newAvailableRegions["ap-south-1"]) {
        setSelectedRegion("ap-south-1")
      } else {
        setSelectedRegion(Object.keys(newAvailableRegions)[0])
      }
    }
  }

  const handleContactOption = (type: "call" | "whatsapp" | "email" | "schedule") => {
    switch (type) {
      case "call":
        window.open("tel:+919876543210", "_self")
        break
      case "whatsapp":
        window.open("https://wa.me/918317349618?text=Hi, I'm interested in Splunk Lab Environments", "_blank")
        break
      case "email":
        window.open("mailto:info@softmania.in?subject=Splunk Lab Environment Inquiry", "_self")
        break
      case "schedule":
        window.open("https://bookings.softmania.in/#/services", "_blank")
        break
    }
    setShowContactModal(false)
  }


  useEffect(() => {
    calculateCosts()
  }, [
    budget,
    runtimePerDay,
    instancesPerPerson,
    storagePerInstance,
    numberOfUsers,
    exchangeRate,
    desiredDays,
    budgetToDays,
    deploymentType,
    maintenanceCostEnabled,
    selectedRegion,
    selectedInstanceType,
  ])

  const calculateCosts = () => {
    const EC2_RATE_USD = getCurrentEC2Rate()

    // Instance cost calculation
    const instanceCostUSD = EC2_RATE_USD * runtimePerDay * instancesPerPerson * numberOfUsers
    const instanceCostINR = instanceCostUSD * exchangeRate

    // Storage cost calculation (monthly to daily)
    const storageCostMonthlyUSD = STORAGE_RATE_USD * storagePerInstance * instancesPerPerson * numberOfUsers
    const storageCostUSD = storageCostMonthlyUSD / 30
    const storageCostINR = storageCostUSD * exchangeRate

    // Base daily cost
    const baseDailyCostUSD = instanceCostUSD + storageCostUSD
    const baseDailyCostINR = baseDailyCostUSD * exchangeRate

    // Apply maintenance cost if enabled
    const maintenanceMultiplier = maintenanceCostEnabled ? 1.25 : 1
    const dailyCostUSD = baseDailyCostUSD * maintenanceMultiplier
    const dailyCostINR = baseDailyCostINR * maintenanceMultiplier

    if (budgetToDays) {
      // Calculate affordable days
      const affordableDays = budget / dailyCostINR
      const totalBudgetUsed = Math.floor(affordableDays) * dailyCostINR

      setResults({
        dailyCostINR,
        dailyCostUSD,
        instanceCostINR: instanceCostINR * maintenanceMultiplier,
        instanceCostUSD: instanceCostUSD * maintenanceMultiplier,
        storageCostINR: storageCostINR * maintenanceMultiplier,
        storageCostUSD: storageCostUSD * maintenanceMultiplier,
        affordableDays,
        requiredBudgetINR: 0,
        requiredBudgetUSD: 0,
        totalBudgetUsed,
      })
    } else {
      // Calculate required budget
      const requiredBudgetINR = desiredDays * dailyCostINR
      const requiredBudgetUSD = requiredBudgetINR / exchangeRate

      setResults({
        dailyCostINR,
        dailyCostUSD,
        instanceCostINR: instanceCostINR * maintenanceMultiplier,
        instanceCostUSD: instanceCostUSD * maintenanceMultiplier,
        storageCostINR: storageCostINR * maintenanceMultiplier,
        storageCostUSD: storageCostUSD * maintenanceMultiplier,
        affordableDays: 0,
        requiredBudgetINR,
        requiredBudgetUSD,
        totalBudgetUsed: 0,
      })
    }
  }

  const handleDeploymentTypeChange = (type: "standalone" | "non-clustered" | "clustered") => {
    setDeploymentType(type)
    // Set default instances based on deployment type
    switch (type) {
      case "standalone":
        setInstancesPerPerson(1)
        break
      case "non-clustered":
        setInstancesPerPerson(4)
        break
      case "clustered":
        setInstancesPerPerson(9)
        break
    }
  }

  const shouldShowOptimizationTip = () => {
    return results.dailyCostINR > 250 || (budgetToDays && results.affordableDays < 10)
  }

  const generatePDFReport = () => {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const currentRegion = getCurrentRegionInfo()
    const currentEC2Rate = getCurrentEC2Rate()

    const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Splunk Lab Budget Report - Soft Mania</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
                line-height: 1.6; 
                color: #1f2937;
                background: white;
            }
            .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
            .header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 3px solid #10b981;
            }
            .logo { 
                display: flex; 
                align-items: center; 
                gap: 12px; 
            }
            .logo-icon { 
                width: 48px; 
                height: 48px; 
                background: linear-gradient(135deg, #10b981, #059669); 
                border-radius: 12px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: 24px;
                position: relative;
            }
            .logo-icon::after {
                content: '';
                position: absolute;
                bottom: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #1f2937;
                border-radius: 50%;
            }
            .logo-text { 
                font-size: 28px; 
                font-weight: 800; 
                color: #1f2937; 
            }
            .logo-subtitle { 
                font-size: 12px; 
                color: #10b981; 
                font-weight: 600; 
            }
            .report-title { 
                font-size: 32px; 
                font-weight: bold; 
                color: #1f2937; 
                text-align: center; 
                margin-bottom: 8px; 
            }
            .report-subtitle { 
                text-align: center; 
                color: #6b7280; 
                margin-bottom: 40px; 
            }
            .section { 
                margin-bottom: 32px; 
                background: #f9fafb; 
                padding: 24px; 
                border-radius: 12px; 
                border-left: 4px solid #10b981;
            }
            .section-title { 
                font-size: 20px; 
                font-weight: bold; 
                margin-bottom: 16px; 
                color: #1f2937; 
            }
            .grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 16px; 
            }
            .grid-item { 
                background: white; 
                padding: 16px; 
                border-radius: 8px; 
                border: 1px solid #e5e7eb; 
            }
            .grid-item-label { 
                font-size: 14px; 
                color: #6b7280; 
                margin-bottom: 4px; 
            }
            .grid-item-value { 
                font-size: 18px; 
                font-weight: bold; 
                color: #1f2937; 
            }
            .highlight-box { 
                background: linear-gradient(135deg, #10b981, #059669); 
                color: white; 
                padding: 24px; 
                border-radius: 12px; 
                text-align: center; 
                margin: 24px 0; 
            }
            .highlight-value { 
                font-size: 36px; 
                font-weight: bold; 
                margin-bottom: 8px; 
            }
            .highlight-label { 
                font-size: 16px; 
                opacity: 0.9; 
            }
            .cost-breakdown { 
                background: white; 
                border: 1px solid #e5e7eb; 
                border-radius: 8px; 
                overflow: hidden; 
            }
            .cost-item { 
                display: flex; 
                justify-content: space-between; 
                padding: 16px; 
                border-bottom: 1px solid #f3f4f6; 
            }
            .cost-item:last-child { 
                border-bottom: none; 
                background: #f9fafb; 
                font-weight: bold; 
            }
            .footer { 
                margin-top: 60px; 
                padding-top: 20px; 
                border-top: 2px solid #e5e7eb; 
                text-align: center; 
            }
            .footer-logo { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                gap: 8px; 
                margin-bottom: 12px; 
            }
            .footer-logo-icon { 
                width: 32px; 
                height: 32px; 
                background: linear-gradient(135deg, #10b981, #059669); 
                border-radius: 8px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white; 
                font-weight: bold; 
                font-size: 16px;
                position: relative;
            }
            .footer-logo-icon::after {
                content: '';
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 10px;
                height: 10px;
                background: #1f2937;
                border-radius: 50%;
            }
            .tagline { 
                color:rgb(41, 41, 41); 
                font-weight: 600; 
                font-size: 14px; 
            }
            .footer-text { 
                color: #6b7280; 
                font-size: 12px; 
                margin-top: 8px; 
            }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .container { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <div>
                        <div class="logo-text"><span style=" color: #2f855a;">Soft</span> Mania</div>
                    </div>
                </div>
                <div style="text-align: right; color: #6b7280; font-size: 14px;">
                    <div>Report Generated</div>
                    <div style="font-weight: 600;">${currentDate}</div>
                </div>
            </div>

            <div class="report-title">Splunk Lab Budget Analysis</div>
            <div class="report-subtitle">Cost Estimation Report</div>

            <div class="section">
                <div class="section-title">Configuration Summary</div>
                <div class="grid">
                    <div class="grid-item">
                        <div class="grid-item-label">Deployment Type</div>
                        <div class="grid-item-value">${deploymentType.charAt(0).toUpperCase() + deploymentType.slice(1).replace("-", " ")}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Runtime per Day</div>
                        <div class="grid-item-value">${runtimePerDay} hours</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Instances per Person</div>
                        <div class="grid-item-value">${instancesPerPerson}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Number of Users</div>
                        <div class="grid-item-value">${numberOfUsers}</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Storage per Instance</div>
                        <div class="grid-item-value">${storagePerInstance} GB</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">Exchange Rate</div>
                        <div class="grid-item-value">₹${exchangeRate}/USD</div>
                    </div>
                </div>
            </div>

            ${budgetToDays
        ? `
            <div class="highlight-box">
                <div class="highlight-value">${Math.floor(results.affordableDays)} Days</div>
                <div class="highlight-label">Estimated Runtime within ₹${budget} Budget</div>
            </div>
            `
        : `
            <div class="highlight-box">
                <div class="highlight-value">₹${results.requiredBudgetINR.toFixed(2)}</div>
                <div class="highlight-label">Required Budget for ${desiredDays} Days</div>
            </div>
            `
      }

            ${numberOfUsers > 1
        ? `
<div class="section">
    <div class="section-title">Per Person Analysis</div>
    <div class="grid">
        <div class="grid-item">
            <div class="grid-item-label">${!budgetToDays ? "Required Budget per Person" : "Runtime per Person"}</div>
            <div class="grid-item-value">${!budgetToDays
          ? `₹${(results.requiredBudgetINR / numberOfUsers).toFixed(2)}`
          : `${Math.floor(results.affordableDays)} Days`
        }</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Daily Cost per Person</div>
            <div class="grid-item-value">₹${(results.dailyCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Instance Cost per Person</div>
            <div class="grid-item-value">₹${(results.instanceCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
        <div class="grid-item">
            <div class="grid-item-label">Storage Cost per Person</div>
            <div class="grid-item-value">₹${(results.storageCostINR / numberOfUsers).toFixed(2)}</div>
        </div>
    </div>
</div>
`
        : ""
      }

<div class="section">
    <div class="section-title">${numberOfUsers > 1 ? `Total Daily Cost Breakdown (${numberOfUsers} Users)` : "Daily Cost Breakdown"}</div>
    <div class="cost-breakdown">
        <div class="cost-item">
            <span>Instance Cost (${instancesPerPerson} × ${numberOfUsers} × ${runtimePerDay}h)</span>
            <div style="text-align: right;">
                <div>₹${results.instanceCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.instanceCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        <div class="cost-item">
            <span>Storage Cost (${storagePerInstance}GB × ${instancesPerPerson} × ${numberOfUsers})</span>
            <div style="text-align: right;">
                <div>₹${results.storageCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.storageCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        ${maintenanceCostEnabled
        ? `
        <div class="cost-item">
            <span>Maintenance Cost (+25%)</span>
            <div style="text-align: right;">
                <div>₹${((results.instanceCostINR + results.storageCostINR) * 0.25).toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(((results.instanceCostINR + results.storageCostINR) * 0.25) / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
        `
        : ""
      }
        <div class="cost-item">
            <span>Total Daily Cost</span>
            <div style="text-align: right;">
                <div>₹${results.dailyCostINR.toFixed(2)}</div>
                ${numberOfUsers > 1 ? `<div style="font-size: 12px; color: #6b7280;">₹${(results.dailyCostINR / numberOfUsers).toFixed(2)} per person</div>` : ""}
            </div>
        </div>
    </div>
</div>

            <div class="section">
                <div class="section-title">AWS Pricing Reference</div>
                <div class="grid">
                    <div class="grid-item">
                        <div class="grid-item-label">EC2 (t2.medium)</div>
                        <div class="grid-item-value">$0.0464/hour</div>
                    </div>
                    <div class="grid-item">
                        <div class="grid-item-label">gp3 Storage</div>
                        <div class="grid-item-value">$0.08/GB-month</div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="footer-logo">
                    <div>
                        <div style="font-weight: 800; color: #10b981;">Soft Mania</div>
                        <div class="tagline">No matter how many documents, No matter how many tutorials, It is always practical knowledge that wins the game.</div>
                    </div>
                </div>
                <div class="footer-text">
                    This report was generated using Soft Mania's Splunk Lab Budget Calculator<br>
                    For support and inquiries, contact our 
                    <a href="http://wa.me/918317349618" target="_blank" style="color: #25D366; text-decoration: none;">
                      technical team
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const currentRegionInfo = getCurrentRegionInfo()

  return (
    <TooltipProvider>
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" passHref>
              <SoftmaniaLogo size="md" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="m-[4px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-sm"
              onClick={() => router.push("/lab")}
            >
              <UserRoundCheck className="mr-2" />
              MyLab
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContactModal(true)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Contact Our Sales Team
            </DialogTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Choose your preferred way to connect with our Splunk experts
            </p>
          </DialogHeader>
          <div className="space-y-4 p-6 pt-0">
            <div className="grid grid-cols-1 gap-3">
              {/* <Button
                onClick={() => handleContactOption("call")}
                className="bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Phone className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  <div className="font-medium">Call Back</div>
                  <div className="text-xs opacity-90">Within 5 mins</div>
                </div>
              </Button> */}
              <Button
                onClick={() => handleContactOption("whatsapp")}
                className="bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
                <div className="text-center">
                  <div className="font-medium">WhatsApp</div>
                  <div className="text-xs opacity-90">Instant chat</div>
                </div>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleContactOption("email")}
                variant="outline"
                className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <Mail className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  <div className="font-medium">Email Us</div>
                  <div className="text-xs opacity-70">Get details</div>
                </div>
              </Button>
              <Button
                onClick={() => handleContactOption("schedule")}
                variant="outline"
                className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <Calendar className="w-6 h-6 group-hover:animate-pulse" />
                <div className="text-center">
                  <div className="font-medium">Schedule</div>
                  <div className="text-xs opacity-70">Book meeting</div>
                </div>
              </Button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Headphones className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Expert Support Available</p>
                  {/* <p className="text-xs">Our Splunk certified team is ready to help you choose the right environment</p> */}
                </div>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setShowContactModal(false)} className="w-full mt-4">
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with Logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2 font-heading">

                Splunk Lab Budget Calculator
              </h1>
            </div>
            <div className="w-48"></div> {/* Spacer for balance */}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-heading">
                      <ArrowRightLeft className="h-5 w-5" />
                      Configuration
                    </CardTitle>
                    <CardDescription>Configure your lab parameters and calculation mode</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="mode-toggle" className="text-sm font-medium">
                      {budgetToDays ? "Budget → Days" : "Days → Budget"}
                    </Label>
                    <Switch
                      id="mode-toggle"
                      checked={budgetToDays}
                      onCheckedChange={(checked) => setBudgetToDays(checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AWS Configuration */}
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    AWS Configuration
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-600" />
                        <Label htmlFor="instance-type">Instance Type</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the EC2 instance type for your deployment</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={selectedInstanceType} onValueChange={handleInstanceTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Instance Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INSTANCE_TYPES).map(([type, info]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex flex-col">
                                <span className="font-medium">{info.name}</span>
                                <span className="text-xs text-gray-500">
                                  {info.description} • {info.regionCount} regions
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <Label htmlFor="region">AWS Region</Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the AWS region for your deployment</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AWS Region" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {Object.entries(getAvailableRegions()).map(([code, region]) => (
                            <SelectItem key={code} value={code}>
                              <div className="flex justify-between items-center w-full">
                                <span>{region.name}</span>
                                <span className="text-xs text-gray-500 ml-2">${region.price.toFixed(4)}/hr</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-gray-500">
                        {Object.keys(getAvailableRegions()).length} regions available for {selectedInstanceType}
                      </div>
                    </div>
                  </div>


                </div>

                {/* Deployment Type Tabs */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Deployment Type</Label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                      onClick={() => handleDeploymentTypeChange("standalone")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${deploymentType === "standalone"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                      Standalone
                    </button>
                    <button
                      onClick={() => handleDeploymentTypeChange("non-clustered")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${deploymentType === "non-clustered"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                      Non-Clustered
                    </button>
                    <button
                      onClick={() => handleDeploymentTypeChange("clustered")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${deploymentType === "clustered"
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                    >
                      Splunk Clustered
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {deploymentType === "standalone" && "• Single instance deployment for basic testing"}
                    {deploymentType === "non-clustered" &&
                      "• Multiple instances without clustering for medium workloads"}
                    {deploymentType === "clustered" && "• Full clustered deployment for production-like environments"}
                  </div>
                </div>

                {!budgetToDays ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="days">Desired Days</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of days you want to run the lab</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="days"
                      type="number"
                      value={desiredDays}
                      onChange={(e) => setDesiredDays(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                      <Label htmlFor="budget">Budget (₹)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total spendable budget in Indian Rupees</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="budget"
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <Label htmlFor="runtime">Runtime/Day (hrs)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How many hours the lab will run daily</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="runtime"
                      type="number"
                      value={runtimePerDay}
                      onChange={(e) => setRuntimePerDay(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-purple-600" />
                      <Label htmlFor="instances">Instances/Person</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of EC2 instances per user</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="instances"
                      type="number"
                      value={instancesPerPerson}
                      onChange={(e) => setInstancesPerPerson(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-red-600" />
                      <Label htmlFor="storage">Storage/Instance (GB)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>SSD volume (gp3) per instance in GB</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="storage"
                      type="number"
                      value={storagePerInstance}
                      onChange={(e) => setStoragePerInstance(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      <Label htmlFor="users">Number of Users</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of users/trainees</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="users"
                      type="number"
                      value={numberOfUsers}
                      onChange={(e) => setNumberOfUsers(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <Label htmlFor="exchange">Exchange Rate (USD to ₹)</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current USD to INR exchange rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="exchange"
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>
                      <strong>Current AWS Pricing:</strong>
                    </p>
                    <p>
                      • EC2 ({selectedInstanceType}): ${getCurrentEC2Rate().toFixed(4)}/hour
                    </p>
                    <p>• gp3 Storage: $0.08/GB-month</p>
                    <p>
                      • Region: {getCurrentRegionInfo()?.name || selectedRegion} ({selectedRegion})
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      • {Object.keys(getAvailableRegions()).length} regions available for {selectedInstanceType}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <Label htmlFor="maintenance-toggle" className="text-sm font-medium">
                          Softmania Maintenance Cost (+25%)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Additional 25% cost for professional maintenance and support services</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        id="maintenance-toggle"
                        checked={maintenanceCostEnabled}
                        onCheckedChange={setMaintenanceCostEnabled}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {maintenanceCostEnabled
                        ? "Maintenance cost included in calculations"
                        : "Base AWS pricing only"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <Calculator className="h-5 w-5" />
                  {!budgetToDays ? "Required Budget" : "Budget Analysis"}
                </CardTitle>
                <CardDescription>
                  {!budgetToDays
                    ? "Calculate the budget needed for your desired runtime"
                    : "See how long your budget will last"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!budgetToDays ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-heading tracking-tight">
                        ₹{results.requiredBudgetINR.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Required Budget</div>
                    </div>

                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${results.requiredBudgetUSD.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">In USD</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 font-heading tracking-tight">
                        {Math.floor(results.affordableDays)} Days
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Estimated Runtime</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{results.totalBudgetUsed.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Budget Used</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{(budget - results.totalBudgetUsed).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
                      </div>
                    </div>
                  </div>
                )}

                {numberOfUsers > 1 && (
                  <>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Per Person Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {!budgetToDays
                              ? `₹${(results.requiredBudgetINR / numberOfUsers).toFixed(2)}`
                              : `${Math.floor(results.affordableDays)} Days`}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {!budgetToDays ? "Required per Person" : "Runtime per Person"}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            ₹{(results.dailyCostINR / numberOfUsers).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Daily Cost per Person</div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Cost Breakdown (Per Day) {numberOfUsers > 1 && `- ${numberOfUsers} Users Total`}
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Instance Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{results.instanceCostINR.toFixed(2)}</div>
                        {numberOfUsers > 1 && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            ₹{(results.instanceCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ${results.instanceCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Storage Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₹{results.storageCostINR.toFixed(2)}</div>
                        {numberOfUsers > 1 && (
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            ₹{(results.storageCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          ${results.storageCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {maintenanceCostEnabled && (
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Maintenance Cost (25%)</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            ₹{((results.instanceCostINR + results.storageCostINR) * 0.25).toFixed(2)}
                          </div>
                          {numberOfUsers > 1 && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              ₹
                              {(((results.instanceCostINR + results.storageCostINR) * 0.25) / numberOfUsers).toFixed(2)}{" "}
                              per person
                            </div>
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            ${((results.instanceCostUSD + results.storageCostUSD) * 0.25).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-800">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold">Total Daily Cost</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400 font-heading">
                          ₹{results.dailyCostINR.toFixed(2)}
                        </div>
                        {numberOfUsers > 1 && (
                          <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                            ₹{(results.dailyCostINR / numberOfUsers).toFixed(2)} per person
                          </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ${results.dailyCostUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {shouldShowOptimizationTip() && (
                  <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>💡 Cost Optimization Tip:</strong> Try reducing runtime hours or number of instances for
                      longer usage within your budget.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={generatePDFReport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF Report
                  </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                  Exchange Rate: ₹{exchangeRate} per USD | {getCurrentRegionInfo()?.name || selectedRegion} (
                  {selectedInstanceType})
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">📋 Usage Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🎓 Training Labs</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Perfect for calculating costs for Splunk training sessions with multiple participants.
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🧪 Development</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Estimate costs for development and testing environments before deployment.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">📊 POC Projects</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Budget planning for proof-of-concept implementations and demos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
