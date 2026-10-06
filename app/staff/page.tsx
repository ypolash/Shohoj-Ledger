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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Dashboard Data
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'TASKS' | 'PRODUCTS' | 'LEAVES' | 'PAYROLL'>('ATTENDANCE');
  const [dutySchedule, setDutySchedule] = useState<any>(null);
  const [dutyRosters, setDutyRosters] = useState<any[]>([]);

  // Product Management State
  const [products, setProducts] = useState<any[]>([]);
  const [productStats, setProductStats] = useState({ total: 0, inStudio: 0, readyForReturn: 0, returned: 0, pendingReceipt: 0 });
  const [productFilter, setProductFilter] = useState<'ALL' | 'IN_STUDIO' | 'READY_FOR_RETURN' | 'RETURNED' | 'PENDING_RECEIPT'>('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Return Handover Modal in Staff App
  const [returnModalProduct, setReturnModalProduct] = useState<any>(null);
  const [staffReturnMethod, setStaffReturnMethod] = useState('In-Person Handover');
  const [staffReturnDate, setStaffReturnDate] = useState('');
  const [staffReturnReceiver, setStaffReturnReceiver] = useState('');
  const [staffReturnNotes, setStaffReturnNotes] = useState('');
  const [isSubmittingStaffReturn, setIsSubmittingStaffReturn] = useState(false);

  // Active Live Break Timer State
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [isEndingBreak, setIsEndingBreak] = useState(false);
  const [isStartingLunchBreak, setIsStartingLunchBreak] = useState(false);

  // New Leave Form
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const fetchProductsData = useCallback(async (searchQuery = '', status = 'ALL') => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch(`/api/staff/products?search=${encodeURIComponent(searchQuery)}&status=${status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        if (data.stats) setProductStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch products for staff", e);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

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

    // 2. Fetch Mobile Attendance Status & Duty Roster Schedule
    if (targetEmpId) {
      fetch(`/api/mobile/attendance/status?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(d => {
          if (d.dutySchedule) setDutySchedule(d.dutySchedule);
        })
        .catch(() => {});

      fetch(`/api/mobile/roster?employeeId=${targetEmpId}`)
        .then(res => res.json())
        .then(rData => {
          if (rData.rosters) setDutyRosters(rData.rosters);
          if (rData.effectiveDutyToday) setDutySchedule(rData.effectiveDutyToday);
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

    // 7. Fetch Products for Product Management
    fetchProductsData('', 'ALL');
  }, [employeeId, leaveType, fetchProductsData]);

  const handleOpenStaffReturnModal = (pItem: any) => {
    setReturnModalProduct(pItem);
    setStaffReturnMethod(pItem.productReturnMethod || 'In-Person Handover');
    setStaffReturnDate(pItem.productReturnDate || new Date().toISOString().split('T')[0]);
    setStaffReturnReceiver(pItem.productReturnReceiver || pItem.clientName || '');
    setStaffReturnNotes(pItem.productReturnNotes || '');
  };

  const handleConfirmStaffReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalProduct) return;
    setIsSubmittingStaffReturn(true);
    const emp = employees.find(e => e.employeeId === employeeId);
    try {
      const res = await fetch('/api/staff/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: returnModalProduct.projectId,
          action: 'RETURN',
          managerId: emp?.id,
          managerName: emp ? `${emp.firstName} ${emp.lastName}` : undefined,
          returnData: {
            returnDate: staffReturnDate,
            returnMethod: staffReturnMethod,
            returnReceiver: staffReturnReceiver,
            returnNotes: staffReturnNotes
          }
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert("📦 Product marked as returned to client!");
        setReturnModalProduct(null);
        fetchProductsData(productSearch, productFilter);
      } else {
        alert(json.error || "Failed to update return status");
      }
    } catch {
      alert("Network error while processing return");
    } finally {
      setIsSubmittingStaffReturn(false);
    }
  };

  const handleQuickReceiveProduct = async (projectId: string) => {
    const emp = employees.find(e => e.employeeId === employeeId);
    try {
      const res = await fetch('/api/staff/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: 'RECEIVE',
          managerId: emp?.id,
          managerName: emp ? `${emp.firstName} ${emp.lastName}` : undefined
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert("✓ Product marked as received and verified!");
        fetchProductsData(productSearch, productFilter);
      } else {
        alert(json.error || "Failed to update status");
      }
    } catch {
      alert("Network error while updating status");
    }
  };

  const handleRevertStaffReturn = async (projectId: string) => {
    try {
      const res = await fetch('/api/staff/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          action: 'REVERT_RETURN'
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        alert("Return status reverted.");
        setReturnModalProduct(null);
        fetchProductsData(productSearch, productFilter);
      }
    } catch {
      alert("Error reverting status");
    }
  };

  // Live timer tick for active break
  useEffect(() => {
    if (!activeBreak || !activeBreak.isBreakActive || activeBreak.isPaused) return;

    const interval = setInterval(() => {
      setActiveBreak((prev: any) => {
        if (!prev || !prev.isBreakActive) return prev;

        const now = Date.now();
        const targetEnd = prev.targetEndTime
          ? new Date(prev.targetEndTime).getTime()
          : (prev.startTime ? new Date(prev.startTime).getTime() + (prev.durationMinutes || 60) * 60000 : now);
        const graceEnd = prev.graceEndTime
          ? new Date(prev.graceEndTime).getTime()
          : (targetEnd + (prev.gracePeriodMinutes || 15) * 60000);

        const remainingSeconds = Math.max(0, Math.floor((targetEnd - now) / 1000));
        const isInGrace = now > targetEnd && now <= graceEnd;
        const graceRemainingSeconds = isInGrace ? Math.max(0, Math.floor((graceEnd - now) / 1000)) : 0;
        const isOverstay = now > graceEnd;
        const overstaySeconds = isOverstay ? Math.floor((now - graceEnd) / 1000) : 0;
        const overstayMinutes = Math.ceil(overstaySeconds / 60);

        const fineAmountBase = prev.fineAmount || 50;
        const estimatedFine = isOverstay
          ? (prev.fineType === 'PER_MINUTE' ? fineAmountBase * overstayMinutes : fineAmountBase)
          : 0;

        return {
          ...prev,
          remainingSeconds,
          isInGrace,
          graceRemainingSeconds,
          isOverstay,
          isOverstayed: isOverstay,
          overstayMinutes,
          overstaySeconds,
          estimatedFine
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBreak?.isBreakActive]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const cleanEmpId = employeeId.trim();
      // 1. Try mobile auth login endpoint (verifies password via bcrypt & returns full employee context)
      const res = await fetch('/api/mobile/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: cleanEmpId, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.employee) {
        const loggedEmp = {
          ...data.employee,
          role: data.user?.role || data.employee.designation,
          workShift: data.employee.dutySchedule || data.employee.workShift
        };
        setCurrentUser(loggedEmp);
        setIsAuthenticated(true);
        if (data.employee.dutySchedule) {
          setDutySchedule(data.employee.dutySchedule);
        }
        await fetchDashboardData(data.employee.id, loggedEmp);
        fetchProductsData('', 'ALL');
        return;
      }

      // 2. Fallback check from local list if available
      const localEmp = Array.isArray(employees)
        ? employees.find(e => e.employeeId === cleanEmpId && e.password === password)
        : null;
      if (localEmp) {
        setCurrentUser(localEmp);
        setIsAuthenticated(true);
        if (localEmp.workShift) {
          setDutySchedule({
            name: localEmp.workShift.name,
            startTime: localEmp.workShift.startTime,
            endTime: localEmp.workShift.endTime,
            gracePeriod: localEmp.workShift.gracePeriod,
            breakTime: localEmp.workShift.breakTime,
            nightShift: localEmp.workShift.nightShift,
            isCustom: true,
            dutyHoursFormatted: `${localEmp.workShift.startTime} - ${localEmp.workShift.endTime}`
          });
        }
        await fetchDashboardData(localEmp.id, localEmp);
        fetchProductsData('', 'ALL');
      } else {
        alert(data.message || data.error || 'Invalid Employee ID or Password');
      }
    } catch (err) {
      console.error("Login error:", err);
      alert('Login error. Please check your connection and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = currentUser || (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || { id: employeeId, employeeId };
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

  const handleStartLunchBreak = async () => {
    const emp = currentUser || (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || { id: employeeId, employeeId };
    if (!emp) return;
    setIsStartingLunchBreak(true);
    try {
      const res = await fetch('/api/mobile/leave/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          action: 'REQUEST_BREAK',
          reason: 'Lunch Break'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.activeBreak) {
          setActiveBreak(data.activeBreak);
        }
        alert(data.message || '🍽️ Lunch break started! Auto-countdown is now active.');
        await fetchDashboardData(emp.id, emp);
      } else {
        alert(data.error || 'Failed to start lunch break');
      }
    } catch {
      alert('Error starting lunch break');
    } finally {
      setIsStartingLunchBreak(false);
    }
  };

  const handlePauseBreak = async () => {
    const emp = currentUser || (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || { id: employeeId, employeeId };
    if (!emp) return;
    setIsStartingLunchBreak(true);
    try {
      const res = await fetch('/api/mobile/leave/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          action: 'PAUSE_BREAK'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.activeBreak) {
          setActiveBreak(data.activeBreak);
        }
        alert(data.message || '⏸️ Break paused.');
        await fetchDashboardData(emp.id, emp);
      } else {
        alert(data.error || 'Failed to pause break');
      }
    } catch {
      alert('Error pausing break');
    } finally {
      setIsStartingLunchBreak(false);
    }
  };

  const handleResumeBreak = async () => {
    const emp = currentUser || (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || { id: employeeId, employeeId };
    if (!emp) return;
    setIsStartingLunchBreak(true);
    try {
      const res = await fetch('/api/mobile/leave/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          action: 'RESUME_BREAK'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.activeBreak) {
          setActiveBreak(data.activeBreak);
        }
        alert(data.message || '▶️ Break resumed!');
        await fetchDashboardData(emp.id, emp);
      } else {
        alert(data.error || 'Failed to resume break');
      }
    } catch {
      alert('Error resuming break');
    } finally {
      setIsStartingLunchBreak(false);
    }
  };

  const handleEndActiveBreak = async () => {
    const emp = currentUser || (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || { id: employeeId, employeeId };
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

  const emp = currentUser || 
    (Array.isArray(employees) ? employees.find(e => e.employeeId === employeeId) : null) || 
    { firstName: 'Employee', employeeId, designation: 'Staff' };

  const isProductManager = Boolean(
    (emp?.designation && (
      emp.designation.toLowerCase().includes('product') ||
      emp.designation.toLowerCase().includes('production') ||
      emp.designation.toLowerCase().includes('inventory') ||
      emp.designation.toLowerCase().includes('studio') ||
      emp.designation.toLowerCase().includes('merchandis') ||
      emp.designation.toLowerCase().includes('catalog')
    )) ||
    (emp?.department && (
      emp.department.toLowerCase().includes('product') ||
      emp.department.toLowerCase().includes('production') ||
      emp.department.toLowerCase().includes('inventory') ||
      emp.department.toLowerCase().includes('studio') ||
      emp.department.toLowerCase().includes('merchandis')
    )) ||
    (emp?.role && (
      emp.role.toLowerCase().includes('product') ||
      emp.role.toLowerCase().includes('manager') ||
      emp.role.toLowerCase().includes('admin')
    )) ||
    (emp?.designationRef?.name && (
      emp.designationRef.name.toLowerCase().includes('product') ||
      emp.designationRef.name.toLowerCase().includes('production') ||
      emp.designationRef.name.toLowerCase().includes('inventory')
    )) ||
    (emp?.departmentRef?.name && (
      emp.departmentRef.name.toLowerCase().includes('product') ||
      emp.departmentRef.name.toLowerCase().includes('production') ||
      emp.departmentRef.name.toLowerCase().includes('inventory')
    ))
  );

  useEffect(() => {
    if (!isProductManager && activeTab === 'PRODUCTS') {
      setActiveTab('ATTENDANCE');
    }
  }, [isProductManager, activeTab]);

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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '32px 20px' }}>
      <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>Welcome, {emp.firstName}!</h1>
              {isProductManager && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>inventory_2</span>
                  Product Manager
                </span>
              )}
            </div>
            <span style={{ color: '#94a3b8' }}>{emp.designation} • {emp.employeeId}</span>
          </div>
          <button onClick={() => setIsAuthenticated(false)} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Logout</button>
        </div>

        {/* Dedicated Lunch Break Card (Visible & Clickable at Any Time when not on break) */}
        {(!activeBreak || !activeBreak.isBreakActive) && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(30, 41, 59, 0.85) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                fontSize: '28px'
              }}>
                <span className="material-symbols-outlined">restaurant</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    🍽️ Dedicated Lunch Break
                  </span>
                  <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Click Any Time
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                  Set Lunch Allowance: <strong>{dutySchedule?.breakTime ?? 60} mins</strong> (+{dutySchedule?.gracePeriod ?? 15}m grace period). Starts auto countdown upon click.
                </div>
              </div>
            </div>

            <button
              onClick={handleStartLunchBreak}
              disabled={isStartingLunchBreak}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#0f172a',
                fontWeight: 800,
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>restaurant</span>
              {isStartingLunchBreak ? 'Starting Break...' : 'Start Lunch Break'}
            </button>
          </div>
        )}

        {/* Live Active Lunch Break Auto-Countdown Card */}
        {activeBreak && activeBreak.isBreakActive && (
          <div style={{
            background: activeBreak.isOverstay
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)'
              : activeBreak.isPaused
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.15) 100%)'
              : activeBreak.isInGrace
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.12) 100%)',
            border: activeBreak.isOverstay
              ? '1.5px solid #ef4444'
              : activeBreak.isPaused
              ? '1.5px solid #f59e0b'
              : activeBreak.isInGrace
              ? '1.5px solid #f59e0b'
              : '1.5px solid #10b981',
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
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: activeBreak.isOverstay
                  ? 'rgba(239, 68, 68, 0.3)'
                  : (activeBreak.isPaused || activeBreak.isInGrace)
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: activeBreak.isOverstay
                  ? '#f87171'
                  : (activeBreak.isPaused || activeBreak.isInGrace)
                  ? '#fbbf24'
                  : '#34d399',
                fontSize: '30px'
              }}>
                <span className="material-symbols-outlined">
                  {activeBreak.isOverstay ? 'error' : activeBreak.isPaused ? 'pause_circle' : activeBreak.isInGrace ? 'hourglass_top' : 'timer'}
                </span>
              </div>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: activeBreak.isOverstay
                    ? '#f87171'
                    : (activeBreak.isPaused || activeBreak.isInGrace)
                    ? '#fbbf24'
                    : '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {activeBreak.isOverstay
                    ? '🚨 OVERSTAY PENALTY ACTIVE'
                    : activeBreak.isPaused
                    ? '⏸️ BREAK PAUSED (REMAINING TIME PRESERVED)'
                    : activeBreak.isInGrace
                    ? '⚠️ GRACE PERIOD TOLERANCE'
                    : '🍽️ LUNCH BREAK IN PROGRESS'}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#f8fafc', marginTop: '2px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {activeBreak.isOverstay
                    ? `+${activeBreak.overstayMinutes || 0}m OVERSTAYED`
                    : activeBreak.isPaused
                    ? formatSeconds(activeBreak.remainingSeconds || 0)
                    : activeBreak.isInGrace
                    ? `+${formatSeconds(activeBreak.graceRemainingSeconds || 0)} grace remaining`
                    : formatSeconds(activeBreak.remainingSeconds || 0)}
                </div>
                <div style={{ fontSize: '12.5px', color: '#cbd5e1', marginTop: '2px' }}>
                  {activeBreak.isOverstay ? (
                    <span style={{ color: '#fca5a5', fontWeight: 700 }}>
                      Penalty Fine: ৳{activeBreak.estimatedFine || 50} (Auto-applied to employee record)
                    </span>
                  ) : activeBreak.isPaused ? (
                    <span style={{ color: '#fde047', fontWeight: 600 }}>
                      Timer is paused. Click &quot;Resume Lunch Break&quot; to continue from where you left off.
                    </span>
                  ) : activeBreak.isInGrace ? (
                    <span style={{ color: '#fde047', fontWeight: 600 }}>
                      Countdown finished. In grace period tolerance (+{activeBreak.gracePeriodMinutes || 15}m). Return now to avoid penalty!
                    </span>
                  ) : (
                    <span>
                      Set Allowance: {activeBreak.durationMinutes || activeBreak.totalDurationMinutes || 60}m (+{activeBreak.gracePeriodMinutes || 15}m grace)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {activeBreak.isPaused ? (
                <button
                  onClick={handleResumeBreak}
                  disabled={isStartingLunchBreak || isEndingBreak}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    padding: '12px 22px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>play_arrow</span>
                  Resume Break
                </button>
              ) : (
                <button
                  onClick={handlePauseBreak}
                  disabled={isStartingLunchBreak || isEndingBreak}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#0f172a',
                    fontWeight: 800,
                    padding: '12px 22px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pause</span>
                  Pause Break
                </button>
              )}

              <button
                onClick={handleEndActiveBreak}
                disabled={isEndingBreak || isStartingLunchBreak}
                className="btn"
                style={{
                  background: activeBreak.isOverstay
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontWeight: 800,
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>stop_circle</span>
                {isEndingBreak ? 'Ending Break...' : 'End Break'}
              </button>
            </div>
          </div>
        )}

        {/* Duty Schedule Banner */}
        <div style={{
          background: dutySchedule?.isRoster
            ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '16px',
          border: dutySchedule?.isRoster ? '1.5px solid rgba(16, 185, 129, 0.45)' : dutySchedule?.isCustom ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px 24px',
          marginBottom: '28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: dutySchedule?.isRoster ? 'rgba(16, 185, 129, 0.25)' : dutySchedule?.isCustom ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dutySchedule?.isRoster ? '#34d399' : dutySchedule?.isCustom ? '#fbbf24' : '#60a5fa',
                fontSize: '22px'
              }}>
                <span className="material-symbols-outlined">{dutySchedule?.isRoster ? 'event_note' : 'schedule'}</span>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: dutySchedule?.isRoster ? '#34d399' : dutySchedule?.isCustom ? '#fbbf24' : '#94a3b8'
                  }}>
                    {dutySchedule?.isRoster ? `📅 Assigned Roster: ${dutySchedule?.name || 'Today'}` : dutySchedule?.isCustom ? `⚡ Custom Duty: ${dutySchedule?.name || 'Shift'}` : 'Standard Company Shift'}
                  </span>
                  {dutySchedule?.nightShift && (
                    <span style={{ fontSize: '11px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '12px' }}>
                      Night Shift
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {dutySchedule?.startTime ? `${dutySchedule.startTime} — ${dutySchedule.endTime}` : (emp?.shift || '09:30 — 18:00')}
                </div>
                {dutySchedule?.rosterNote && (
                  <div style={{ fontSize: '12px', color: '#6ee7b7', marginTop: '2px' }}>
                    Note: {dutySchedule.rosterNote}
                  </div>
                )}
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

          {/* Assigned Duty Roster Schedule Preview */}
          {dutyRosters && dutyRosters.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#34d399' }}>calendar_month</span>
                Assigned Duty Roster Schedule ({dutyRosters.length} Days)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {dutyRosters.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: r.isToday ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: r.isToday ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {r.dateFormatted || r.date}
                      </span>
                      {r.isToday && (
                        <span style={{ fontSize: '9px', background: '#10b981', color: '#0f172a', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                          TODAY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: r.isToday ? '#34d399' : '#94a3b8', marginTop: '3px', fontWeight: 600 }}>
                      {r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : (r.shiftName || 'Scheduled')}
                    </div>
                    {r.note && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {r.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'ATTENDANCE', label: 'ATTENDANCE', icon: 'schedule' },
            { id: 'TASKS', label: 'TASKS', icon: 'star' },
            ...(isProductManager ? [{
              id: 'PRODUCTS',
              label: 'PRODUCT MANAGEMENT',
              icon: 'inventory_2',
              badge: (productStats.inStudio || 0) + (productStats.readyForReturn || 0),
              isSpecialRole: true
            }] : []),
            { id: 'LEAVES', label: 'LEAVES', icon: 'event_busy' },
            { id: 'PAYROLL', label: 'PAYROLL', icon: 'payments' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'PRODUCTS') fetchProductsData(productSearch, productFilter);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                background: activeTab === tab.id
                  ? (tab.id === 'PRODUCTS' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)' : 'rgba(59,130,246,0.15)')
                  : (tab.id === 'PRODUCTS' ? 'rgba(245, 158, 11, 0.08)' : 'transparent'),
                color: activeTab === tab.id
                  ? (tab.id === 'PRODUCTS' ? '#fbbf24' : '#60a5fa')
                  : (tab.id === 'PRODUCTS' ? '#f59e0b' : '#94a3b8'),
                border: activeTab === tab.id
                  ? (tab.id === 'PRODUCTS' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(59,130,246,0.4)')
                  : (tab.id === 'PRODUCTS' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent'),
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: tab.id === 'TASKS' ? '#fbbf24' : tab.id === 'PRODUCTS' ? '#f59e0b' : 'inherit' }}>
                {tab.icon}
              </span>
              {tab.label}
              {Boolean(tab.badge && tab.badge > 0) && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.25)',
                  color: '#fbbf24',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  {tab.badge}
                </span>
              )}
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

          {/* TAB 3: PRODUCT MANAGEMENT (ONLY FOR PRODUCT MANAGERS) */}
          {activeTab === 'PRODUCTS' && isProductManager && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Product KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>inventory_2</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Projects Tracked</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>{productStats.total}</div>
                  </div>
                </div>

                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>videocam</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Studio / Production</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>{productStats.inStudio}</div>
                  </div>
                </div>

                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>assignment_return</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready for Return</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#fbbf24' }}>{productStats.readyForReturn}</div>
                  </div>
                </div>

                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>check_circle</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returned to Client</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>{productStats.returned}</div>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'ALL', label: 'All Items' },
                    { id: 'IN_STUDIO', label: 'In Studio' },
                    { id: 'READY_FOR_RETURN', label: 'Ready for Return' },
                    { id: 'RETURNED', label: 'Returned ✓' },
                    { id: 'PENDING_RECEIPT', label: 'Pending Receipt' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setProductFilter(f.id as any);
                        fetchProductsData(productSearch, f.id);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: productFilter === f.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: productFilter === f.id ? '#60a5fa' : '#94a3b8',
                        border: productFilter === f.id ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="Search project, client, or item..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      fetchProductsData(e.target.value, productFilter);
                    }}
                    className="input"
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  />
                  <button
                    onClick={() => fetchProductsData(productSearch, productFilter)}
                    className="btn"
                    style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.08)' }}
                    title="Refresh List"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                  </button>
                </div>
              </div>

              {/* Products Inventory List */}
              {isLoadingProducts ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Loading product inventory...
                </div>
              ) : products.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '50px 20px', borderRadius: '16px', color: '#94a3b8' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '52px', color: '#64748b', marginBottom: '10px' }}>package_2</span>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc' }}>No Product Inventory Found</h3>
                  <p style={{ margin: 0, fontSize: '13px' }}>No projects currently match this filter criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
                  {products.map((pItem: any) => {
                    const isReturned = pItem.productReturned;
                    const isReadyForReturn = pItem.productStatus === 'READY_FOR_RETURN';
                    const isCurrentStaffAssigned = (emp?.id && pItem.assignedProductManagerId === emp.id) || 
                                                   (emp?.firstName && pItem.assignedProductManagerName?.includes(emp.firstName));

                    return (
                      <div
                        key={pItem.projectId}
                        style={{
                          background: 'rgba(30, 41, 59, 0.7)',
                          border: isReturned
                            ? '1px solid rgba(16, 185, 129, 0.35)'
                            : isReadyForReturn
                            ? '1px solid rgba(245, 158, 11, 0.45)'
                            : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '16px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          boxShadow: isReadyForReturn ? '0 8px 24px rgba(245, 158, 11, 0.12)' : '0 4px 16px rgba(0,0,0,0.25)',
                          position: 'relative'
                        }}
                      >
                        {/* Top Card Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                                {pItem.projectCode}
                              </span>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                Stage #{pItem.currentStage}
                              </span>
                            </div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                              {pItem.projectName}
                            </h3>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              Client: <strong style={{ color: '#cbd5e1' }}>{pItem.clientName}</strong> {pItem.clientPhone && `(${pItem.clientPhone})`}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isReturned
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isReadyForReturn
                              ? 'rgba(245, 158, 11, 0.2)'
                              : pItem.received
                              ? 'rgba(56, 189, 248, 0.2)'
                              : 'rgba(148, 163, 184, 0.2)',
                            color: isReturned
                              ? '#34d399'
                              : isReadyForReturn
                              ? '#fbbf24'
                              : pItem.received
                              ? '#38bdf8'
                              : '#cbd5e1',
                            border: isReturned
                              ? '1px solid rgba(16, 185, 129, 0.4)'
                              : isReadyForReturn
                              ? '1px solid rgba(245, 158, 11, 0.4)'
                              : '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              {isReturned ? 'check_circle' : isReadyForReturn ? 'assignment_return' : pItem.received ? 'shelves' : 'pending'}
                            </span>
                            {isReturned ? 'Returned ✓' : isReadyForReturn ? 'Ready for Return' : pItem.received ? 'In Studio' : 'Pending Receipt'}
                          </span>
                        </div>

                        {/* Physical Inventory Items Box */}
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '10px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Physical Items ({pItem.productsList?.length || 0}):
                          </div>
                          {pItem.productsList && pItem.productsList.length > 0 ? (
                            pItem.productsList.map((prod: any, idx: number) => (
                              <div
                                key={prod.id || idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '12px',
                                  padding: '4px 0',
                                  borderBottom: idx < pItem.productsList.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                                }}
                              >
                                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{prod.name}</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                                    Qty: {prod.quantity}
                                  </span>
                                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#86efac' }}>
                                    {prod.condition}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              No specific item breakdown provided
                            </div>
                          )}
                        </div>

                        {/* Product Manager & Shoot Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: '#94a3b8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: isCurrentStaffAssigned ? '#fbbf24' : '#60a5fa' }}>manage_accounts</span>
                            <span>
                              Manager: <strong style={{ color: isCurrentStaffAssigned ? '#fbbf24' : '#cbd5e1' }}>
                                {pItem.assignedProductManagerName || 'Unassigned'}
                              </strong>
                              {isCurrentStaffAssigned && <span style={{ color: '#fbbf24', marginLeft: '4px' }}>(You)</span>}
                            </span>
                          </div>

                          {pItem.shootingDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#38bdf8' }}>calendar_today</span>
                              <span>Shoot: {pItem.shootingDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Return Log Info (if Returned) */}
                        {isReturned && (
                          <div style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            fontSize: '11.5px',
                            color: '#cbd5e1'
                          }}>
                            <div>
                              Returned on <strong>{pItem.productReturnDate || 'N/A'}</strong> via <strong>{pItem.productReturnMethod || 'In-Person Handover'}</strong>
                            </div>
                            {pItem.productReturnReceiver && (
                              <div style={{ marginTop: '2px' }}>
                                Receiver: <strong>{pItem.productReturnReceiver}</strong>
                              </div>
                            )}
                            {pItem.productReturnNotes && (
                              <div style={{ marginTop: '2px', fontStyle: 'italic', color: '#94a3b8' }}>
                                Note / Tracking: "{pItem.productReturnNotes}"
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          {!pItem.received && (
                            <button
                              onClick={() => handleQuickReceiveProduct(pItem.projectId)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>shelves</span>
                              Mark Received
                            </button>
                          )}

                          {!isReturned ? (
                            <button
                              onClick={() => handleOpenStaffReturnModal(pItem)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: isReadyForReturn
                                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: isReadyForReturn ? '0 4px 12px rgba(245, 158, 11, 0.35)' : 'none'
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>assignment_return</span>
                              Return / Dispatch Product
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                              <button
                                onClick={() => handleOpenStaffReturnModal(pItem)}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#34d399',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                Edit Handover Details
                              </button>

                              <button
                                onClick={() => handleRevertStaffReturn(pItem.projectId)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#f87171',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Revert to Pending Return"
                              >
                                Undo
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEAVES & SHORT BREAK */}
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

          {/* TAB 5: PAYROLL */}
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

        {/* MODAL: STAFF RETURN PRODUCT HANDOVER */}
        {isProductManager && returnModalProduct && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              borderRadius: '16px',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#f59e0b' }}>assignment_return</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                      Dispatch / Return Product
                    </h3>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {returnModalProduct.projectCode} • {returnModalProduct.projectName}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReturnModalProduct(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}
                >
                  ✕
                </button>
              </div>

              {/* Items List */}
              {returnModalProduct.productsList && returnModalProduct.productsList.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>ITEMS BEING RETURNED:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                    {returnModalProduct.productsList.map((prod: any, idx: number) => (
                      <div key={prod.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f8fafc' }}>
                        <span>{prod.name}</span>
                        <span style={{ color: '#93c5fd' }}>Qty: {prod.quantity} ({prod.condition})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleConfirmStaffReturn} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Return Date *</label>
                    <input
                      type="date"
                      required
                      value={staffReturnDate}
                      onChange={e => setStaffReturnDate(e.target.value)}
                      className="input"
                      style={{ fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Delivery / Handover Method *</label>
                    <select
                      value={staffReturnMethod}
                      onChange={e => setStaffReturnMethod(e.target.value)}
                      className="input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="In-Person Handover">In-Person Handover (Studio/Office)</option>
                      <option value="Steadfast Courier">Steadfast Courier</option>
                      <option value="Pathao Courier">Pathao Courier</option>
                      <option value="RedX Courier">RedX Courier</option>
                      <option value="Paperfly">Paperfly</option>
                      <option value="Sundarban Courier">Sundarban Courier</option>
                      <option value="Client Self-Pickup">Client Self-Pickup</option>
                      <option value="Other Delivery Service">Other Delivery Service</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Received By / Contact Person</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${returnModalProduct.clientName} / Representative`}
                    value={staffReturnReceiver}
                    onChange={e => setStaffReturnReceiver(e.target.value)}
                    className="input"
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Courier Tracking # / Dispatch Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Courier tracking code, condition upon return, recipient acknowledgment..."
                    value={staffReturnNotes}
                    onChange={e => setStaffReturnNotes(e.target.value)}
                    className="input"
                    style={{ fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setReturnModalProduct(null)}
                    className="btn"
                    style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 16px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStaffReturn}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      padding: '8px 20px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                    {isSubmittingStaffReturn ? 'Saving...' : 'Confirm Return ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
