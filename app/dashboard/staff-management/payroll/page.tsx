"use client";

import React, { useState, useEffect } from 'react';

type SalaryPayment = {
  id: string;
  employee: { firstName: string; lastName: string; employeeId: string; basicSalary: string };
  month: number;
  year: number;
  netSalary: string;
  status: string;
  paymentDate: string;
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  basicSalary: string;
};

export default function PayrollManagementPage() {
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [selectedEmp, setSelectedEmp] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [workingDays, setWorkingDays] = useState(22); // Default working days

  useEffect(() => {
    fetchPayments();
    fetchEmployees();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payroll');
      if (res.ok) setPayments(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const processPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmp, month: Number(month), year: Number(year), workingDays: Number(workingDays) })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Payroll processed successfully!');
        fetchPayments();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to process payroll');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
      
      {/* Generate Payroll Form */}
      <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', height: 'fit-content' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Generate Payroll</h2>
        
        <form onSubmit={processPayroll} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Select Employee *</label>
            <select className="input" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
              <option value="">-- Choose Staff --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Month</label>
              <input type="number" className="input" min="1" max="12" value={month} onChange={e => setMonth(Number(e.target.value))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Year</label>
              <input type="number" className="input" min="2020" max="2100" value={year} onChange={e => setYear(Number(e.target.value))} required />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Total Working Days in Month *</label>
            <input type="number" className="input" value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Calculate & Pay Salary'}
          </button>
        </form>
      </div>

      {/* Payroll History */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>Payroll History</h2>
        
        {isLoading ? (
          <div style={{ color: '#94a3b8' }}>Loading history...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {payments.map(pay => (
              <div key={pay.id} style={{ 
                background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{pay.employee.firstName} {pay.employee.lastName}</h4>
                  <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                    <span>Period: {pay.month}/{pay.year}</span>
                    <span>Paid on: {new Date(pay.paymentDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>৳ {Number(pay.netSalary).toLocaleString()}</div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '99px' }}>{pay.status}</span>
                </div>
              </div>
            ))}
            {payments.length === 0 && <div style={{ color: '#94a3b8' }}>No payroll history.</div>}
          </div>
        )}
      </div>

    </div>
  );
}
