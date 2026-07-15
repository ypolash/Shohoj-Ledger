"use client";

import React, { useState, useEffect } from 'react';

type LeaveRequest = {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    designation: string;
  }
};

export default function LeaveManagementPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await fetch('/api/leaves');
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeaveStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (error) {
      console.error('Failed to update leave status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Leave Management</h2>
      </div>

      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>Loading leave requests...</div>
        ) : leaves.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>No leave requests found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {leaves.map((leave) => (
              <div key={leave.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '12px', 
                padding: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f8fafc' }}>
                      {leave.employee.firstName} {leave.employee.lastName}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>({leave.employee.designation})</span>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '99px', fontWeight: '500',
                      background: leave.type === 'SICK' ? 'rgba(239,68,68,0.1)' : leave.type === 'CASUAL' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                      color: leave.type === 'SICK' ? '#f87171' : leave.type === 'CASUAL' ? '#60a5fa' : '#fbbf24'
                    }}>
                      {leave.type} LEAVE
                    </span>
                    <span style={{ 
                      fontSize: '12px', padding: '4px 10px', borderRadius: '99px', fontWeight: '500',
                      background: leave.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : leave.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.1)',
                      color: leave.status === 'APPROVED' ? '#34d399' : leave.status === 'REJECTED' ? '#f87171' : '#cbd5e1'
                    }}>
                      {leave.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                    <div><strong style={{ color: '#cbd5e1' }}>From:</strong> {formatDate(leave.startDate)}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>To:</strong> {formatDate(leave.endDate)}</div>
                  </div>
                  
                  <div style={{ fontSize: '14px', color: '#e2e8f0', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Reason</strong>
                    {leave.reason}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leave.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateLeaveStatus(leave.id, 'APPROVED')} className="btn" style={{ background: '#10b981', color: '#fff' }}>Approve</button>
                      <button onClick={() => updateLeaveStatus(leave.id, 'REJECTED')} className="btn" style={{ background: '#ef4444', color: '#fff' }}>Reject</button>
                    </>
                  )}
                  {leave.status !== 'PENDING' && (
                     <button onClick={() => updateLeaveStatus(leave.id, 'PENDING')} className="btn" style={{ background: 'rgba(255,255,255,0.05)' }}>Reset to Pending</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
