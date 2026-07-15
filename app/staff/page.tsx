"use client";

import React, { useState, useEffect } from 'react';

export default function StaffPortalPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Dashboard Data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('ATTENDANCE');

  // New Leave Form
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.employeeId === employeeId && e.password === password);
    if (emp) {
      setIsAuthenticated(true);
      fetchDashboardData(emp.id);
    } else {
      alert('Invalid Employee ID or Password');
    }
  };

  const fetchDashboardData = async (empId: string) => {
    // Fetch Attendance
    const attRes = await fetch(`/api/attendance?employeeId=${empId}`);
    if (attRes.ok) setAttendance(await attRes.json());

    // Fetch Leaves
    const leaveRes = await fetch(`/api/leaves?employeeId=${empId}`);
    if (leaveRes.ok) setLeaves(await leaveRes.json());

    // Fetch Payroll
    const payRes = await fetch('/api/payroll');
    if (payRes.ok) {
      const allPay = await payRes.json();
      setPayroll(allPay.filter((p: any) => p.employeeId === empId));
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.employeeId === employeeId);
    if (!emp) return;

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.id,
          type: leaveType,
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason
        })
      });
      if (res.ok) {
        alert('Leave request submitted!');
        fetchDashboardData(emp.id);
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
      }
    } catch (e) {
      alert('Failed to submit leave');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div className="glass-card" style={{ padding: '40px', borderRadius: '16px', width: '400px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#f8fafc' }}>Staff Portal Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Employee ID</label>
              <input type="text" className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required placeholder="EMP-1001" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Password</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  const emp = employees.find(e => e.employeeId === employeeId);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '40px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Welcome, {emp.firstName}!</h1>
            <span style={{ color: '#94a3b8' }}>{emp.designation} • {emp.employeeId}</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
          {['ATTENDANCE', 'LEAVES', 'PAYROLL'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                background: activeTab === tab ? 'rgba(59,130,246,0.1)' : 'transparent',
                color: activeTab === tab ? '#60a5fa' : '#94a3b8',
                border: 'none', transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'ATTENDANCE' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>My Attendance</h2>
              {attendance.map(a => (
                <div key={a.id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>{new Date(a.date).toLocaleDateString()}</div>
                  <div style={{ color: a.status === 'PRESENT' ? '#34d399' : a.status === 'LATE' ? '#fbbf24' : '#f87171' }}>{a.status}</div>
                </div>
              ))}
              {attendance.length === 0 && <div style={{ color: '#94a3b8' }}>No attendance records.</div>}
            </div>
          )}

          {activeTab === 'LEAVES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>My Leave Requests</h2>
                {leaves.map(l => (
                  <div key={l.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{l.type} LEAVE</strong>
                      <span style={{ color: l.status === 'APPROVED' ? '#34d399' : l.status === 'REJECTED' ? '#f87171' : '#fbbf24' }}>{l.status}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '8px' }}>{l.reason}</div>
                  </div>
                ))}
                {leaves.length === 0 && <div style={{ color: '#94a3b8' }}>No leave requests.</div>}
              </div>

              <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', height: 'fit-content' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Apply for Leave</h2>
                <form onSubmit={submitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Leave Type</label>
                    <select className="input" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                      <option value="CASUAL">Casual</option>
                      <option value="SICK">Sick</option>
                      <option value="UNPAID">Unpaid</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Start Date</label>
                    <input type="date" className="input" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>End Date</label>
                    <input type="date" className="input" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Reason</label>
                    <textarea className="input" rows={3} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'PAYROLL' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>My Salary & Payslips</h2>
              {payroll.map(p => (
                <div key={p.id} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{p.month}/{p.year}</h3>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Paid on: {new Date(p.paymentDate).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>৳ {Number(p.netSalary).toLocaleString()}</div>
                    <button className="btn" style={{ padding: '4px 12px', fontSize: '12px', marginTop: '8px', background: 'rgba(255,255,255,0.1)' }}>Download Payslip</button>
                  </div>
                </div>
              ))}
              {payroll.length === 0 && <div style={{ color: '#94a3b8' }}>No salary records.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
