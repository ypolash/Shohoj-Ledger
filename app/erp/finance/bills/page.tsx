"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Download, 
  Building, 
  CreditCard,
  DollarSign,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface Bill {
  id: string;
  billNumber: string;
  vendorName: string;
  category: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'DUE_SOON' | 'OVERDUE' | 'UNPAID' | 'PAID' | 'PARTIAL';
  notes?: string;
}

const INITIAL_BILLS: Bill[] = [
  {
    id: "bill-1",
    billNumber: "BILL-2026-089",
    vendorName: "Amazon Web Services (AWS)",
    category: "Cloud Infrastructure",
    issueDate: "2026-09-15",
    dueDate: "2026-09-28",
    amount: 4850,
    paidAmount: 0,
    status: "DUE_SOON",
    notes: "Monthly server clusters & database hosting"
  },
  {
    id: "bill-2",
    billNumber: "BILL-2026-090",
    vendorName: "Apex Raw Materials Ltd",
    category: "Inventory & Supply",
    issueDate: "2026-09-10",
    dueDate: "2026-10-02",
    amount: 18600,
    paidAmount: 5000,
    status: "PARTIAL",
    notes: "Fabric and raw material shipment for Q3"
  },
  {
    id: "bill-3",
    billNumber: "BILL-2026-091",
    vendorName: "Dhaka Central Power & Utility",
    category: "Office Utilities",
    issueDate: "2026-09-18",
    dueDate: "2026-10-05",
    amount: 13000,
    paidAmount: 0,
    status: "DUE_SOON",
    notes: "HQ Electricity and Water utility billing"
  },
  {
    id: "bill-4",
    billNumber: "BILL-2026-085",
    vendorName: "FiberNet Highspeed Telecom",
    category: "Internet & Telecom",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    amount: 3200,
    paidAmount: 3200,
    status: "PAID",
    notes: "Dedicated 100Mbps leased line"
  },
  {
    id: "bill-5",
    billNumber: "BILL-2026-084",
    vendorName: "Prime Logistics & Cargo",
    category: "Freight & Delivery",
    issueDate: "2026-08-25",
    dueDate: "2026-09-10",
    amount: 8500,
    paidAmount: 8500,
    status: "PAID",
    notes: "Inter-district inventory transfer"
  }
];

export default function BillsDuePage() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modal State for New Bill
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [newBillForm, setNewBillForm] = useState({
    vendorName: "",
    category: "Cloud Infrastructure",
    amount: "",
    dueDate: "",
    notes: ""
  });

  // Pay Bill Modal State
  const [payModalBill, setPayModalBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");

  // Computed KPI metrics
  const kpis = useMemo(() => {
    let totalDue = 0;
    let overdue = 0;
    let dueSoon = 0;
    let totalPaid = 0;

    bills.forEach((b) => {
      const remaining = b.amount - b.paidAmount;
      if (b.status === "PAID") {
        totalPaid += b.amount;
      } else {
        totalDue += remaining;
        if (b.status === "OVERDUE") overdue += remaining;
        if (b.status === "DUE_SOON" || b.status === "PARTIAL" || b.status === "UNPAID") dueSoon += remaining;
      }
    });

    return { totalDue, overdue, dueSoon, totalPaid };
  }, [bills]);

  // Filtered bills list
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && b.status !== "PAID") ||
        b.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || b.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bills, searchQuery, statusFilter, categoryFilter]);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillForm.vendorName || !newBillForm.amount || !newBillForm.dueDate) return;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber: `BILL-2026-${Math.floor(100 + Math.random() * 900)}`,
      vendorName: newBillForm.vendorName,
      category: newBillForm.category,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: newBillForm.dueDate,
      amount: parseFloat(newBillForm.amount),
      paidAmount: 0,
      status: "DUE_SOON",
      notes: newBillForm.notes
    };

    setBills([newBill, ...bills]);
    setIsNewBillOpen(false);
    setNewBillForm({
      vendorName: "",
      category: "Cloud Infrastructure",
      amount: "",
      dueDate: "",
      notes: ""
    });
  };

  const handlePayBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalBill || !paymentAmount) return;

    const payVal = parseFloat(paymentAmount);
    setBills(
      bills.map((b) => {
        if (b.id === payModalBill.id) {
          const newPaid = b.paidAmount + payVal;
          const isFullyPaid = newPaid >= b.amount;
          return {
            ...b,
            paidAmount: Math.min(b.amount, newPaid),
            status: isFullyPaid ? "PAID" : "PARTIAL"
          };
        }
        return b;
      })
    );

    setPayModalBill(null);
    setPaymentAmount("");
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => router.push('/erp/finance')}
            style={{ 
              background: 'var(--surface-hover)', border: '1px solid var(--border-light)', 
              color: 'var(--text-main)', padding: '8px 12px', borderRadius: '8px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' 
            }}
          >
            <ArrowLeft size={16} />
            <span>Finance Hub</span>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={26} color="#f43f5e" />
              <span>Bills Due &amp; Accounts Payable</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Manage corporate supplier liabilities, recurring operational bills, and upcoming clearance schedules
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsNewBillOpen(true)}
            style={{ 
              padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 
              border: 'none', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)' 
            }}
          >
            <Plus size={16} />
            <span>Record Vendor Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Bills Due</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f43f5e' }}>৳ {kpis.totalDue.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Across pending vendor invoices</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Due in Next 7-14 Days</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b' }}>৳ {kpis.dueSoon.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Scheduled for clearance</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '14px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Settled Bills</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>৳ {kpis.totalPaid.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>100% Cleared invoices</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by Bill #, Vendor or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: 'var(--surface-hover)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              background: 'var(--surface-hover)',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending &amp; Due Only</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="PAID">Settled (Paid)</option>
          </select>
        </div>
      </div>

      {/* Bills Due Table */}
      <div className="glass-card" style={{ padding: '0px', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Bill # / Invoice</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Vendor / Supplier</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '16px 20px', fontWeight: 600 }}>Due Date</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Balance Due</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '13px' }}>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div>No bills found matching your search filter.</div>
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => {
                const balanceDue = bill.amount - bill.paidAmount;
                const isPaid = bill.status === "PAID";

                return (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--primary)' }}>
                      {bill.billNumber}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{bill.vendorName}</div>
                      {bill.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{bill.notes}</div>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-hover)', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {bill.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', color: isPaid ? 'var(--text-muted)' : '#f59e0b', fontWeight: 600 }}>
                      {bill.dueDate}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)' }}>
                      ৳ {bill.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'right', color: isPaid ? '#10b981' : '#f43f5e' }}>
                      ৳ {balanceDue.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {bill.status === 'PAID' && (
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          ✓ Paid
                        </span>
                      )}
                      {bill.status === 'DUE_SOON' && (
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                          Due Soon
                        </span>
                      )}
                      {bill.status === 'PARTIAL' && (
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
                          Partial Paid
                        </span>
                      )}
                      {bill.status === 'OVERDUE' && (
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                          Overdue
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      {!isPaid ? (
                        <button
                          onClick={() => {
                            setPayModalBill(bill);
                            setPaymentAmount(balanceDue.toString());
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Pay Bill
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record New Bill Modal */}
      {isNewBillOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface-main, #0f172a)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '28px', color: '#fff' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800 }}>Record Vendor Bill</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Add a new supplier invoice or recurring operational obligation.
            </p>

            <form onSubmit={handleCreateBill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Vendor / Supplier Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Amazon Web Services, Cisco Systems"
                  value={newBillForm.vendorName}
                  onChange={(e) => setNewBillForm({ ...newBillForm, vendorName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Category *</label>
                  <select 
                    value={newBillForm.category}
                    onChange={(e) => setNewBillForm({ ...newBillForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Inventory & Supply">Inventory &amp; Supply</option>
                    <option value="Office Utilities">Office Utilities</option>
                    <option value="Internet & Telecom">Internet &amp; Telecom</option>
                    <option value="Legal & Audit">Legal &amp; Audit</option>
                    <option value="Marketing & Ads">Marketing &amp; Ads</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Total Amount (৳) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 15000"
                    value={newBillForm.amount}
                    onChange={(e) => setNewBillForm({ ...newBillForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Payment Due Date *</label>
                <input 
                  type="date" 
                  required
                  value={newBillForm.dueDate}
                  onChange={(e) => setNewBillForm({ ...newBillForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Notes / Invoice Reference</label>
                <input 
                  type="text" 
                  placeholder="e.g. Server cluster monthly billing"
                  value={newBillForm.notes}
                  onChange={(e) => setNewBillForm({ ...newBillForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewBillOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Bill Modal */}
      {payModalBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface-main, #0f172a)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', color: '#fff' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800 }}>Settle Vendor Bill</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Record payment disbursement for <strong style={{ color: '#fff' }}>{payModalBill.vendorName}</strong> ({payModalBill.billNumber})
            </p>

            <form onSubmit={handlePayBill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Outstanding Balance:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f43f5e' }}>
                  ৳ {(payModalBill.amount - payModalBill.paidAmount).toLocaleString()}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Payment Amount (৳) *</label>
                <input 
                  type="number" 
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Payment Account / Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                >
                  <option value="Bank Transfer">Primary Operating Bank (City Bank)</option>
                  <option value="Cash">Corporate Petty Cash</option>
                  <option value="bKash / MFS">Corporate Mobile Wallet (bKash)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPayModalBill(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
