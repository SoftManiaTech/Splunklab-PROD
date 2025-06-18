'use client';

import React, { useState, useEffect, JSX } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import EC2Table from './components/EC2Table';

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID as string;
const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function App(): JSX.Element {
  const [email, setEmail] = useState<string>('');
  const [instances, setInstances] = useState<any[]>([]);

  const getUsernameFromEmail = (email: string): string => {
    if (!email) return '';
    const namePart = email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const fetchInstances = async (userEmail: string) => {
    try {
      const res = await fetch(`${API_URL}/instances`, {
        headers: { Authorization: `Bearer ${userEmail}` },
      });
      const data = await res.json();
      setInstances(data);
    } catch (error) {
      console.error("Error fetching instances:", error);
    }
  };

  const handleLogin = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const userEmail = decoded.email;

      const loginTime = new Date().getTime();
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('loginTime', loginTime.toString());

      setEmail(userEmail);
      fetchInstances(userEmail);
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const loginTime = localStorage.getItem('loginTime');

    if (storedEmail && loginTime) {
      const now = new Date().getTime();
      const timeElapsed = now - parseInt(loginTime, 10);

      if (timeElapsed < SESSION_DURATION_MS) {
        setEmail(storedEmail);
        fetchInstances(storedEmail);
      } else {
        localStorage.removeItem('userEmail');
        localStorage.removeItem('loginTime');
      }
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (email) {
      interval = setInterval(() => {
        fetchInstances(email);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [email]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    setEmail('');
    setInstances([]);
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div style={{ padding: 20 }}>
        <h2 style={{ marginTop: 5, marginBottom: 20, fontSize: '2rem', fontWeight: '700', color: '#34495e' }}>EC2 Manager Portal</h2>

        {email && (
          <div style={{
            marginBottom: 30,
            padding: 15,
            borderRadius: 10,
            backgroundColor: '#f4f6fa',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>
              👋 Welcome back, <span style={{ color: '#007acc' }}>{getUsernameFromEmail(email)}</span>
            </h2>
            <p style={{ marginTop: 5, fontSize: '1.1rem', color: '#34495e' }}>
              This is your personal <strong>EC2 Instance Manager Dashboard</strong> 🚀
            </p>
            <button onClick={handleLogout} style={{
              marginTop: 10,
              padding: '8px 16px',
              borderRadius: 6,
              backgroundColor: '#e74c3c',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}>🔓 Logout</button>
          </div>
        )}

        {!email ? (
          <GoogleLogin
            onSuccess={handleLogin}
            onError={() => console.log("Login Failed")}
          />
        ) : (
          <EC2Table email={email} instances={instances} setInstances={setInstances} />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
