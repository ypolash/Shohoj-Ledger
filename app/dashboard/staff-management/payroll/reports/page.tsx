"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../../income/page.module.css";
import Link from 'next/link';

export default function PayrollReportsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchPayments();
  }, [filterMonth, filterYear]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  // 1. Status Breakdown
  const statusCounts = payments.reduce((acc: any, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // 2. Department Breakdown
  const deptData = payments.reduce((acc: any, p: any) => {
    const dept = p.employee.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = { count: 0, basic: 0, net: 0 };
    acc[dept].count++;
    acc[dept].basic += Number(p.basicSalary);
    acc[dept].net += Number(p.netSalary);
    return acc;
  }, {});

  // 3. Totals
  const totalNet = payments.reduce((sum, p) => sum + Number(p.netSalary), 0);
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.netSalary), 0);
  const totalPending = payments.filter(p => ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(p.status)).reduce((sum, p) => sum + Number(p.netSalary), 0);

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1200px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/dashboard/staff-management/payroll" style={{ color: 'var(--text-muted)' }}>
               <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
            </Link>
            <h1 style={{ margin: 0 }}>Payroll Reports</h1>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)', paddingLeft: '28px' }}>
            Comprehensive analytics and breakdowns for {getMonthName(Number(filterMonth))} {filterYear}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ width: '150px' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m.toString()}>{getMonthName(m)}</option>
            ))}
          </select>
          <select className="input" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: '120px' }}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span> Print Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading analytics...</div>
      ) : payments.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No payroll data found for this period.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="printable-report">
          
          {/* Executive Summary */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Executive Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
               <div>
                 <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Payroll Liability</div>
                 <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(totalNet)}</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Across {payments.length} employees</div>
               </div>
               <div>
                 <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursed (PAID)</div>
                 <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{formatCurrency(totalPaid)}</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payments.filter(p => p.status === 'PAID').length} employees paid</div>
               </div>
               <div>
                 <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending (Unpaid)</div>
                 <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--danger)' }}>{formatCurrency(totalPending)}</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{payments.filter(p => ['DRAFT', 'CALCULATED', 'SUBMITTED', 'APPROVED'].includes(p.status)).length} employees pending</div>
               </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            
            {/* Status Breakdown Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Status Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(statusCounts).map(status => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500 }}>{status}</span>
                    <span style={{ background: 'var(--border)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>{statusCounts[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Department Cost Allocation</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Department</th>
                    <th style={{ textAlign: 'center', paddingBottom: '8px' }}>Headcount</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Basic Cost</th>
                    <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Net Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(deptData).map(dept => (
                    <tr key={dept} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '12px 0', fontWeight: 500 }}>{dept}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center' }}>{deptData[dept].count}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(deptData[dept].basic)}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(deptData[dept].net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .btn {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
