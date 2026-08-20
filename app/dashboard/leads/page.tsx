"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Lead = {
  id: string;
  serialNumber: number;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  serviceType: string;
  expectedValue: string | number; // Decimal string from prisma
  leadSource: string | null;
  assignedTo: string | null;
  nextFollowUp: string | null;
  notes: string | null;
  status: string;
  lostReason: string | null;
  createdAt: string;
};

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterService, setFilterService] = useState('');
  
  // New Lead Form State
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    serviceType: 'Development',
    expectedValue: '',
    leadSource: '',
    assignedTo: '',
    nextFollowUp: '',
    notes: ''
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expectedValue: Number(formData.expectedValue)
        })
      });
      if (res.ok) {
        setFormData({
          companyName: '',
          contactPerson: '',
          phone: '',
          email: '',
          serviceType: 'Development',
          expectedValue: '',
          leadSource: '',
          assignedTo: '',
          nextFollowUp: '',
          notes: ''
        });
        setActiveTab('all');
        fetchLeads();
      }
    } catch (err) {
      console.error("Failed to create lead", err);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, lostReason?: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, lostReason })
      });
      fetchLeads();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleMarkFollowedUp = async (id: string) => {
    try {
      // Just clear next follow up or set to future. For now, clear it.
      await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextFollowUp: null })
      });
      fetchLeads();
    } catch (err) {
      console.error("Failed to mark followed up", err);
    }
  };

  const handleConvertToProject = async (id: string) => {
    if (confirm("Are you sure you want to convert this won lead to a project?")) {
      try {
        const res = await fetch(`/api/leads/${id}/convert`, {
          method: 'POST'
        });
        if (res.ok) {
          alert("Successfully converted to Project and Income generated.");
          fetchLeads();
        } else {
          const err = await res.json();
          alert("Error: " + err.message);
        }
      } catch (err) {
        console.error("Failed to convert", err);
      }
    }
  };

  const filteredLeads = leads.filter(l => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterService && l.serviceType !== filterService) return false;
    return true;
  });

  const activeLeadsCount = leads.filter(l => !['Won', 'Lost', 'Converted'].includes(l.status)).length;
  const wonLeadsCount = leads.filter(l => l.status === 'Won').length;
  const totalLeadsCount = leads.length;
  const conversionRate = totalLeadsCount > 0 ? ((wonLeadsCount / totalLeadsCount) * 100).toFixed(1) : '0.0';
  const expectedValueSum = leads.filter(l => !['Won', 'Lost', 'Converted'].includes(l.status)).reduce((sum, l) => sum + Number(l.expectedValue), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#3b82f6';
      case 'Contacted': return '#8b5cf6';
      case 'Meeting Scheduled': return '#f59e0b';
      case 'Proposal Sent': return '#06b6d4';
      case 'Negotiation': return '#eab308';
      case 'Won': return '#10b981';
      case 'Lost': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  // Pipeline statuses
  const pipelineStatuses = ['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation'];

  // Follow up logic
  const isOverdueOrToday = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return d.getTime() <= today.getTime();
  };
  const followUpLeads = leads.filter(l => !['Won', 'Lost', 'Converted'].includes(l.status) && isOverdueOrToday(l.nextFollowUp));

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Lead Management</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Track, nurture, and convert potential clients.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', overflowX: 'auto' }}>
        {['dashboard', 'all', 'new', 'pipeline', 'followups', 'won', 'lost'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === tab ? '#fff' : '#94a3b8',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'capitalize'
            }}
          >
            {tab === 'dashboard' ? 'Overview' : tab === 'followups' ? 'Follow Ups' : tab === 'new' ? 'New Lead' : `${tab} Leads`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading leads...</div>
      ) : (
        <>
          {/* DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total Leads</span>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>{totalLeadsCount}</div>
                </div>
                <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Active Leads</span>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#3b82f6' }}>{activeLeadsCount}</div>
                </div>
                <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Won Leads</span>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#10b981' }}>{wonLeadsCount}</div>
                </div>
                <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Conversion Rate</span>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#f59e0b' }}>{conversionRate}%</div>
                </div>
                <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Expected Pipeline (BDT)</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', color: '#8b5cf6' }}>{formatCurrency(expectedValueSum)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ALL LEADS */}
          {activeTab === 'all' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Meeting Scheduled">Meeting Scheduled</option>
                  <option value="Proposal Sent">Proposal Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                  <option value="Converted">Converted</option>
                </select>
                <select 
                  value={filterService} 
                  onChange={e => setFilterService(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '8px' }}
                >
                  <option value="">All Services</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Contact</th>
                    <th style={{ padding: '12px' }}>Service</th>
                    <th style={{ padding: '12px' }}>Value</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px' }}>Next Follow Up</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px' }}>L-{String(l.serialNumber).padStart(4, '0')}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.companyName}</td>
                      <td style={{ padding: '12px' }}>{l.contactPerson}<br/><span style={{ fontSize: '11px', color: '#94a3b8' }}>{l.phone}</span></td>
                      <td style={{ padding: '12px' }}>{l.serviceType}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(l.expectedValue)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', background: `${getStatusColor(l.status)}33`, color: getStatusColor(l.status) }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No leads found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* NEW LEAD FORM */}
          {activeTab === 'new' && (
            <div className="glass-card" style={{ padding: '32px', borderRadius: '16px', maxWidth: '800px' }}>
              <h2 style={{ marginBottom: '24px', fontSize: '20px', fontFamily: 'serif' }}>Create New Lead</h2>
              <form onSubmit={handleCreateLead} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Company Name</label>
                  <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Contact Person</label>
                  <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Phone</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Email (Optional)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Service Type</label>
                  <select required value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Development">Development</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Expected Value (BDT)</label>
                  <input required type="number" value={formData.expectedValue} onChange={e => setFormData({...formData, expectedValue: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Next Follow Up Date</label>
                  <input type="date" value={formData.nextFollowUp} onChange={e => setFormData({...formData, nextFollowUp: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#94a3b8' }}>Notes</label>
                  <textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', resize: 'vertical' }}></textarea>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Save Lead
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* PIPELINE (Kanban) */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', minHeight: '600px' }}>
              {pipelineStatuses.map(status => (
                <div key={status} style={{ minWidth: '300px', flex: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: getStatusColor(status) }}>{status}</h3>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      {leads.filter(l => l.status === status).length}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leads.filter(l => l.status === status).map(l => (
                      <div key={l.id} className="glass-card" style={{ padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${getStatusColor(l.status)}` }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{l.companyName}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 8px 0' }}>{l.contactPerson}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8b5cf6' }}>{formatCurrency(l.expectedValue)}</span>
                          <select 
                            value={l.status} 
                            onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '11px', borderRadius: '4px', padding: '2px 4px' }}
                          >
                            {pipelineStatuses.concat(['Won', 'Lost']).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FOLLOW UPS */}
          {activeTab === 'followups' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Contact</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {followUpLeads.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.companyName}</td>
                      <td style={{ padding: '12px' }}>{l.contactPerson} - {l.phone}</td>
                      <td style={{ padding: '12px', color: '#ef4444', fontWeight: 'bold' }}>{l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => handleMarkFollowedUp(l.id)}
                          style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Mark Followed Up
                        </button>
                      </td>
                    </tr>
                  ))}
                  {followUpLeads.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No follow ups due today.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* WON LEADS */}
          {activeTab === 'won' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th style={{ padding: '12px' }}>Service</th>
                    <th style={{ padding: '12px' }}>Value</th>
                    <th style={{ padding: '12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.filter(l => l.status === 'Won').map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.companyName}</td>
                      <td style={{ padding: '12px' }}>{l.serviceType}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(l.expectedValue)}</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          onClick={() => handleConvertToProject(l.id)}
                          style={{ padding: '6px 12px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rocket_launch</span>
                          Convert to Project
                        </button>
                      </td>
                    </tr>
                  ))}
                  {leads.filter(l => l.status === 'Won').length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No won leads yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* LOST LEADS */}
          {activeTab === 'lost' && (
             <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
               <thead>
                 <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                   <th style={{ padding: '12px' }}>Company</th>
                   <th style={{ padding: '12px' }}>Service</th>
                   <th style={{ padding: '12px' }}>Value</th>
                   <th style={{ padding: '12px' }}>Reason</th>
                 </tr>
               </thead>
               <tbody>
                 {leads.filter(l => l.status === 'Lost').map(l => (
                   <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                     <td style={{ padding: '12px', fontWeight: 'bold' }}>{l.companyName}</td>
                     <td style={{ padding: '12px' }}>{l.serviceType}</td>
                     <td style={{ padding: '12px' }}>{formatCurrency(l.expectedValue)}</td>
                     <td style={{ padding: '12px', color: '#ef4444' }}>
                        {l.lostReason || "No reason provided"}
                     </td>
                   </tr>
                 ))}
                 {leads.filter(l => l.status === 'Lost').length === 0 && (
                   <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No lost leads.</td></tr>
                 )}
               </tbody>
             </table>
           </div>
          )}

        </>
      )}
    </div>
  );
}
