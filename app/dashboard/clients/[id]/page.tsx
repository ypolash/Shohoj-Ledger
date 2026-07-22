"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientWorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "CONTACTS" | "DOCUMENTS" | "PROJECTS" | "TIMELINE">("OVERVIEW");

  useEffect(() => {
    fetchClient();
  }, []);

  const fetchClient = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      const res = await fetch(`/api/clients/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchClient();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Loading Client Workspace...</div>;
  if (!client) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Client not found</div>;

  return (
    <div className="animate-fade-in container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "var(--spacing-6)" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {client.clientCode}
            </span>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{client.name}</h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Industry: {client.industry || 'N/A'} • Location: {client.city || 'N/A'}, {client.country || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="input" 
            value={client.status} 
            onChange={handleStatusChange}
            style={{ fontWeight: "bold", width: "auto" }}
          >
            {["ACTIVE", "INACTIVE", "LEAD"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard/clients/list")}>
            Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--spacing-6)', overflowX: 'auto' }}>
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'CONTACTS', label: `Contacts (${client.contacts?.length || 0})` },
          { id: 'DOCUMENTS', label: `Documents (${client.documents?.length || 0})` },
          { id: 'PROJECTS', label: `Projects & Leads (${(client.projects?.length || 0) + (client.leads?.length || 0)})` },
          { id: 'TIMELINE', label: 'Timeline & Audit' },
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Company Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Email</strong>{client.email || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Phone</strong>{client.phone || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Alt Phone</strong>{client.altPhone || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Website</strong>{client.website ? <a href={client.website} target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>{client.website}</a> : '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Business Type</strong>{client.businessType || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Tax/VAT Number</strong>{client.taxNumber || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Address</strong>{client.address || '-'}, {client.city || ''}, {client.postalCode || ''}, {client.country || ''}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Notes</strong>{client.notes || '-'}</div>
            </div>
          </div>
          <div className="glass-card">
             <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Summary Metrics</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Projects Active</span>
                 <span style={{ fontWeight: 'bold' }}>{client.projects.filter((p:any) => p.status === 'Active').length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Projects Completed</span>
                 <span style={{ fontWeight: 'bold' }}>{client.projects.filter((p:any) => p.status === 'Completed').length}</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Leads Converted</span>
                 <span style={{ fontWeight: 'bold' }}>{client.leads.filter((l:any) => l.status === 'Won').length}</span>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* CONTACTS TAB */}
      {activeTab === "CONTACTS" && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>Contact Persons</h2>
            <button className="btn btn-secondary" onClick={() => alert('Add Contact Modal')}>+ Add Contact</button>
          </div>
          {client.contacts?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Designation</th>
                  <th style={{ padding: '12px' }}>Email</th>
                  <th style={{ padding: '12px' }}>Phone / Mobile</th>
                  <th style={{ padding: '12px' }}>Primary</th>
                </tr>
              </thead>
              <tbody>
                {client.contacts.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '12px' }}>{c.designation || '-'}</td>
                    <td style={{ padding: '12px' }}>{c.email || '-'}</td>
                    <td style={{ padding: '12px' }}>{c.phone || c.mobile || '-'}</td>
                    <td style={{ padding: '12px' }}>{c.isPrimary ? <span style={{ color: 'var(--success)' }}>Yes</span> : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No contacts found. Add a contact person to this client.</div>
          )}
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === "DOCUMENTS" && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>Client Documents</h2>
            <button className="btn btn-secondary" onClick={() => alert('Upload Document Modal')}>+ Upload Document</button>
          </div>
          {client.documents?.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {client.documents.map((d: any) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--background-alt)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '32px', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>description</span>
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.type} • {new Date(d.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>By {d.uploadedBy?.name}</div>
                  </div>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px' }}>View</a>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>No documents uploaded.</div>
          )}
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === "PROJECTS" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Linked Projects</h2>
            {client.projects?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px' }}>Code</th>
                    <th style={{ padding: '12px' }}>Name</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Progress</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {client.projects.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px' }}>{p.projectCode}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '12px' }}>{p.status}</td>
                      <td style={{ padding: '12px' }}>{p.progress}%</td>
                      <td style={{ padding: '12px' }}><Link href={`/dashboard/projects/${p.id}`} style={{ color: 'var(--primary)' }}>View Project</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={{ color: 'var(--text-muted)' }}>No projects linked to this client.</div>}
          </div>

          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Linked Leads</h2>
            {client.leads?.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px' }}>Lead Company</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Expected Value</th>
                    <th style={{ padding: '12px' }}>Next Follow Up</th>
                  </tr>
                </thead>
                <tbody>
                  {client.leads.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{l.companyName}</td>
                      <td style={{ padding: '12px' }}>{l.status}</td>
                      <td style={{ padding: '12px' }}>{l.expectedValue}</td>
                      <td style={{ padding: '12px' }}>{l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={{ color: 'var(--text-muted)' }}>No leads linked to this client.</div>}
          </div>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "TIMELINE" && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Client History</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
            
            {client.activities?.length > 0 ? (
              client.activities.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: act.type === 'CREATED' ? 'var(--success)' : 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {act.type === 'CREATED' ? 'add_business' : act.type === 'DOC_UPLOADED' ? 'description' : 'history'}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--background-alt)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>{act.type.replace(/_/g, " ")}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
                      {act.description}
                    </div>
                    {(act.oldValue || act.newValue) && (
                      <div style={{ fontSize: '12px', backgroundColor: 'var(--background)', padding: '6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        {act.oldValue} ➔ <strong>{act.newValue}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                      {act.performedBy?.name || 'System'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ paddingLeft: '40px', color: 'var(--text-muted)' }}>No activities recorded yet.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
