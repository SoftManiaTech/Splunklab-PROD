'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import EC2Table from './components/EC2Table';
import { SoftmaniaLogo } from "@/components/softmania-logo";
import Link from 'next/link';
import * as CryptoJS from 'crypto-js';

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function App(): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hasLab, setHasLab] = useState<boolean | null>(null);
  const router = useRouter();

  const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'softmania_secret';

  const [usage, setUsage] = useState<{
    quota_hours: number;
    used_hours: number;
    balance_hours: number;
    quota_days: number;
    used_days: number;
    balance_days: number;
  } | null>(null);

  const encrypt = (data: string): string => {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  };

  const decrypt = (cipher: string): string => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      console.error('Decryption failed:', err);
      return '';
    }
  };

  const getUsernameFromEmail = (email: string): string => {
    if (!email) return '';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const fetchInstances = async (userEmail: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/instances`, {
        headers: { Authorization: `Bearer ${userEmail}` },
      });
      const data = await res.json();
      setInstances(data);
    } catch (error) {
      console.error("Error fetching instances:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageSummary = async (userEmail: string) => {
    try {
      const res = await fetch(`${API_URL}/usage-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) throw new Error("Usage fetch failed");

      const data = await res.json();

      setUsage({
        quota_hours: data.QuotaHours || 0,
        used_hours: data.ConsumedHours || 0,
        balance_hours: data.BalanceHours || 0,
        quota_days: data.QuotaExpiryDays || 0,
        used_days: data.ConsumedDays || 0,
        balance_days: data.BalanceDays || 0
      });
    } catch (err) {
      console.error("Error fetching usage summary:", err);
    }
  };

  const checkIfUserHasLab = async (userEmail: string) => {
    try {
      const res = await fetch(`${API_URL}/check-user-lab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();
      setHasLab(data.hasLab || false);
      return data.hasLab;
    } catch (error) {
      console.error("Error checking lab status:", error);
      setHasLab(false);
    }
  };

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email;
      const loginTime = new Date().getTime();

      localStorage.setItem('userEmail', encrypt(userEmail));
      localStorage.setItem('loginTime', encrypt(loginTime.toString()));

      setEmail(userEmail);

      const userHasLab = await checkIfUserHasLab(userEmail);
      if (userHasLab) {
        fetchInstances(userEmail);
        fetchUsageSummary(userEmail);
      }
    }
  };

  useEffect(() => {
    const encryptedEmail = localStorage.getItem('userEmail');
    const encryptedLoginTime = localStorage.getItem('loginTime');

    if (encryptedEmail && encryptedLoginTime) {
      const storedEmail = decrypt(encryptedEmail);
      const loginTime = parseInt(decrypt(encryptedLoginTime), 10);

      const now = new Date().getTime();
      const timeElapsed = now - loginTime;

      if (timeElapsed < SESSION_DURATION_MS) {
        setEmail(storedEmail);
        checkIfUserHasLab(storedEmail).then((has) => {
          if (has) {
            fetchInstances(storedEmail);
            fetchUsageSummary(storedEmail);
          }
        });
      } else {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loginTime');
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (email && hasLab) {
      interval = setInterval(() => {
        fetchInstances(email);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [email, hasLab]);

  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    setEmail('');
    setInstances([]);
    setUsage(null);
    setHasLab(null);
    setShowLogoutModal(false);
  };
  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <header className="border-b border-gray-100 bg-white/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" passHref><SoftmaniaLogo size="md" /></Link>
          <h2 className="text-xl font-extrabold text-gray-800">Lab Manager Portal</h2>
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
            <div className="bg-[#f4f6fa] shadow-sm rounded-lg p-5 mb-6">
              <h2 className="text-lg text-[#2c3e50] font-bold">
                Welcome back, <span className="text-[#007acc]">{getUsernameFromEmail(email)}</span>
              </h2>
              <p className="text-sm text-[#34495e]">This is your personal <strong>Lab server Manager Dashboard</strong> 🚀</p>

              {usage && (
                <div className="w-full text-sm mt-4">
                  {(usage.balance_hours <= 0 || usage.balance_days <= 0) && (
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md px-4 py-2 mb-3">
                      ⚠️ <strong>Your purchased quota has finished.</strong> Your instance will be terminated soon.
                    </div>
                  )}

                  {/* Desktop View */}
                  <div className={`hidden sm:flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3 ${usage.balance_hours <= 0 || usage.balance_days <= 0
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-gray-800'
                    }`}>
                    <span><strong>Quota Hours:</strong> {usage.quota_hours} hrs</span>
                    <span><strong>Used Hours:</strong> {usage.used_hours.toFixed(1)} hrs</span>
                    <span><strong>Balance Hours:</strong> {usage.balance_hours.toFixed(1)} hrs</span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span><strong>Quota Days:</strong> {usage.quota_days} days</span>
                    <span><strong>Used Days:</strong> {usage.used_days.toFixed(1)} days</span>
                    <span><strong>Balance Days:</strong> {usage.balance_days.toFixed(1)} days</span>
                  </div>

                  {/* Mobile View */}
                  <div className={`sm:hidden flex flex-col gap-3 rounded-lg px-4 py-3 ${usage.balance_hours <= 0 || usage.balance_days <= 0
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-green-50 border border-green-200 text-gray-800'
                    }`}>
                    <div className="flex flex-col gap-1">
                      <p><strong>Quota Days:</strong> {usage.quota_days} days</p>
                      <p><strong>Used Days:</strong> {usage.used_days.toFixed(1)} days</p>
                      <p><strong>Balance Days:</strong> {usage.balance_days.toFixed(1)} days</p>
                    </div>
                    <div className="flex flex-col gap-1 pt-2 border-t border-current">
                      <p><strong>Quota Hours:</strong> {usage.quota_hours} hrs</p>
                      <p><strong>Used Hours:</strong> {usage.used_hours.toFixed(1)} hrs</p>
                      <p><strong>Balance Hours:</strong> {usage.balance_hours.toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <EC2Table
              email={email}
              instances={instances}
              setInstances={setInstances}
              loading={loading}
            />

            <div className="text-right mt-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="mt-20 max-w-md mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">👋 Welcome to Softmania Labs</h3>
            <p className="text-yellow-500 font-semibold mb-2">It looks like you don’t have a lab assigned yet.</p>
            <p className="text-gray-500">Choose a plan to get started with your personalized lab setup.</p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-medium py-2 rounded-xl shadow-sm"
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
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout from your Lab Manager Dashboard?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </GoogleOAuthProvider>
  );
}

export default App;
