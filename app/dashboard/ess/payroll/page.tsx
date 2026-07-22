"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyPayroll } from './actions';

export default function EssPayrollPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const payrollData = await fetchMyPayroll();
      setData(payrollData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = (id: string) => {
    alert("Downloading PDF... (Placeholder for existing service)");
  };

  if (isLoading) return <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>Loading payroll...</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>Payslips</h2>
        {data.payslips.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Net Salary</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.payslips.map((slip: any) => (
                  <tr key={slip.id}>
                    <td>{slip.month} {slip.year}</td>
                    <td>৳{Number(slip.basicSalary).toLocaleString()}</td>
                    <td>৳{Number(slip.grossSalary).toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>৳{Number(slip.netSalary).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`${styles.badge} ${slip.status === 'PAID' ? styles['badge-paid'] : styles['badge-unpaid']}`}>
                        {slip.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" onClick={() => downloadPdf(slip.id)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No payslips available.</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>Recent Bonuses</h3>
          {data.bonuses.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.bonuses.map((b: any) => (
                <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{b.type}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(b.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--success)' }}>+ ৳{Number(b.amount).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No bonuses found.</div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
          <h3 style={{ margin: '0 0 var(--spacing-6) 0' }}>Recent Deductions</h3>
          {data.deductions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.deductions.map((d: any) => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{d.reason}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(d.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--danger)' }}>- ৳{Number(d.amount).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>No deductions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
