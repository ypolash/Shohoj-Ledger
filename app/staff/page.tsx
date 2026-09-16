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
  const [dutySchedule, setDutySchedule] = useState<any>(null);

  // New Leave Form
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<any[]>([]);
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
      if (emp.workShift) {
        setDutySchedule({
          name: emp.workShift.name,
          startTime: emp.workShift.startTime,
          endTime: emp.workShift.endTime,
          gracePeriod: emp.workShift.gracePeriod,
          breakTime: emp.workShift.breakTime,
          nightShift: emp.workShift.nightShift,
          isCustom: true,
          dutyHoursFormatted: `${emp.workShift.startTime} - ${emp.workShift.endTime}`
        });
      }
      fetchDashboardData(emp.id, emp);
    } else {
      alert('Invalid Employee ID or Password');
    }
  };

  const fetchDashboardData = async (empId: string, currentEmp?: any) => {
    // Fetch Attendance
    const attRes = await fetch(`/api/attendance?employeeId=${empId}`);
    if (attRes.ok) setAttendance(await attRes.json());

    // Fetch Mobile Attendance Status for Duty Schedule
    const targetEmpId = currentEmp?.employeeId || employeeId;
    if (targetEmpId) {
      fetch(`/api/mobile/attendance/status?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(d => {
          if (d.dutySchedule) {
            setDutySchedule(d.dutySchedule);
          }
        })
        .catch(() => {});
    }

    // Fetch Leaves
    const leaveRes = await fetch(`/api/leaves?employeeId=${empId}`);
    if (leaveRes.ok) {
      const lData = await leaveRes.json();
      setLeaves(Array.isArray(lData) ? lData : (lData.leaves || []));
      if (lData.leaveTypes && lData.leaveTypes.length > 0) {
        setAvailableLeaveTypes(lData.leaveTypes);
        setLeaveType(lData.leaveTypes[0].name);
      }
    }
    fetch('/api/ess/leave')
      .then(res => res.json())
      .then(d => {
        const types = d.leaveTypes?.length > 0 ? d.leaveTypes : (d.balances || []);
        if (types.length > 0) {
          setAvailableLeaveTypes(types);
          setLeaveType(types[0].name);
        }
      })
      .catch(() => {});

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Welcome, {emp.firstName}!</h1>
            <span style={{ color: '#94a3b8' }}>{emp.designation} • {emp.employeeId}</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
        </div>

        {/* Duty Schedule Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px 24px',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: dutySchedule?.isCustom ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dutySchedule?.isCustom ? '#34d399' : '#60a5fa',
              fontSize: '22px'
            }}>
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: dutySchedule?.isCustom ? '#34d399' : '#94a3b8' }}>
                  {dutySchedule?.isCustom ? '★ Assigned Custom Duty' : 'Standard Company Shift'}
                </span>
                {dutySchedule?.nightShift && (
                  <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px' }}>
                    Night Shift
                  </span>
                )}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {dutySchedule?.startTime ? `${dutySchedule.startTime} — ${dutySchedule.endTime}` : (emp?.shift || '09:30 — 18:00')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Grace Period</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24' }}>
                +{dutySchedule?.gracePeriod ?? 15} mins
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Break Allowance</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#60a5fa' }}>
                {dutySchedule?.breakTime ?? 60} mins
              </div>
            </div>
          </div>
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
                      {availableLeaveTypes.length > 0 ? (
                        availableLeaveTypes.map(lt => (
                          <option key={lt.id || lt.name} value={lt.name}>{lt.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="CASUAL">Casual</option>
                          <option value="SICK">Sick</option>
                          <option value="UNPAID">Unpaid</option>
                        </>
                      )}
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
