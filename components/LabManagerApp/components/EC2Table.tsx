'use client';

import React from 'react';
import axios from 'axios';

interface EC2Instance {
  Name: string;
  InstanceId: string;
  State: string;
  PrivateIp: string;
  PublicIp: string;
  SSHCommand: string;
}

interface EC2TableProps {
  email: string;
  instances: EC2Instance[];
  setInstances: React.Dispatch<React.SetStateAction<EC2Instance[]>>;
}

const EC2Table: React.FC<EC2TableProps> = ({ email, instances, setInstances }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL as string;

  const callAction = async (action: string, instanceId: string) => {
    await axios.post(`${apiUrl}/${action}`, { instance_id: instanceId }, {
      headers: { Authorization: `Bearer ${email}` }
    });

    const res = await axios.get(`${apiUrl}/instances`, {
      headers: { Authorization: `Bearer ${email}` }
    });
    setInstances(res.data);
  };

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

  const getButton = (label: string, action: string, instanceId: string) => (
    <button
      onClick={() => callAction(action, instanceId)}
      style={{
        ...baseStyle,
        backgroundColor: actionStyles[action].backgroundColor,
      }}
      onMouseEnter={(e) =>
        (e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].hover
      }
      onMouseLeave={(e) =>
        (e.target as HTMLButtonElement).style.backgroundColor = actionStyles[action].backgroundColor
      }
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        overflowX: 'auto',
        width: '100%',
        marginTop: 20,
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
            <th style={{ padding: '10px' }}>Instance Name</th>
            <th style={{ padding: '10px' }}>Instance ID</th>
            <th style={{ padding: '10px' }}>State</th>
            <th style={{ padding: '10px' }}>Private IP</th>
            <th style={{ padding: '10px' }}>Public IP</th>
            <th style={{ padding: '10px' }}>SSH Command</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {instances.map((inst) => (
            <tr key={inst.InstanceId} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: '10px' }}>{inst.Name}</td>
              <td style={{ padding: '10px' }}>{inst.InstanceId}</td>
              <td style={{ padding: '10px' }}>{inst.State}</td>
              <td style={{ padding: '10px' }}>{inst.PrivateIp}</td>
              <td style={{ padding: '10px' }}>{inst.PublicIp}</td>
              <td style={{ padding: '10px' }}>
                {inst.State === 'running' && inst.PublicIp ? (
                  <code style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                    {inst.SSHCommand}
                  </code>
                ) : (
                  '-'
                )}
              </td>
              <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                {getButton('Start', 'start', inst.InstanceId)}
                {getButton('Stop', 'stop', inst.InstanceId)}
                {getButton('Reboot', 'reboot', inst.InstanceId)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EC2Table;
