"use client";

import { useState, useEffect } from "react";
// Removed date-fns import

export default function FinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newFine, setNewFine] = useState({ employeeId: "", amount: "", reason: "", date: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [finesRes, empRes] = await Promise.all([
        fetch("/api/hr/fines"),
        fetch("/api/employees")
      ]);
      const fData = await finesRes.json();
      const eData = await empRes.json();
      
      setFines(fData.fines || []);
      setEmployees(eData.data || eData.employees || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  }

  async function handleCreateFine(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFine)
      });
      if (res.ok) {
        setShowModal(false);
        setNewFine({ employeeId: "", amount: "", reason: "", date: "" });
        fetchData();
      } else {
        alert("Failed to assign fine");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  }

  async function handleCancelFine(id: string) {
    if (!confirm("Are you sure you want to cancel this fine?")) return;
    try {
      const res = await fetch(`/api/hr/fines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to cancel fine");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-main)' }}>Disciplinary Fines & Penalties</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Manage employee deductions and penalties.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary hover-lift"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Assign Fine
        </button>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', padding: '20px', marginBottom: '8px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--warning)' }}>policy</span>
          Standard Disciplinary Rules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface-hover)', borderLeft: '3px solid var(--warning)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Late Arrival Fine</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Automatically applied based on admin Attendance Settings.</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface-hover)', borderLeft: '3px solid var(--danger)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Unapproved Absence (AWOL)</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Equivalent to 1 day's basic salary deduction.</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface-hover)', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>Property Damage / Loss</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Deduction as per actual repair or replacement cost.</div>
          </div>
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'var(--surface-hover)', borderLeft: '3px solid var(--primary)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>General Policy Violation</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Up to ৳5,000 based on disciplinary committee decision.</div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Employee</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Reason</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Amount</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Payroll Period</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>Loading fines...</td></tr>
              ) : fines.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>money_off</span>
                  No fines assigned.
                </td></tr>
              ) : fines.map((f: any) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border-main)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(f.date))}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 500, color: 'var(--text-main)' }}>
                    {f.employee?.firstName} {f.employee?.lastName}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.employee?.employeeId}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-main)' }}>{f.reason}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--danger)' }}>৳{Number(f.amount).toFixed(2)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, 
                      color: f.status === 'PENDING' ? 'var(--warning)' : f.status === 'DEDUCTED' ? 'var(--success)' : 'var(--text-muted)', 
                      background: f.status === 'PENDING' ? 'var(--warning-subtle)' : f.status === 'DEDUCTED' ? 'var(--success-subtle)' : 'var(--surface-hover)' 
                    }}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{f.payrollRun?.period?.name || "-"}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {f.status === "PENDING" && (
                      <button 
                        onClick={() => handleCancelFine(f.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Waive / Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', borderRadius: '20px', padding: '32px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Assign Penalty</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            <form onSubmit={handleCreateFine} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={ls}>Employee *</label>
                <select 
                  style={is}
                  value={newFine.employeeId} 
                  onChange={e => setNewFine({...newFine, employeeId: e.target.value})}
                  required
                >
                  <option value="">— Select Employee —</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={ls}>Amount (৳) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  style={is}
                  value={newFine.amount}
                  onChange={e => setNewFine({...newFine, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={ls}>Reason *</label>
                <input 
                  type="text" 
                  style={is}
                  placeholder="e.g. Late Arrival, Property Damage"
                  value={newFine.reason}
                  onChange={e => setNewFine({...newFine, reason: e.target.value})}
                  required
                />
              </div>
              <div>
                <label style={ls}>Penalty Date *</label>
                <input 
                  type="date" 
                  style={is}
                  value={newFine.date}
                  onChange={e => setNewFine({...newFine, date: e.target.value})}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Assign Penalty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ls: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const is: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', boxSizing: 'border-box' };
