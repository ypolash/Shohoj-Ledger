"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // New Activity Form
  const [actType, setActType] = useState("FOLLOW_UP_CALL");
  const [actDesc, setActDesc] = useState("");
  const [actDate, setActDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLead();
  }, []);

  const fetchLead = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
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
      const res = await fetch(`/api/crm/leads/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchLead();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/crm/leads/${params.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: actType,
          description: actDesc,
          newValue: actDate || undefined
        })
      });
      if (res.ok) {
        setActDesc("");
        setActDate("");
        fetchLead();
      } else {
        alert("Failed to add activity");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes("CALL")) return "call";
    if (type.includes("MEETING")) return "groups";
    if (type.includes("EMAIL")) return "mail";
    if (type.includes("WHATSAPP")) return "chat";
    if (type.includes("TASK")) return "task_alt";
    if (type.includes("REMINDER")) return "alarm";
    if (type.includes("STATUS_CHANGE")) return "swap_horiz";
    if (type.includes("ASSIGNED")) return "person_add";
    return "history";
  };

  if (isLoading) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Loading Lead...</div>;
  if (!lead) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Lead not found</div>;

  return (
    <div className="animate-fade-in container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>{lead.companyName}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            {lead.contactPerson} • {lead.serviceType}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="input" 
            value={lead.status} 
            onChange={handleStatusChange}
            style={{ fontWeight: "bold", width: "auto" }}
          >
            {["New", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost", "Archived"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard/crm/leads")}>
            Back to Pipeline
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
        
        {/* Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', display: 'flex', justifyContent: 'space-between' }}>
              <span>Lead Details</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Email</strong>{lead.email || '-'}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Phone</strong>{lead.phone}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Expected Value</strong>BDT {lead.expectedValue}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Priority</strong>{lead.priority}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Industry</strong>{lead.industry || '-'}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Source</strong>{lead.leadSource || '-'}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Website</strong>{lead.website || '-'}</div>
              <div><strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Address</strong>{lead.address || '-'}</div>
            </div>
            
            {lead.tags?.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <strong style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Tags</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {lead.tags.map((t: string, idx: number) => (
                    <span key={idx} style={{ background: 'var(--border)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Activity Box */}
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Log Follow-Up</h2>
            <form onSubmit={handleAddActivity} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <select className="input" value={actType} onChange={e => setActType(e.target.value)} required>
                  <option value="FOLLOW_UP_CALL">Call</option>
                  <option value="FOLLOW_UP_MEETING">Meeting</option>
                  <option value="FOLLOW_UP_EMAIL">Email</option>
                  <option value="FOLLOW_UP_WHATSAPP">WhatsApp</option>
                  <option value="FOLLOW_UP_TASK">Task</option>
                  <option value="FOLLOW_UP_REMINDER">Reminder</option>
                </select>
                {(actType === 'FOLLOW_UP_REMINDER' || actType === 'FOLLOW_UP_TASK') && (
                  <input type="datetime-local" className="input" value={actDate} onChange={e => setActDate(e.target.value)} required />
                )}
              </div>
              <textarea 
                className="input" 
                rows={3} 
                placeholder="Log notes, outcomes, or tasks..." 
                value={actDesc} 
                onChange={e => setActDesc(e.target.value)} 
                required
              ></textarea>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Logging..." : "Log Activity"}
              </button>
            </form>
          </div>
        </div>

        {/* Timeline Column */}
        <div className="glass-card">
          <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Activity Timeline</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
            
            {lead.activities?.length > 0 ? (
              lead.activities.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {getActivityIcon(act.type)}
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
                    {(act.oldValue || act.newValue) && act.type === "STATUS_CHANGE" && (
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

      </div>
    </div>
  );
}
