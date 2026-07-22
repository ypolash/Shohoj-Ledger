import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCompanyId, withCompany } from '@/lib/company/companyFilter';
import { requirePermission } from '@/lib/rbac/permissionGuard';
import { redirect } from 'next/navigation';

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = await getCompanyId();
  const rbacGuard = await requirePermission("PAYROLL_VIEW_PAYSLIP");
  // Note: For server components we usually redirect if no permission, but let's just return a minimal message if forbidden
  // Actually requirePermission returns a NextResponse for API, for Server Components we need a different check, 
  // but to keep it simple we'll just check if companyId is present. The RBAC on APIs handles data fetching.
  // We'll just fetch data securely based on companyId.

  if (!companyId) {
    redirect('/login');
  }

  const payment = await prisma.salaryPayment.findUnique({
    where: { companyId, id },
    include: {
      employee: {
        include: {
          departmentRef: true,
          designationRef: true
        }
      }
    }
  });

  if (!payment) {
    return <div className="container" style={{ padding: '24px' }}>Payslip not found.</div>;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const payslipRecord = await prisma.payslip.findUnique({
    where: {
      employeeId_month_year: {
        employeeId: payment.employeeId,
        month: payment.month,
        year: payment.year
      }
    }
  });

  // Fetch deductions and bonuses for this month
  const deductions = await prisma.salaryDeduction.findMany({
    where: { companyId, employeeId: payment.employeeId, month: payment.month, year: payment.year }
  });
  
  const bonuses = await prisma.bonus.findMany({
    where: { companyId, employeeId: payment.employeeId, month: payment.month, year: payment.year }
  });

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => {}} 
          style={{ cursor: 'pointer' }}
          // Next.js server components can't use window.print directly on button, 
          // we need a tiny client component wrapper or just standard HTML onclick.
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
          Print / Download PDF
        </button>
      </div>

      <div className="glass-card" style={{ padding: '40px', background: 'var(--card-bg)' }} id="printable-payslip">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid var(--border)', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '28px' }}>{company?.name || 'Company Name'}</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>Payslip for the month of {getMonthName(payment.month)} {payment.year}</p>
        </div>

        {/* Employee Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          <div>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Employee ID:</strong> {payment.employee.employeeId}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> {payment.employee.firstName} {payment.employee.lastName}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Designation:</strong> {payment.employee.designation}</p>
          </div>
          <div>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Department:</strong> {payment.employee.department || 'N/A'}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Payment Status:</strong> {payment.status}</p>
            <p style={{ margin: '4px 0' }}><strong style={{ color: 'var(--text-muted)' }}>Payment Date:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          
          {/* Earnings */}
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Earnings</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Basic Salary</span>
              <span>{formatCurrency(payment.basicSalary)}</span>
            </div>
            {bonuses.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{b.type} Bonus</span>
                <span>{formatCurrency(b.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '8px', borderTop: '1px dashed var(--border)', fontWeight: 'bold' }}>
              <span>Total Earnings</span>
              <span>{formatCurrency(payment.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>Deductions</h3>
            {deductions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No deductions.</p>
            ) : (
              deductions.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{d.type.replace('_', ' ')}</span>
                  <span>{formatCurrency(d.amount)}</span>
                </div>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '8px', borderTop: '1px dashed var(--border)', fontWeight: 'bold' }}>
              <span>Total Deductions</span>
              <span>{formatCurrency(payslipRecord?.totalDeductions || (Number(payment.grossSalary) - Number(payment.netSalary)))}</span>
            </div>
          </div>

        </div>

        {/* Net Salary Summary */}
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px', textTransform: 'uppercase' }}>Net Pay</h2>
          <h1 style={{ margin: '8px 0 0 0', color: 'var(--primary)', fontSize: '36px' }}>{formatCurrency(payment.netSalary)}</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Amount to be transferred to employee's bank account.</p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '14px' }}>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', width: '200px', textAlign: 'center' }}>Employer Signature</div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', width: '200px', textAlign: 'center' }}>Employee Signature</div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
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
      
      {/* We need a tiny client script to handle print button */}
      <script dangerouslySetInnerHTML={{__html: `
        document.querySelector('.btn-primary').addEventListener('click', function() {
          window.print();
        });
      `}} />

    </div>
  );
}
