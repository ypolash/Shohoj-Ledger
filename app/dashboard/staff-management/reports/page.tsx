"use client";

import React, { useState, useEffect } from 'react';

type Report = {
  employeeId: string;
  employeeName: string;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalWorkedHours: number;
  totalOvertime: number;
  totalPunishment: number;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/staff/report');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch reports');
        }
        const data = await res.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Staff Reports</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Overview of attendance, performance, and hours</p>
        </div>
      </div>

      <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading reports...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data found</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Employee</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Present</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Late</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Absent</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Hours Worked</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Overtime (hrs)</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Punishment (৳)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {reports.map((report, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: '#f8fafc' }}>{report.employeeName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {report.employeeId}</div>
                  </td>
                  <td style={{ padding: '16px', color: '#10b981', fontWeight: '500' }}>{report.totalPresent}</td>
                  <td style={{ padding: '16px', color: '#f59e0b', fontWeight: '500' }}>{report.totalLate}</td>
                  <td style={{ padding: '16px', color: '#ef4444', fontWeight: '500' }}>{report.totalAbsent}</td>
                  <td style={{ padding: '16px', color: '#e2e8f0' }}>{report.totalWorkedHours}h</td>
                  <td style={{ padding: '16px', color: '#8b5cf6' }}>{report.totalOvertime}h</td>
                  <td style={{ padding: '16px', color: report.totalPunishment > 0 ? '#ef4444' : '#94a3b8' }}>
                    {report.totalPunishment > 0 ? `৳${report.totalPunishment.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
