"use client"

import { useState, useEffect, type JSX } from "react"
import { useRouter } from "next/navigation"
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import { jwtDecode } from "jwt-decode"
import EC2Table from "../LabManagerApp/components/EC2Table"
import { SoftmaniaLogo } from "@/components/softmania-logo"
import Link from "next/link"
import * as CryptoJS from "crypto-js"
import { DownloadIcon, RefreshCcw } from "lucide-react"
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

  const [refreshing, setRefreshing] = useState(false)
  const [pemFiles, setPemFiles] = useState<{ filename: string; url: string }[]>([])

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
      setRefreshing(true)
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
      summaries.forEach((summary: any) => {
        const type = summary.ServiceType
        formatted[type] = {
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
    } catch (err) {
      console.error("Error fetching usage summary:", err)
    } finally {
      setRefreshing(false)
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
    if (email && hasLab) {
      interval = setInterval(() => {
        fetchInstances(email)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [email, hasLab])

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

                {/* Right: Logout + Refresh */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchUsageSummary(email)}
                    disabled={refreshing}
                    className={`p-2 rounded-full ${
                      refreshing ? "bg-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-gray-700"
                    } text-white`}
                    title="Refresh Usage"
                  >
                    <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-3 text-sm py-1 rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Usage Section */}
              <div className="w-full px-3 sm:px-4">
                {usage &&
                  Object.entries(usage).map(([serviceType, u]) => (
                    <div key={serviceType} className="w-full text-sm sm:text-sm mt-3">
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">{serviceType} Usage</h3>

                      {(u.balance_hours <= 0 || u.balance_days <= 0) && (
                        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded px-3 py-1 mb-2">
                          ⚠️ <strong>Quota exhausted.</strong> Server will be terminated soon.
                        </div>
                      )}

                      {/* Desktop View */}
                      <div
                        className={`hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 rounded px-3 py-2 ${
                          u.balance_hours <= 0 || u.balance_days <= 0
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : "bg-green-50 border border-green-200 text-gray-800"
                        }`}
                      >
                        <span>
                          <strong>Quota:</strong> {formatFloatHours(u.quota_hours)} hrs
                        </span>
                        <span>
                          <strong>Used:</strong> {formatFloatHours(u.used_hours)} hrs
                        </span>
                        <span>
                          <strong>Left:</strong> {formatFloatHours(u.balance_hours)} hrs
                        </span>
                        <span className="text-gray-400">|</span>
                        <span>
                          <strong>Valid:</strong> {u.quota_days} days
                        </span>
                        <span>
                          <strong>Start:</strong> {u.plan_start_date || "N/A"}
                        </span>
                        <span className="flex items-center gap-2">
                          <strong>End:</strong> {u.plan_end_date || "N/A"}
                          <span className="text-red-500">(terminate)</span>
                        </span>
                      </div>

                      {/* Mobile View */}
                      <div
                        className={`sm:hidden flex flex-col gap-1 rounded px-3 py-2 ${
                          u.balance_hours <= 0 || u.balance_days <= 0
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : "bg-green-50 border border-green-200 text-gray-800"
                        }`}
                      >
                        <p>
                          <strong>Quota:</strong> {formatFloatHours(u.quota_hours)} hrs
                        </p>
                        <p>
                          <strong>Used:</strong> {formatFloatHours(u.used_hours)} hrs
                        </p>
                        <p>
                          <strong>Left:</strong> {formatFloatHours(u.balance_hours)} hrs
                        </p>
                        <p>
                          <strong>Valid:</strong> {u.quota_days} days
                        </p>
                        <p>
                          <strong>Start:</strong> {u.plan_start_date || "N/A"}
                        </p>
                        <p className="flex items-center gap-2">
                          <strong>End:</strong> {u.plan_end_date || "N/A"}
                          <span className="text-red-500">(terminate)</span>
                        </p>
                      </div>
                    </div>
                  ))}

                <p className="mt-3 text-sm text-gray-500">
                  Trouble accessing your server? Email{" "}
                  <a href="mailto:labsupport@softmania.in" className="text-blue-600 underline">
                    labsupport@softmania.in
                  </a>
                  .
                </p>
              </div>
            </div>

            <EC2Table email={email} instances={instances} setInstances={setInstances} loading={loading} />

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
            <p className="text-yellow-500 font-semibold mb-2">It looks like you don’t have a lab assigned yet.</p>
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
    </GoogleOAuthProvider>
  )
}
export default LabManagerClient
