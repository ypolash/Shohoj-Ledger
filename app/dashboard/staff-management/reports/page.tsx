"use client";

import React, { useState, useEffect } from 'react';

type Report = {
  employeeId: string;
  employeeName: string;
  date: string;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workedHours: number;
  overtime: number;
  punishmentReason: string | null;
  reviewStatus: string | null;
  punishmentAmount: number;
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

  const totalPunishment = reports.reduce((sum, report) => sum + (report.punishmentAmount || 0), 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Staff Reports</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Detailed attendance and punishment review</p>
        </div>
        {!loading && !error && (
          <div className="glass-card topo-bg" style={{ padding: '16px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Total Punishment</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>৳{totalPunishment.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading reports...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>
        ) : reports.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No data found</div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Date & Employee</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Late (min)</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Early (min)</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Reason</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Review Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Amount (৳)</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {reports.map((report, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '500', color: '#f8fafc' }}>
                      {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {report.employeeName} ({report.employeeId})
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '500', color: report.status === 'PRESENT' ? '#10b981' : report.status === 'LATE' ? '#f59e0b' : '#94a3b8' }}>
                    {report.status.replace(/_/g, ' ')}
                  </td>
                  <td style={{ padding: '16px', color: report.lateMinutes > 0 ? '#f59e0b' : '#e2e8f0' }}>{report.lateMinutes}</td>
                  <td style={{ padding: '16px', color: report.earlyLeaveMinutes > 0 ? '#f59e0b' : '#e2e8f0' }}>{report.earlyLeaveMinutes}</td>
                  <td style={{ padding: '16px', color: '#e2e8f0', maxWidth: '200px' }}>
                    {report.punishmentReason || '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {report.reviewStatus === 'TEMPORARY_REVIEW' ? (
                      <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          background: 'rgba(245, 158, 11, 0.1)', 
                          color: '#fbbf24', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                          Warning
                        </span>
                        <span style={{ fontSize: '11px', color: '#fbbf24' }}>No Deduction Applied</span>
                      </div>
                    ) : report.reviewStatus === 'DEDUCTED' ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Deducted</span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>{report.reviewStatus || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: report.punishmentAmount > 0 ? '#ef4444' : '#94a3b8', fontWeight: report.punishmentAmount > 0 ? '600' : 'normal' }}>
                    {report.punishmentAmount > 0 ? `৳${report.punishmentAmount.toLocaleString()}` : '0'}
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
