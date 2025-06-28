'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Copy, Loader2, RefreshCcw } from 'lucide-react';

interface EC2Instance {
  Name: string;
  InstanceId: string;
  State: string;
  PrivateIp: string;
  PublicIp: string;
  SSHCommand: string;
  Region: string;
}

interface EC2TableProps {
  email: string;
  instances: EC2Instance[];
  setInstances: React.Dispatch<React.SetStateAction<EC2Instance[]>>;
  loading: boolean;
}

const EC2Table: React.FC<EC2TableProps> = ({ email, instances, setInstances, loading }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

  const [disabledButtons, setDisabledButtons] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const isCooldown = (instanceId: string, action: string) =>
    disabledButtons[`${instanceId}_${action}`];

  const handleButtonClick = async (action: string, instanceId: string) => {
    const key = `${instanceId}_${action}`;
    setDisabledButtons(prev => ({ ...prev, [key]: true }));
    setLoadingAction(key);

    await callAction(action, instanceId);

    setTimeout(() => {
      setDisabledButtons(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      setLoadingAction(null);
    }, 5000);
  };

  const callAction = async (action: string, instanceId: string) => {
    const instance = instances.find(inst => inst.InstanceId === instanceId);
    if (!instance) return;

    await axios.post(`${apiUrl}/${action}`, {
      instance_id: instanceId,
      region: instance.Region,
    }, {
      headers: { Authorization: `Bearer ${email}` }
    });

    await fetchInstances();
  };

  const fetchInstances = async () => {
    try {
      setRefreshing(true);
      const res = await axios.get(`${apiUrl}/instances`, {
        headers: { Authorization: `Bearer ${email}` }
      });
      setInstances(res.data);
    } catch (error) {
      console.error("Error fetching instances:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (email) {
      const interval = setInterval(() => {
        fetchInstances();
      }, 30000); // 🔄 Auto refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [email]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const renderCopyField = (text: string, fieldId: string) => (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{ marginRight: 6 }}>{text}</span>
      <div
        onClick={() => handleCopy(text, fieldId)}
        style={{
          cursor: 'pointer',
          padding: 2,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
        }}
      >
        <Copy size={14} color="#4b5563" />
      </div>
      {copiedField === fieldId && (
        <div style={{
          position: 'absolute',
          top: '-20px',
          left: 0,
          backgroundColor: '#10b981',
          color: 'white',
          fontSize: '0.7rem',
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
        }}>
          Copied!
        </div>
      )}
    </div>
  );

  const baseStyle: React.CSSProperties = {
    padding: '6px 14px',
    marginRight: '6px',
    fontSize: '0.85rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Inter, sans-serif',
    color: 'white',
    whiteSpace: 'nowrap',
  };

  const actionStyles: Record<string, { backgroundColor: string; hover: string }> = {
    start: {
      backgroundColor: '#10b981',
      hover: '#059669',
    },
    stop: {
      backgroundColor: '#ef4444',
      hover: '#dc2626',
    },
    reboot: {
      backgroundColor: '#f59e0b',
      hover: '#d97706',
    },
  };

  const renderButton = (label: string, action: string, instanceId: string) => {
    const key = `${instanceId}_${action}`;
    const disabled = isCooldown(instanceId, action);
    const isLoading = loadingAction === key;

    return (
      <button
        onClick={() => handleButtonClick(action, instanceId)}
        style={{
          ...baseStyle,
          backgroundColor: disabled
            ? '#9ca3af'
            : actionStyles[action].backgroundColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            (e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            (e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].backgroundColor;
          }
        }}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : label}
      </button>
    );
  };

  if (loading && instances.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={20} className="animate-spin mr-2 text-gray-500" />
        <span className="text-gray-700 font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800"></h2>
        <button
          onClick={fetchInstances}
          disabled={refreshing}
          className={`p-2 rounded-full ${refreshing ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-gray-700'} text-white`}
          title="Refresh"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div
        style={{
          overflowX: 'auto',
          width: '100%',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 800,
            fontSize: '0.95rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Server Name</th> {/* Updated label */}
              <th style={{ padding: '10px' }}>State</th>
              <th style={{ padding: '10px' }}>Private IP</th>
              <th style={{ padding: '10px' }}>Public IP</th>
              <th style={{ padding: '10px' }}>SSH Command</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((inst) => {
              const state = inst.State.toLowerCase();
              const isStopped = state === 'stopped';
              const isRunning = state === 'running';
              const isMutedState = ['pending', 'starting'].includes(state);
              const isBusyState = ['pending', 'starting', 'stopping', 'rebooting'].includes(state);

              return (
                <tr key={inst.InstanceId} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px' }}>{inst.Name}</td>
                  <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {inst.State}
                    {isBusyState && <Loader2 size={14} className="animate-spin text-gray-500" />}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {inst.PrivateIp ? renderCopyField(inst.PrivateIp, `${inst.InstanceId}_private`) : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {inst.PublicIp ? renderCopyField(inst.PublicIp, `${inst.InstanceId}_public`) : '-'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {inst.State === 'running' && inst.PublicIp && inst.SSHCommand ? (
                      renderCopyField(inst.SSHCommand, `${inst.InstanceId}_ssh`)
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                    {!isMutedState && isStopped && renderButton('Start', 'start', inst.InstanceId)}
                    {!isMutedState && isRunning && (
                      <>
                        {renderButton('Stop', 'stop', inst.InstanceId)}
                        {renderButton('Reboot', 'reboot', inst.InstanceId)}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EC2Table;
