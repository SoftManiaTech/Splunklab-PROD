'use client';

import React, { useState, useEffect, JSX } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import EC2Table from './components/EC2Table';
import { SoftmaniaLogo } from "@/components/softmania-logo";
import Link from 'next/link';
import * as CryptoJS from 'crypto-js';
import { DownloadIcon, RefreshCcw } from 'lucide-react';

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
  const [userName, setUserName] = useState<string>('');

  const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'softmania_secret';

  const [usage, setUsage] = useState<{
    quota_hours: number;
    used_hours: number;
    balance_hours: number;
    quota_days: number;
    used_days: number;
    balance_days: number;
    plan_start_date?: string;
    plan_end_date?: string;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [pemFiles, setPemFiles] = useState<{ filename: string; url: string }[]>([]);

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

  const formatFloatHours = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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
      setRefreshing(true);
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
        balance_days: data.BalanceDays || 0,
        plan_start_date: data.PlanStartDate || '',
        plan_end_date: data.PlanEndDate || ''
      });
    } catch (err) {
      console.error("Error fetching usage summary:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchPemFiles = async (userEmail: string) => {
    try {
      const res = await fetch(`${API_URL}/get-user-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      setPemFiles(data.files || []);
    } catch (error) {
      console.error('Error fetching PEM files:', error);
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
      const fullName = decoded.name;

      localStorage.setItem('userEmail', encrypt(userEmail));
      localStorage.setItem('userName', encrypt(fullName));
      localStorage.setItem('loginTime', encrypt(loginTime.toString()));

      setEmail(userEmail);
      setUserName(fullName);

      const userHasLab = await checkIfUserHasLab(userEmail);
      if (userHasLab) {
        fetchInstances(userEmail);
        fetchUsageSummary(userEmail);
        fetchPemFiles(userEmail);
      }
    }
  };

  useEffect(() => {
    const encryptedEmail = localStorage.getItem('userEmail');
    const encryptedLoginTime = localStorage.getItem('loginTime');

    if (encryptedEmail && encryptedLoginTime) {
      const storedEmail = decrypt(encryptedEmail);
      const encryptedName = localStorage.getItem('userName');
      const storedName = encryptedName ? decrypt(encryptedName) : '';
      setUserName(storedName);

      const loginTime = parseInt(decrypt(encryptedLoginTime), 10);

      const now = new Date().getTime();
      const timeElapsed = now - loginTime;

      if (timeElapsed < SESSION_DURATION_MS) {
        setEmail(storedEmail);
        checkIfUserHasLab(storedEmail).then((has) => {
          if (has) {
            fetchInstances(storedEmail);
            fetchUsageSummary(storedEmail);
            fetchPemFiles(storedEmail);
          }
        });
      } else {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('userName');
        setUserName('');
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
    localStorage.removeItem('userName');
    setEmail('');
    setInstances([]);
    setUsage(null);
    setHasLab(null);
    setPemFiles([]);
    setShowLogoutModal(false);
  };
  const cancelLogout = () => setShowLogoutModal(false);


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
            <EC2Table
              email={email}
              instances={instances}
              setInstances={setInstances}
              loading={loading}
            />

            {pemFiles.length > 0 && (
              <div className="bg-white shadow-md rounded-2xl p-5 mb-6 border border-gray-200 mt-[10px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">SSH PEM Files</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {pemFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border hover:shadow-lg transition-all duration-300"
                    >
                      <span className="font-medium text-gray-700">{file.filename}</span>
                      <a
                        href={file.url}
                        download={file.filename}
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
                onClick={() => router.push('/')}
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