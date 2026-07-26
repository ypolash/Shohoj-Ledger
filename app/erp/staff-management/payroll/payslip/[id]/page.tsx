import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCompanyId, withCompany } from '@/lib/company/companyFilter';
import { requirePermission } from '@/lib/rbac/permissionGuard';
import { redirect } from 'next/navigation';

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = await getCompanyId();
  const rbacGuard = await requirePermission("PAYROLL_VIEW_PAYSLIP");

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

  // Fetch Approval Info
  const approvalAudit = await prisma.payrollAudit.findFirst({
    where: { companyId, salaryPaymentId: id, newStatus: 'APPROVED' },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val));
  };

  // Construct QR code URL
  // In a real app this might be a link to verify the payslip on the app.
  const verifyUrl = `https://ledger.shohoj.com/verify/payslip/${payment.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}&margin=0`;

  return (
    <div className="container" style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => {}} 
          style={{ cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
          Print / Download PDF
        </button>
      </div>

      <div className="glass-card" style={{ padding: '40px', background: 'var(--card-bg)' }} id="printable-payslip">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '2px solid var(--border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '28px' }}>{company?.name || 'Company Name'}</h1>
            <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)' }}>Payslip for the month of <strong>{getMonthName(payment.month)} {payment.year}</strong></p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <img src={qrCodeUrl} alt="Verify QR Code" style={{ width: '80px', height: '80px', border: '1px solid var(--border)', padding: '4px', borderRadius: '4px', background: 'white' }} />
             <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Scan to Verify</div>
          </div>
        </div>

        {/* Info Blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Employee Info */}
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Employee Details</h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>ID:</strong> {payment.employee.employeeId}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> {payment.employee.firstName} {payment.employee.lastName}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Designation:</strong> {payment.employee.designation}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Department:</strong> {payment.employee.department || 'N/A'}</p>
          </div>
          
          {/* Payment Info */}
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Payment Details</h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Status:</strong> 
              <span style={{ color: payment.status === 'PAID' ? 'var(--success)' : 'inherit', marginLeft: '4px', fontWeight: 600 }}>{payment.status}</span>
            </p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Date:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}</p>
            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Method:</strong> {payment.paymentMethod || 'N/A'}</p>
            {payment.transactionRef && <p style={{ margin: '4px 0', fontSize: '14px' }}><strong style={{ color: 'var(--text-muted)' }}>Ref:</strong> {payment.transactionRef}</p>}
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
          
          {/* Earnings */}
          <div>
            <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', fontSize: '16px' }}>Earnings</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
              <span>Basic Salary</span>
              <span>{formatCurrency(payment.basicSalary)}</span>
            </div>
            {bonuses.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                <span>{b.type} Bonus</span>
                <span>{formatCurrency(b.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)', fontWeight: 'bold', fontSize: '16px' }}>
              <span>Total Earnings</span>
              <span>{formatCurrency(payment.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 style={{ borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', fontSize: '16px' }}>Deductions</h3>
            {deductions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '14px' }}>No deductions for this period.</p>
            ) : (
              deductions.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                  <span>{d.type.replace('_', ' ')}</span>
                  <span>{formatCurrency(d.amount)}</span>
                </div>
              ))
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border)', fontWeight: 'bold', fontSize: '16px' }}>
              <span>Total Deductions</span>
              <span>{formatCurrency(payslipRecord?.totalDeductions || (Number(payment.grossSalary) - Number(payment.netSalary)))}</span>
            </div>
          </div>

        </div>

        {/* Net Salary Summary */}
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '24px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Pay</h2>
          <h1 style={{ margin: '8px 0 0 0', color: 'var(--primary)', fontSize: '40px' }}>{formatCurrency(payment.netSalary)}</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Amount transferred to employee account.</p>
        </div>

        {/* Approval Info */}
        <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {approvalAudit ? (
             <div>
               <strong>Approval Information:</strong> Approved by {approvalAudit.user.name} ({approvalAudit.role.replace('_', ' ')}) on {new Date(approvalAudit.createdAt).toLocaleString()}.
             </div>
          ) : (
             <div><strong>Approval Information:</strong> Awaiting formal approval.</div>
          )}
          {payment.paymentNote && (
            <div style={{ marginTop: '8px' }}>
              <strong>Payment Notes:</strong> {payment.paymentNote}
            </div>
          )}
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
