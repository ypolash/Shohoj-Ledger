"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export default function StaffPortalPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Dashboard Data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'TASKS' | 'LEAVES' | 'PAYROLL'>('ATTENDANCE');
  const [dutySchedule, setDutySchedule] = useState<any>(null);

  // Active Live Break Timer State
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [isEndingBreak, setIsEndingBreak] = useState(false);

  // New Leave Form
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data));
  }, []);

  const selectedLeaveTypeDetails = availableLeaveTypes.find(
    lt => lt.name === leaveType || lt.id === leaveType
  ) || null;

  const isShortBreakSelected = Boolean(
    selectedLeaveTypeDetails?.isShortBreak ||
    selectedLeaveTypeDetails?.quotaModel === 'SHORT_BREAK' ||
    selectedLeaveTypeDetails?.description?.includes('TIMER_CONFIG') ||
    leaveType.toLowerCase().includes('break')
  );

  const fetchDashboardData = useCallback(async (empId: string, currentEmp?: any) => {
    const targetEmpId = currentEmp?.employeeId || employeeId;

    // 1. Fetch Attendance
    fetch(`/api/attendance?employeeId=${empId}`)
      .then(res => res.json())
      .then(data => setAttendance(Array.isArray(data) ? data : []))
      .catch(() => {});

    // 2. Fetch Mobile Attendance Status for Duty Schedule
    if (targetEmpId) {
      fetch(`/api/mobile/attendance/status?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(d => {
          if (d.dutySchedule) setDutySchedule(d.dutySchedule);
        })
        .catch(() => {});
    }

    // 3. Fetch Tasks (Regular + Special Bounties)
    if (targetEmpId) {
      fetch(`/api/mobile/tasks?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(tData => setTasks(Array.isArray(tData) ? tData : []))
        .catch(() => {});
    }

    // 4. Fetch Active Break Telemetry
    if (targetEmpId) {
      fetch(`/api/mobile/leave/break?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(bData => {
          if (bData.hasActiveBreak && bData.activeBreak) {
            setActiveBreak(bData.activeBreak);
          } else {
            setActiveBreak(null);
          }
        })
        .catch(() => {});
    }

    // 5. Fetch Leaves & Leave Categories
    fetch(`/api/mobile/leave?employeeId=${targetEmpId}`)
      .then(res => res.json())
      .then(lData => {
        if (lData.leaves) setLeaves(lData.leaves);
        if (lData.leaveTypes && lData.leaveTypes.length > 0) {
          setAvailableLeaveTypes(lData.leaveTypes);
          if (!leaveType || leaveType === 'CASUAL') {
            setLeaveType(lData.leaveTypes[0].name);
          }
        }
        if (lData.activeBreak) {
          setActiveBreak(lData.activeBreak);
        }
      })
      .catch(async () => {
        // Fallback to /api/leaves
        const fallbackRes = await fetch(`/api/leaves?employeeId=${empId}`);
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          setLeaves(Array.isArray(fbData) ? fbData : (fbData.leaves || []));
        }
      });

    // 6. Fetch Payroll
    fetch('/api/payroll')
      .then(res => res.json())
      .then(allPay => {
        if (Array.isArray(allPay)) {
          setPayroll(allPay.filter((p: any) => p.employeeId === empId));
        }
      })
      .catch(() => {});
  }, [employeeId, leaveType]);

  // Live timer tick for active break
  useEffect(() => {
    if (!activeBreak || !activeBreak.isBreakActive) return;

    const interval = setInterval(() => {
      setActiveBreak((prev: any) => {
        if (!prev || !prev.isBreakActive) return prev;
        const newRemaining = Math.max(0, prev.remainingSeconds - 1);
        const isOverstay = newRemaining === 0;
        const overstaySecs = isOverstay ? (prev.overstayMinutes || 0) * 60 + 1 : 0;
        return {
          ...prev,
          remainingSeconds: newRemaining,
          isOverstay,
          overstayMinutes: Math.floor(overstaySecs / 60)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBreak?.isBreakActive]);

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

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.employeeId === employeeId);
    if (!emp) return;

    setIsSubmittingLeave(true);
    try {
      const now = new Date();
      let startVal = leaveStart ? new Date(leaveStart).toISOString() : now.toISOString();
      let endVal = leaveEnd ? new Date(leaveEnd).toISOString() : new Date(now.getTime() + 30 * 60 * 1000).toISOString();

      if (isShortBreakSelected) {
        const durationMins = selectedLeaveTypeDetails?.breakDurationMinutes || 30;
        startVal = now.toISOString();
        endVal = new Date(now.getTime() + durationMins * 60 * 1000).toISOString();
      }

      const res = await fetch('/api/mobile/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          type: leaveType,
          startDate: startVal,
          endDate: endVal,
          reason: leaveReason || (isShortBreakSelected ? "Short Break" : "Leave Request")
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.autoApproved || isShortBreakSelected) {
          alert('⚡ Short break started! Live countdown timer is now active.');
        } else {
          alert('Leave request submitted to HR!');
        }
        await fetchDashboardData(emp.id, emp);
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
      } else {
        alert(json.error || 'Failed to submit leave');
      }
    } catch {
      alert('Network error while submitting leave');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleEndActiveBreak = async () => {
    const emp = employees.find(e => e.employeeId === employeeId);
    if (!emp) return;

    setIsEndingBreak(true);
    try {
      const res = await fetch('/api/mobile/leave/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          action: 'END_BREAK'
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Break ended successfully!');
        setActiveBreak(null);
        await fetchDashboardData(emp.id, emp);
      } else {
        alert(json.error || 'Failed to end break');
      }
    } catch {
      alert('Error ending active break');
    } finally {
      setIsEndingBreak(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

  const emp = employees.find(e => e.employeeId === employeeId) || { firstName: 'Employee', employeeId, designation: 'Staff' };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 6px 0' }}>Welcome, {emp.firstName}!</h1>
            <span style={{ color: '#94a3b8' }}>{emp.designation} • {emp.employeeId}</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
        </div>

        {/* Live Active Break Alert Card */}
        {activeBreak && activeBreak.isBreakActive && (
          <div style={{
            background: activeBreak.isOverstay
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.12) 100%)',
            border: activeBreak.isOverstay ? '1px solid #ef4444' : '1px solid #f59e0b',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: activeBreak.isOverstay ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeBreak.isOverstay ? '#f87171' : '#fbbf24',
                fontSize: '28px'
              }}>
                <span className="material-symbols-outlined">
                  {activeBreak.isOverstay ? 'error' : 'timer'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: activeBreak.isOverstay ? '#f87171' : '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeBreak.isOverstay ? '🚨 OVERSTAY PENALTY ACTIVE' : '⏱️ SHORT BREAK IN PROGRESS'}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '2px', fontFamily: 'monospace' }}>
                  {activeBreak.isOverstay
                    ? `+${activeBreak.overstayMinutes || 0}m OVERSTAYED`
                    : formatSeconds(activeBreak.remainingSeconds || 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                  {activeBreak.isOverstay
                    ? `Fine Applied: ৳${activeBreak.estimatedFine || 50} (Auto-charged)`
                    : `Allowed: ${activeBreak.totalDurationMinutes}m (+${activeBreak.gracePeriodMinutes}m grace tolerance)`}
                </div>
              </div>
            </div>

            <button
              onClick={handleEndActiveBreak}
              disabled={isEndingBreak}
              className="btn"
              style={{
                background: activeBreak.isOverstay ? '#ef4444' : '#f59e0b',
                color: '#ffffff',
                fontWeight: 700,
                padding: '12px 24px',
                borderRadius: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
              }}
            >
              {isEndingBreak ? 'Ending...' : "I'm Back / End Break"}
            </button>
          </div>
        )}

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
          {(['ATTENDANCE', 'TASKS', 'LEAVES', 'PAYROLL'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: activeTab === tab ? '#60a5fa' : '#94a3b8',
                border: activeTab === tab ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab === 'TASKS' && <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fbbf24' }}>star</span>}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'ATTENDANCE' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>My Attendance</h2>
              {attendance.map(a => (
                <div key={a.id} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <div>{new Date(a.date).toLocaleDateString()}</div>
                  <div style={{ color: a.status === 'PRESENT' ? '#34d399' : a.status === 'LATE' ? '#fbbf24' : '#f87171', fontWeight: 600 }}>{a.status}</div>
                </div>
              ))}
              {attendance.length === 0 && <div style={{ color: '#94a3b8' }}>No attendance records.</div>}
            </div>
          )}

          {/* TAB 2: TASKS (WITH GOLDEN SPECIAL TASKS) */}
          {activeTab === 'TASKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>My Duties & Special Bounties</h2>
                <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                  {tasks.filter(t => t.isSpecialTask).length} Special Bounties • {tasks.filter(t => !t.isSpecialTask).length} Regular Tasks
                </span>
              </div>

              {tasks.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', borderRadius: '16px' }}>
                  No assigned tasks found. Check back later!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {tasks.map(task => {
                    const isSpecial = Boolean(task.isSpecialTask);
                    const checklistItems: ChecklistItem[] = Array.isArray(task.checklist?.items) ? task.checklist.items : [];
                    const completedCount = checklistItems.filter(i => i.completed).length;

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: isSpecial
                            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 50%, rgba(15, 23, 42, 0.95) 100%)'
                            : 'rgba(30, 41, 59, 0.7)',
                          border: isSpecial ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          boxShadow: isSpecial ? '0 10px 28px rgba(245, 158, 11, 0.16)' : '0 4px 16px rgba(0,0,0,0.2)',
                          position: 'relative'
                        }}
                      >
                        {/* Golden Banner Header for Special Tasks */}
                        {isSpecial && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(245, 158, 11, 0.25)',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: '#fbbf24'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b' }}>star</span>
                              SPECIAL TASK BOUNTY
                            </span>
                            <span style={{ color: '#34d399', fontWeight: 800 }}>
                              ৳{Number(task.rewardAmount || 0).toLocaleString()} ({task.points || 0} pts)
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: isSpecial ? '#fef08a' : '#f8fafc', wordBreak: 'break-word' }}>
                            {task.title}
                          </h3>
                          <span style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: '600',
                            color: task.priority === 'High' || task.priority === 'Urgent' ? '#f87171' : '#60a5fa',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {task.priority || 'Medium'}
                          </span>
                        </div>

                        {task.description && (
                          <p style={{ margin: 0, fontSize: '13px', color: isSpecial ? '#cbd5e1' : '#94a3b8', lineHeight: 1.5 }}>
                            {task.description}
                          </p>
                        )}

                        {/* Checklist Section */}
                        {checklistItems.length > 0 && (
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderRadius: '10px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                              <span>Checklist Progress</span>
                              <span>{completedCount}/{checklistItems.length}</span>
                            </div>
                            {checklistItems.map(item => (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <span style={{ color: item.completed ? '#34d399' : '#64748b' }}>
                                  {item.completed ? '✓' : '○'}
                                </span>
                                <span style={{ color: item.completed ? '#64748b' : '#cbd5e1', textDecoration: item.completed ? 'line-through' : 'none' }}>
                                  {item.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No fixed deadline'}
                          </span>
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: task.status === 'Completed' ? '#34d399' : task.status === 'In Progress' ? '#60a5fa' : '#fbbf24'
                          }}>
                            {task.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEAVES & SHORT BREAK */}
          {activeTab === 'LEAVES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>My Leave & Break Requests</h2>
                {leaves.map(l => {
                  const isBreakItem = l.type.toLowerCase().includes('break') || l.comments?.includes('Short break');
                  return (
                    <div key={l.id} style={{
                      padding: '16px',
                      background: isBreakItem ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      border: isBreakItem ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ color: isBreakItem ? '#fbbf24' : '#f8fafc' }}>{l.type}</strong>
                          {isBreakItem && (
                            <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                              SHORT BREAK
                            </span>
                          )}
                        </div>
                        <span style={{
                          color: l.status === 'APPROVED' ? '#34d399' : l.status === 'REJECTED' ? '#f87171' : '#fbbf24',
                          fontWeight: 700,
                          fontSize: '12.5px'
                        }}>
                          {l.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(l.startDate).toLocaleDateString()} {new Date(l.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(l.endDate).toLocaleDateString()} {new Date(l.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {l.comments && (
                        <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '6px', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                          {l.comments}
                        </div>
                      )}
                      <div style={{ fontSize: '13.5px', marginTop: '6px' }}>{l.reason}</div>
                    </div>
                  );
                })}
                {leaves.length === 0 && <div style={{ color: '#94a3b8' }}>No leave requests found.</div>}
              </div>

              {/* Leave Application & Short Break Request Form */}
              <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', height: 'fit-content' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {isShortBreakSelected ? "Request Short Break" : "Apply for Leave"}
                </h2>

                <form onSubmit={submitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Leave / Break Category</label>
                    <select
                      className="input"
                      value={leaveType}
                      onChange={e => setLeaveType(e.target.value)}
                      style={{ background: '#1e293b', color: '#f8fafc' }}
                    >
                      {availableLeaveTypes.length > 0 ? (
                        availableLeaveTypes.map(lt => (
                          <option key={lt.id || lt.name} value={lt.name}>
                            {lt.name} {lt.isShortBreak ? '(⏱️ Short Break)' : ''}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Short Break">Short Break (30 min)</option>
                          <option value="CASUAL">Casual Leave</option>
                          <option value="SICK">Sick Leave</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* SHORT BREAK DETAILS & FINE WARNING CARD */}
                  {isShortBreakSelected ? (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timer</span>
                        Short Break Rules & Live Timer
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                          <span style={{ color: '#94a3b8', display: 'block' }}>Duration:</span>
                          <strong style={{ color: '#f8fafc', fontSize: '13px' }}>
                            {selectedLeaveTypeDetails?.breakDurationMinutes || 30} Minutes
                          </strong>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '8px' }}>
                          <span style={{ color: '#94a3b8', display: 'block' }}>Grace Period:</span>
                          <strong style={{ color: '#fbbf24', fontSize: '13px' }}>
                            +{selectedLeaveTypeDetails?.gracePeriodMinutes || 5} Min Tolerance
                          </strong>
                        </div>
                      </div>

                      {/* Overstay Fine Warning */}
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        color: '#fca5a5',
                        fontSize: '11.5px',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px'
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }}>warning</span>
                        <div>
                          <strong>Overstay Fine Warning:</strong> If you exceed your break time (+ grace period), an automatic fine of <strong>৳{selectedLeaveTypeDetails?.fineAmount || 50}</strong> will be registered to your salary record.
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bolt</span>
                        Instant Start: No HR approval needed. Live countdown starts right away.
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Start Date</label>
                        <input type="date" className="input" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>End Date</label>
                        <input type="date" className="input" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required />
                      </div>
                    </>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                      {isShortBreakSelected ? "Break Reason / Note (Optional)" : "Reason *"}
                    </label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder={isShortBreakSelected ? "e.g. Lunch, tea, urgent personal chore" : "Detailed leave reason..."}
                      value={leaveReason}
                      onChange={e => setLeaveReason(e.target.value)}
                      required={!isShortBreakSelected}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn"
                    disabled={isSubmittingLeave}
                    style={{
                      background: isShortBreakSelected ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {isSubmittingLeave
                      ? "Starting..."
                      : isShortBreakSelected
                      ? "⚡ Start Short Break Now (Auto-Approved)"
                      : "Submit Leave Request"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: PAYROLL */}
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
