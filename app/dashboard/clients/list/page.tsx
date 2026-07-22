"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientListPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${search}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'var(--success)';
      case 'INACTIVE': return 'var(--danger)';
      case 'LEAD': return 'var(--warning)';
      default: return 'var(--text)';
    }
  };

  return (
    <div className="animate-fade-in container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Client Directory</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage your company's customer and client relationships.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => alert('New Client modal would open here')}>
            <span className="material-symbols-outlined">person_add</span>
            New Client
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "var(--spacing-6)", display: "flex", gap: "12px" }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Search clients..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="LEAD">Lead</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px' }}>Code</th>
              <th style={{ padding: '12px' }}>Company Name</th>
              <th style={{ padding: '12px' }}>Industry</th>
              <th style={{ padding: '12px' }}>Contacts</th>
              <th style={{ padding: '12px' }}>Projects</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading clients...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No clients found.</td></tr>
            ) : (
              clients.map(client => (
                <tr 
                  key={client.id} 
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  className="hover-row"
                >
                  <td style={{ padding: '12px', fontWeight: 500 }}>{client.clientCode}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{client.email || client.phone || 'No Contact Info'}</div>
                  </td>
                  <td style={{ padding: '12px' }}>{client.industry || '-'}</td>
                  <td style={{ padding: '12px' }}>{client._count.contacts}</td>
                  <td style={{ padding: '12px' }}>{client._count.projects}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: 'var(--background-alt)', 
                      color: getStatusColor(client.status),
                      border: `1px solid ${getStatusColor(client.status)}`,
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 
                    }}>
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
