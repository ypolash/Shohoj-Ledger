"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [activeTab, setActiveTab] = useState<'salary' | 'attendance' | 'departments'>('salary');
  const [search, setSearch] = useState('');

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hr/reports?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      }
    } catch (e) {
      console.error('Failed to load HR reports:', e);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const formatBDT = (v: number) =>
    new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(v || 0);

  // CSV Exporter
  const exportCSV = (rows: any[], filename: string) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [
      headers,
      ...rows.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            HR Reports & Executive Analytics
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Master bank salary sheets, monthly attendance metrics, and department compensation audits.
          </p>
        </div>

        {/* Period Selector & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={selectStyle}
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={String(i + 1)}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            style={selectStyle}
          >
            {['2024', '2025', '2026', '2027'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => {
              if (activeTab === 'salary') exportCSV(data?.salarySheet, 'Master_Salary_Sheet');
              if (activeTab === 'attendance') exportCSV(data?.attendanceSummary, 'Attendance_Master_Report');
              if (activeTab === 'departments') exportCSV(data?.departmentAnalytics, 'Department_Cost_Analysis');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Workforce', value: data?.totalEmployees ?? 0, icon: 'badge', color: '#3b82f6' },
          { label: 'Active on Roster', value: data?.activeEmployees ?? 0, icon: 'verified_user', color: '#10b981' },
          { label: 'Total Payroll Disbursed', value: formatBDT(data?.totalPayrollBurden), icon: 'account_balance', color: '#8b5cf6' },
          { label: 'Processed Salary Records', value: data?.salarySheet?.length ?? 0, icon: 'receipt_long', color: '#f59e0b' },
        ].map((kpi, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
              <span className="material-symbols-outlined" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card" style={{ padding: '12px 20px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'salary', label: 'Master Salary Sheet', icon: 'payments' },
            { key: 'attendance', label: 'Attendance & Punctuality Audit', icon: 'fact_check' },
            { key: 'departments', label: 'Department Cost Breakdown', icon: 'pie_chart' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                background: activeTab === tab.key ? 'var(--primary-subtle)' : 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-input)', border: '1px solid var(--border-main)', borderRadius: '10px', padding: '6px 12px', minWidth: '220px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>search</span>
          <input
            type="text"
            placeholder="Search report records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '13px', outline: 'none', width: '100%' }}
          />
        </div>
      </div>

      {/* TAB 1: MASTER SALARY SHEET */}
      {activeTab === 'salary' && (
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['ID', 'Employee Name', 'Department', 'Basic Salary', 'Gross', 'Deductions', 'Net Disbursed', 'Status', 'Payment Ref'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!data?.salarySheet || data.salarySheet.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    No salary payments generated for this period.
                  </td>
                </tr>
              ) : (
                data.salarySheet
                  .filter((s: any) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.employeeId.toLowerCase().includes(search.toLowerCase()))
                  .map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                      <td style={{ padding: '14px 18px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>{s.employeeId}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{s.department}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>{formatBDT(s.basicSalary)}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-main)' }}>{formatBDT(s.grossSalary)}</td>
                      <td style={{ padding: '14px 18px', color: '#ef4444' }}>-{formatBDT(s.deductions)}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--success)' }}>{formatBDT(s.netSalary)}</td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: s.status === 'PAID' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: s.status === 'PAID' ? '#10b981' : '#f59e0b' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '12px' }}>{s.transactionRef}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & PUNCTUALITY MASTER */}
      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-main)' }}>
                {['Employee ID', 'Employee Name', 'Department', 'Present Days', 'Late Days', 'Total Late (Mins)', 'Absences', 'Penalties BDT'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!data?.attendanceSummary || data.attendanceSummary.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                data.attendanceSummary
                  .filter((a: any) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.employeeId.toLowerCase().includes(search.toLowerCase()))
                  .map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                      <td style={{ padding: '14px 18px', color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 600 }}>{a.employeeId}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-main)' }}>{a.name}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>{a.department}</td>
                      <td style={{ padding: '14px 18px', color: '#10b981', fontWeight: 700 }}>{a.presentDays} days</td>
                      <td style={{ padding: '14px 18px', color: a.lateDays > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 600 }}>{a.lateDays}</td>
                      <td style={{ padding: '14px 18px', color: a.totalLateMinutes > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{a.totalLateMinutes} mins</td>
                      <td style={{ padding: '14px 18px', color: a.absentDays > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>{a.absentDays}</td>
                      <td style={{ padding: '14px 18px', color: a.penaltiesBDT > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                        {formatBDT(a.penaltiesBDT)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: DEPARTMENT COST BREAKDOWN */}
      {activeTab === 'departments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {data?.departmentAnalytics?.map((dept: any) => (
            <div key={dept.id} className="glass-card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{dept.departmentName}</div>
                <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: 'var(--surface-hover)', color: 'var(--primary)' }}>
                  {dept.headcount} Staff
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--border-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Payroll Cost:</span>
                  <strong style={{ color: 'var(--success)' }}>{formatBDT(dept.totalPayrollDisbursed)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Average Staff Salary:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{formatBDT(dept.averageCompensation)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '10px',
  border: '1px solid var(--border-main)',
  background: 'var(--surface-input)',
  color: 'var(--text-main)',
  fontSize: '13px',
  fontWeight: 600,
};
