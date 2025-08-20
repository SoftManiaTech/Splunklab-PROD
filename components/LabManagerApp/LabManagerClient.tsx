"use client"

import { useState, useEffect, type JSX } from "react"
import { useRouter } from "next/navigation"
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { jwtDecode } from "jwt-decode"
import EC2Table from "./components/EC2Table"
import Link from "next/link"
import * as CryptoJS from "crypto-js"
import { DownloadIcon } from "lucide-react"
import { event as sendToGA4 } from "@/lib/gtag" // Import GA4 logger
import { logToSplunk } from "@/lib/splunklogger" // Import Splunk logger

const getClientIp = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json")
    const data = await res.json()
    return data.ip || "unknown"
  } catch {
    return "unknown"
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string
const API_URL = process.env.NEXT_PUBLIC_API_URL as string
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours

function LabManagerClient(): JSX.Element {
  const [email, setEmail] = useState<string>("")
  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [hasLab, setHasLab] = useState<boolean | null>(null)
  const router = useRouter()
  const [userName, setUserName] = useState<string>("")
  const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "softmania_secret"
  const [usage, setUsage] = useState<Record<
    string,
    {
      quota_hours: number
      used_hours: number
      balance_hours: number
      quota_days: number
      used_days: number
      balance_days: number
      plan_start_date?: string
      plan_end_date?: string
    }
  > | null>(null)
  const [refreshingUsage, setRefreshingUsage] = useState(false) // Renamed to avoid conflict
  const [pemFiles, setPemFiles] = useState<{ filename: string; url: string }[]>([])
  const [isUsageExpanded, setIsUsageExpanded] = useState(false)
  const [rawUsageSummary, setRawUsageSummary] = useState<any[]>([])
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false) // New state for password modal
  const [showUserGuideModal, setShowUserGuideModal] = useState(false) // State for User Guide popup

  const encrypt = (data: string): string => {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
  }

  const decrypt = (cipher: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (err) {
      console.error("Decryption failed:", err)
      return ""
    }
  }

  const formatFloatHours = (hours: number): string => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  }

  const fetchInstances = async (userEmail: string) => {
    try {
      setLoading(true)
      const res = await fetch("/api/lab-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          path: "/instances",
          method: "GET",
        }),
      })
      const data = await res.json()
      setInstances(data)
    } catch (error) {
      console.error("Error fetching instances:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageSummary = async (userEmail: string) => {
    try {
      setRefreshingUsage(true) // Use renamed state
      const res = await fetch("/api/lab-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          path: "/usage-summary",
          method: "POST",
          body: { email: userEmail },
        }),
      })
      if (!res.ok) throw new Error("Usage fetch failed")
      const data = await res.json()
      const summaries = data.UsageSummary || []
      const formatted: Record<string, any> = {}
      const processedTypes: Record<string, number> = {} // To store the count of each *cleaned* service type encountered so far

      summaries.forEach((summary: any) => {
        const originalType = summary.ServiceType
        // Remove the complex pattern: #number#timestamp-(description)
        // This handles patterns like: DataSources#100#2025-08-06T09:46:27-(Linux (Red Hat),OpenVPN)
        const cleanedType = originalType.replace(/#\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "")

        let finalServiceType = cleanedType
        if (processedTypes[cleanedType] === undefined) {
          processedTypes[cleanedType] = 1 // Start from 1 for first occurrence
        } else {
          processedTypes[cleanedType]++ // Increment for subsequent occurrences
        }

        // Only add number suffix if there are multiple instances
        if (processedTypes[cleanedType] > 1) {
          finalServiceType = `${cleanedType} ${processedTypes[cleanedType]}`
        }

        formatted[finalServiceType] = {
          quota_hours: summary.QuotaHours || 0,
          used_hours: summary.ConsumedHours || 0,
          balance_hours: summary.BalanceHours || 0,
          quota_days: summary.QuotaExpiryDays || 0,
          used_days: summary.ConsumedDays || 0,
          balance_days: summary.BalanceDays || 0,
          plan_start_date: summary.PlanStartDate || "",
          plan_end_date: summary.PlanEndDate || "",
        }
      })
      setUsage(formatted)
      setRawUsageSummary(summaries)
    } catch (err) {
      console.error("Error fetching usage summary:", err)
    } finally {
      setRefreshingUsage(false) // Use renamed state
    }
  }

  const fetchPemFiles = async (userEmail: string) => {
    try {
      const res = await fetch("/api/lab-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          path: "/get-user-keys",
          method: "POST",
          body: { email: userEmail },
        }),
      })
      const data = await res.json()
      setPemFiles(data.files || [])
    } catch (error) {
      console.error("Error fetching PEM files:", error)
    }
  }

  const checkIfUserHasLab = async (userEmail: string) => {
    try {
      const res = await fetch("/api/lab-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail,
        },
        body: JSON.stringify({
          path: "/check-user-lab",
          method: "POST",
          body: { email: userEmail },
        }),
      })
      const data = await res.json()
      setHasLab(data.hasLab || false)
      return data.hasLab
    } catch (error) {
      console.error("Error checking lab status:", error)
      setHasLab(false)
    }
  }

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential)
      const userEmail = decoded.email
      const fullName = decoded.name
      // Save in localStorage (your original code)
      localStorage.setItem("userEmail", encrypt(userEmail))
      localStorage.setItem("userName", encrypt(fullName))
      localStorage.setItem("loginTime", encrypt(Date.now().toString()))
      setEmail(userEmail)
      setUserName(fullName)
      // ✅ Send log to Splunk + GA4 for Google login
      try {
        const ip = await getClientIp() // same logic you used in page.tsx
        await logToSplunk({
          session: userEmail,
          action: "google_login",
          details: {
            title: "User logged in with Google",
            name: fullName,
            email: userEmail,
            ip,
          },
        })
        // Count logins per user in localStorage
        const loginKey = `google_login_count_${userEmail}`
        const currentCount = Number.parseInt(localStorage.getItem(loginKey) || "0", 10) + 1
        localStorage.setItem(loginKey, currentCount.toString())
        // Set user ID and user property for GA4
        sendToGA4({
          action: "google_login",
          params: {
            user_id: userEmail,
            google_login_count: currentCount,
            name: fullName,
            email: userEmail,
            ip,
          },
        })
      } catch (err) {
        console.error("Google login log failed:", err)
      }
      const userHasLab = await checkIfUserHasLab(userEmail)
      if (userHasLab) {
        fetchInstances(userEmail)
        fetchUsageSummary(userEmail)
        fetchPemFiles(userEmail)
      }
    }
  }

  useEffect(() => {
    const encryptedEmail = localStorage.getItem("userEmail")
    const encryptedLoginTime = localStorage.getItem("loginTime")
    if (encryptedEmail && encryptedLoginTime) {
      const storedEmail = decrypt(encryptedEmail)
      const encryptedName = localStorage.getItem("userName")
      const storedName = encryptedName ? decrypt(encryptedName) : ""
      setUserName(storedName)
      const loginTime = Number.parseInt(decrypt(encryptedLoginTime), 10)
      const now = new Date().getTime()
      const timeElapsed = now - loginTime
      if (timeElapsed < SESSION_DURATION_MS) {
        setEmail(storedEmail)
        checkIfUserHasLab(storedEmail).then((has) => {
          if (has) {
            fetchInstances(storedEmail)
            fetchUsageSummary(storedEmail)
            fetchPemFiles(storedEmail)
          }
        })
      } else {
        localStorage.removeItem("userEmail")
        localStorage.removeItem("loginTime")
        localStorage.removeItem("userName")
        setUserName("")
      }
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    // Pause auto-refresh if password modal is open
    if (email && hasLab && instances.length > 0 && !isPasswordModalOpen) {
      interval = setInterval(() => {
        fetchInstances(email)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [email, hasLab, instances.length, isPasswordModalOpen]) // Added isPasswordModalOpen as dependency

  const handleLogout = () => setShowLogoutModal(true)

  const confirmLogout = () => {
    localStorage.removeItem("userEmail")
    localStorage.removeItem("loginTime")
    localStorage.removeItem("userName")
    setEmail("")
    setInstances([])
    setUsage(null)
    setHasLab(null)
    setPemFiles([])
    setShowLogoutModal(false)
  }

  const cancelLogout = () => setShowLogoutModal(false)

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <header className="border-b border-gray-100 bg-white/95 sticky top-0 z-40 px-5">
        <div className="flex items-center justify-between py-4">
          {/* Left Side: Logo */}
          <div className="flex items-center gap-3 h-12">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white font-heading">
                <Link href="/" passHref>
                  <span className="text-green-600">Soft</span> Mania
                </Link>
              </span>
            </div>
          </div>

          {/* Right Side: Title */}
          <h2 className="text-xl font-extrabold text-gray-800">Lab Manager</h2>
        </div>
      </header>
      <div style={{ padding: 20 }}>
        {!email ? (
          <div className="flex flex-col items-center justify-center mt-16">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Login using Google</h2>
            <GoogleLogin onSuccess={handleLogin} onError={() => console.log("Login Failed")} />
          </div>
        ) : hasLab === null ? (
          <div className="text-center mt-10 text-gray-600">Checking your lab assignment...</div>
        ) : hasLab ? (
          <>
            <div className="bg-[#f4f6fa] shadow-sm rounded-lg px-5 pt-3 pb-3 mb-6">
              {/* Header Section: Welcome on left, buttons on right */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Left: Welcome Text */}
                <div>
                  <h2 className="text-lg text-[#2c3e50] font-bold">
                    Welcome back, <span className="text-[#007acc]">{userName}</span>
                  </h2>
                  <p className="text-sm text-[#34495e]">
                    This is your personal <strong>Lab Server Manager Dashboard</strong> 🚀
                  </p>
                </div>
                {/* Right: User Guide and Logout buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUserGuideModal(true)}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-3 py-1 rounded-lg font-medium shadow-lg hover:from-green-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    User Guide
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-3 text-sm py-1 rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Trouble accessing your server? Email{" "}
                <a href="mailto:labsupport@softmania.in" className="text-blue-600 underline">
                  labsupport@softmania.in
                </a>
                .
              </p>
            </div>
            <EC2Table
              email={email}
              instances={instances}
              setInstances={setInstances}
              loading={loading}
              rawUsageSummary={rawUsageSummary}
              fetchUsageSummary={() => fetchUsageSummary(email)} // Pass the function
              isRefreshingUsage={refreshingUsage} // Pass the state
              hasLab={hasLab} // Add this line
              onPasswordModalOpenChange={setIsPasswordModalOpen} // Pass the new handler
            />
            {pemFiles.length > 0 && (
              <div className="bg-white shadow-md rounded-2xl p-5 mb-6 border border-gray-200 mt-[10px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">SSH PEM Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pemFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border hover:shadow-lg transition-all duration-300"
                    >
                      <span className="font-medium text-gray-700">{file.filename}</span>
                      <a
                        href={file.url}
                        download={file.filename}
                        onClick={async () => {
                          const ip = await getClientIp()
                          await logToSplunk({
                            session: email,
                            action: "pem_download",
                            details: {
                              title: "PEM file downloaded",
                              file: file.filename,
                              email,
                              ip,
                            },
                          })
                        }}
                        className="text-green-600 hover:text-green-800 flex items-center gap-2"
                      >
                        <span className="hidden sm:inline">Download</span>
                        <DownloadIcon className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-20 max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">👋 Welcome to SoftMania Labs</h3>
            <p className="text-teal-500 font-semibold mb-2">It looks like you don’t have a lab assigned yet.</p>
            <p className="text-gray-500">Choose a plan to get started with your personalized lab setup.</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push("/")}
                className="w-full bg-green-600 hover:bg-green-700 transition-colors text-white font-medium py-2 rounded-xl shadow-sm"
              >
                Choose Lab Plan
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl border border-gray-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout from your Lab Manager Dashboard?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button onClick={confirmLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {showUserGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold"></h3>
              </div>
              <button
                onClick={() => setShowUserGuideModal(false)}
                className="text-white hover:text-gray-400 text-2xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* Embedded iframe content */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src="https://documents.softmania.in/external/manual/user-guides/article/how-to-connect-splunk-server-backend?p=8925397ddf335351a1488377eefdb7c536bd7c9180e8f14e4f4f3d5d73c409c7"
                className="w-full h-full border-0"
                title="User Guide"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  )
}

export default LabManagerClient
