"use client";

import React, { useState, useEffect } from 'react';

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation: string;
};

type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  checkInTime: string | null;
  checkInLocation: string | null;
  checkOutTime: string | null;
  checkOutLocation: string | null;
  status: string;
  lateMinutes: number;
};

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [expandedDateId, setExpandedDateId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to load employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (employeeId: string) => {
    setIsLoadingAttendance(true);
    setExpandedDateId(null);
    try {
      const res = await fetch(`/api/attendance?employeeId=${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    fetchAttendance(emp.id);
  };

  const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Staff List Panel */}
      <div className="glass-card topo-bg" style={{ padding: '20px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#f8fafc' }}>Staff List</h2>
        
        {isLoading ? (
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>Loading staff...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '70vh', overflowY: 'auto' }}>
            {employees.map(emp => (
              <div 
                key={emp.id}
                onClick={() => handleSelectEmployee(emp)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '12px', cursor: 'pointer',
                  background: selectedEmployee?.id === emp.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedEmployee?.id === emp.id ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 'bold', color: '#fff'
                }}>
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: selectedEmployee?.id === emp.id ? '#60a5fa' : '#f8fafc' }}>
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{emp.designation}</span>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No staff found.</div>
            )}
          </div>
        )}
      </div>

      {/* Attendance Detail Panel */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', minHeight: '500px' }}>
        {!selectedEmployee ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5, marginBottom: '16px' }}>how_to_reg</span>
            <p>Select a staff member to view attendance records</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}'s Attendance
                </h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>ID: {selectedEmployee.employeeId}</span>
              </div>
            </div>

            {isLoadingAttendance ? (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px' }}>Loading records...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {attendances.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    No attendance records found for this employee.
                  </div>
                ) : (
                  attendances.map(record => (
                    <div key={record.id} style={{ 
                      background: 'rgba(0,0,0,0.2)', 
                      borderRadius: '12px', 
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div 
                        onClick={() => setExpandedDateId(expandedDateId === record.id ? null : record.id)}
                        style={{ 
                          padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          cursor: 'pointer',
                          background: expandedDateId === record.id ? 'rgba(255,255,255,0.02)' : 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className="material-symbols-outlined" style={{ color: record.status === 'PRESENT' ? '#10b981' : record.status === 'LATE' ? '#f59e0b' : '#ef4444' }}>
                            {record.status === 'PRESENT' ? 'check_circle' : record.status === 'LATE' ? 'schedule' : 'cancel'}
                          </span>
                          <span style={{ fontWeight: '500', fontSize: '15px' }}>{formatDate(record.date)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ 
                            fontSize: '12px', padding: '4px 10px', borderRadius: '99px',
                            background: record.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : record.status === 'LATE' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                            color: record.status === 'PRESENT' ? '#34d399' : record.status === 'LATE' ? '#fbbf24' : '#f87171'
                          }}>
                            {record.status} {record.lateMinutes > 0 && `(${record.lateMinutes}m late)`}
                          </span>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94a3b8', transform: expandedDateId === record.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                            expand_more
                          </span>
                        </div>
                      </div>

                      {expandedDateId === record.id && (
                        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                              <h5 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span> Check In
                              </h5>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Time</span>
                                <span style={{ fontSize: '15px', color: '#f8fafc', fontWeight: '500' }}>
                                  {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '--:--'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Location</span>
                                <span style={{ fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px', color: '#3b82f6' }}>location_on</span>
                                  {record.checkInLocation || 'Location not recorded'}
                                </span>
                              </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                              <h5 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span> Check Out
                              </h5>
                              <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Time</span>
                                <span style={{ fontSize: '15px', color: '#f8fafc', fontWeight: '500' }}>
                                  {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '--:--'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Location</span>
                                <span style={{ fontSize: '14px', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '2px' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px', color: '#3b82f6' }}>location_on</span>
                                  {record.checkOutLocation || 'Location not recorded'}
                                </span>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
