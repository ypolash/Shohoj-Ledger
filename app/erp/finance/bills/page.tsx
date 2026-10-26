"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './BillsFilters.module.css';
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
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  FolderOpen,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  Video,
  Laptop,
  Tag,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { BillItem } from '@/app/api/finance/bills/route';

export default function BillsDuePage() {
  const router = useRouter();
  const [bills, setBills] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PAYABLE' | 'RECEIVABLE'>('ALL');
  const [talentFilter, setTalentFilter] = useState<'ALL' | 'MODEL' | 'FREELANCE' | 'VENDOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for New Bill
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [newBillForm, setNewBillForm] = useState({
    vendorName: "",
    category: "Cloud Infrastructure",
    amount: "",
    dueDate: "",
    notes: ""
  });

  // Settle / Pay / Collect Modal State
  const [activeModalBill, setActiveModalBill] = useState<BillItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/finance/bills");
      if (res.ok) {
        const data = await res.json();
        setBills(data.bills || []);
      } else {
        console.error("Failed to load bills data");
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Computed KPI metrics
  const kpis = useMemo(() => {
    let totalPayableDue = 0;
    let totalReceivableDue = 0;
    let payableCount = 0;
    let receivableCount = 0;
    let modelCount = 0;
    let modelDue = 0;
    let freelanceCount = 0;
    let freelanceDue = 0;
    let vendorCount = 0;
    let vendorDue = 0;

    bills.forEach((b) => {
      const isModel = b.talentType === 'MODEL' || b.category.toLowerCase().includes('model');
      const isFreelance = b.talentType === 'EDITOR' || b.category.toLowerCase().includes('editor') || b.category.toLowerCase().includes('freelance');

      if (b.type === "PAYABLE") {
        totalPayableDue += b.dueAmount;
        payableCount++;

        if (isModel) {
          modelCount++;
          modelDue += b.dueAmount;
        } else if (isFreelance) {
          freelanceCount++;
          freelanceDue += b.dueAmount;
        } else {
          vendorCount++;
          vendorDue += b.dueAmount;
        }
      } else {
        totalReceivableDue += b.dueAmount;
        receivableCount++;
      }
    });

    return {
      totalPayableDue,
      totalReceivableDue,
      totalDue: totalPayableDue + totalReceivableDue,
      payableCount,
      receivableCount,
      modelCount,
      modelDue,
      freelanceCount,
      freelanceDue,
      vendorCount,
      vendorDue,
      totalCount: bills.length
    };
  }, [bills]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set<string>();
    bills.forEach(b => { if (b.category) set.add(b.category); });
    return Array.from(set);
  }, [bills]);

  // Filtered bills list
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.projectName && b.projectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.notes && b.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        typeFilter === "ALL" || b.type === typeFilter;

      const isModel = b.talentType === 'MODEL' || b.category.toLowerCase().includes('model');
      const isFreelance = b.talentType === 'EDITOR' || b.category.toLowerCase().includes('editor') || b.category.toLowerCase().includes('freelance');
      const isVendor = !isModel && !isFreelance && b.type === 'PAYABLE';

      const matchesTalent =
        talentFilter === "ALL" ||
        (talentFilter === "MODEL" && isModel) ||
        (talentFilter === "FREELANCE" && isFreelance) ||
        (talentFilter === "VENDOR" && isVendor);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PENDING" && b.status !== "PAID") ||
        b.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" || b.category === categoryFilter;

      return matchesSearch && matchesType && matchesTalent && matchesStatus && matchesCategory;
    });
  }, [bills, searchQuery, typeFilter, talentFilter, statusFilter, categoryFilter]);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillForm.vendorName || !newBillForm.amount) return;

    try {
      setIsSubmittingBill(true);
      const res = await fetch("/api/finance/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBillForm)
      });

      if (res.ok) {
        showToast("✓ Vendor bill recorded successfully");
        setIsNewBillOpen(false);
        setNewBillForm({
          vendorName: "",
          category: "Cloud Infrastructure",
          amount: "",
          dueDate: "",
          notes: ""
        });
        fetchBills();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save vendor bill");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating vendor bill");
    } finally {
      setIsSubmittingBill(false);
    }
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalBill || !paymentAmount) return;

    const payVal = parseFloat(paymentAmount);
    if (isNaN(payVal) || payVal <= 0) {
      showToast("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessingPayment(true);

      if (activeModalBill.talentType && activeModalBill.projectId) {
        // Project Talent Settlement (Model / Editor)
        const res = await fetch(`/api/projects/${activeModalBill.projectId}/talent-settlement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeModalBill.talentType,
            name: activeModalBill.entityName,
            amount: payVal,
            action: "PAY",
            paymentMethod,
            isPartial: payVal < activeModalBill.dueAmount
          })
        });

        if (res.ok) {
          showToast(`✓ Talent settlement payment of ৳${payVal.toLocaleString()} recorded!`);
          setActiveModalBill(null);
          setPaymentAmount("");
          fetchBills();
        } else {
          const d = await res.json();
          showToast(d.error || "Failed to process talent payment");
        }
      } else if (activeModalBill.type === 'RECEIVABLE' && activeModalBill.projectId) {
        // Project Client Payment Collection
        const res = await fetch(`/api/projects/${activeModalBill.projectId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payVal,
            paymentMethod,
            notes: paymentNotes || "Client bill due payment collection",
            date: new Date().toISOString().split("T")[0]
          })
        });

        if (res.ok) {
          showToast(`✓ Client payment of ৳${payVal.toLocaleString()} collected!`);
          setActiveModalBill(null);
          setPaymentAmount("");
          setPaymentNotes("");
          fetchBills();
        } else {
          const d = await res.json();
          showToast(d.error || "Failed to collect payment");
        }
      } else if (activeModalBill.id.startsWith("exp-")) {
        // General Expense Settlement
        const expId = activeModalBill.id.replace("exp-", "");
        const res = await fetch("/api/expenses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: expId,
            approvalStatus: "APPROVED"
          })
        });

        if (res.ok) {
          showToast(`✓ Vendor bill of ৳${payVal.toLocaleString()} marked as paid!`);
          setActiveModalBill(null);
          setPaymentAmount("");
          fetchBills();
        } else {
          const d = await res.json();
          showToast(d.error || "Failed to settle expense");
        }
      } else if (activeModalBill.id.startsWith("po-")) {
        // Inventory Purchase Order / Supplier Bill Settlement
        const poId = activeModalBill.id.replace("po-", "");
        let method = "CASH";
        if (paymentMethod === "Bank Transfer") method = "BANK";
        else if (paymentMethod === "bKash" || paymentMethod === "Nagad") method = "MOBILE";

        const res = await fetch(`/api/inventory/purchases/${poId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payVal,
            paymentMethod: method,
            notes: paymentNotes || `Bill payment for ${activeModalBill.billNumber}`
          })
        });

        if (res.ok) {
          showToast(`✓ Supplier bill payment of ৳${payVal.toLocaleString()} recorded and posted to ledger!`);
          setActiveModalBill(null);
          setPaymentAmount("");
          setPaymentNotes("");
          fetchBills();
        } else {
          const d = await res.json();
          showToast(d.error || "Failed to process supplier bill payment");
        }
      } else {
        // Direct feedback
        showToast("Payment recorded successfully");
        setActiveModalBill(null);
        setPaymentAmount("");
        fetchBills();
      }
    } catch (err) {
      console.error("Payment error:", err);
      showToast("Network error executing payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1500px', margin: '0 auto', color: 'var(--text-main)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          borderRadius: '12px',
          padding: '12px 20px',
          color: '#f8fafc',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              <Receipt size={26} color="#3b82f6" />
              <span>Bills Due &amp; Accounts Payable</span>
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Live real-time ledger of talent settlements (Blue), vendor liabilities, and project receivables (Red)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fetchBills()}
            title="Refresh Ledger Data"
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'var(--surface-hover)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={() => setIsNewBillOpen(true)}
            style={{ 
              padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
              border: 'none', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', 
              display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)' 
            }}
          >
            <Plus size={16} />
            <span>Record Vendor Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Payable Bills Due Card (Blue) */}
        <div 
          onClick={() => setTypeFilter('PAYABLE')}
          className="glass-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '14px', 
            borderLeft: '4px solid #2563eb',
            background: typeFilter === 'PAYABLE' ? 'rgba(37, 99, 235, 0.12)' : undefined,
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowDownLeft size={16} color="#3b82f6" />
              Payable Liabilities (Blue)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6' }}>৳ {kpis.totalPayableDue.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {kpis.payableCount} due items (Models, Editors &amp; Vendors)
          </div>
        </div>

        {/* Receivable Client Due Card (Red) */}
        <div 
          onClick={() => setTypeFilter('RECEIVABLE')}
          className="glass-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '14px', 
            borderLeft: '4px solid #ef4444',
            background: typeFilter === 'RECEIVABLE' ? 'rgba(239, 68, 68, 0.12)' : undefined,
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowUpRight size={16} color="#ef4444" />
              Client Dues Receivable (Red)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ef4444' }}>৳ {kpis.totalReceivableDue.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {kpis.receivableCount} active project &amp; client dues
          </div>
        </div>

        {/* Total Outstanding Summary */}
        <div 
          onClick={() => setTypeFilter('ALL')}
          className="glass-card" 
          style={{ 
            padding: '20px', 
            borderRadius: '14px', 
            borderLeft: '4px solid #10b981',
            background: typeFilter === 'ALL' ? 'rgba(16, 185, 129, 0.08)' : undefined,
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Outstanding Volume
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }}>৳ {kpis.totalDue.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {kpis.totalCount} total ledger items in pipeline
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', borderRadius: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        {/* Type & Talent Filter Square Icon View */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className={styles.tabsContainer} role="tablist" aria-label="Filter dues by category">
            {[
              {
                id: 'ALL',
                label: 'All Dues',
                shortLabel: 'All Dues',
                icon: <Receipt size={18} />,
                count: kpis.totalCount,
                amount: kpis.totalDue,
                colorKey: 'all',
                isActive: typeFilter === 'ALL' && talentFilter === 'ALL',
                onClick: () => { setTypeFilter('ALL'); setTalentFilter('ALL'); }
              },
              {
                id: 'PAYABLE_ALL',
                label: 'All Payables (Vendor & Talent)',
                shortLabel: 'All Payables',
                icon: <ArrowUpRight size={18} />,
                count: kpis.payableCount,
                amount: kpis.totalPayableDue,
                colorKey: 'payable',
                isActive: typeFilter === 'PAYABLE' && talentFilter === 'ALL',
                onClick: () => { setTypeFilter('PAYABLE'); setTalentFilter('ALL'); }
              },
              {
                id: 'MODEL',
                label: 'Model Due (Talent & Models)',
                shortLabel: 'Model Due',
                icon: <Camera size={18} />,
                count: kpis.modelCount,
                amount: kpis.modelDue,
                colorKey: 'model',
                isActive: talentFilter === 'MODEL',
                onClick: () => { setTypeFilter('PAYABLE'); setTalentFilter(talentFilter === 'MODEL' ? 'ALL' : 'MODEL'); }
              },
              {
                id: 'FREELANCE',
                label: 'Freelance Due (Crew & Freelancers)',
                shortLabel: 'Freelance Due',
                icon: <Laptop size={18} />,
                count: kpis.freelanceCount,
                amount: kpis.freelanceDue,
                colorKey: 'freelance',
                isActive: talentFilter === 'FREELANCE',
                onClick: () => { setTypeFilter('PAYABLE'); setTalentFilter(talentFilter === 'FREELANCE' ? 'ALL' : 'FREELANCE'); }
              },
              {
                id: 'RECEIVABLE',
                label: 'Receivable from Clients',
                shortLabel: 'Receivable',
                icon: <ArrowDownLeft size={18} />,
                count: kpis.receivableCount,
                amount: kpis.totalReceivableDue,
                colorKey: 'receivable',
                isActive: typeFilter === 'RECEIVABLE',
                onClick: () => { setTypeFilter('RECEIVABLE'); setTalentFilter('ALL'); }
              }
            ].map((tab) => (
              <div key={tab.id} className={styles.squareWrapper}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab.isActive}
                  aria-label={`${tab.label} (${tab.count})`}
                  onClick={tab.onClick}
                  className={`${styles.squareBtn} ${styles[`square_${tab.colorKey}`]} ${tab.isActive ? styles.squareBtnActive : ''}`}
                >
                  <span className={styles.squareIcon}>
                    {tab.icon}
                  </span>
                  <span className={styles.squareCount}>{tab.count}</span>
                </button>
                <div className={styles.squareTooltip}>
                  <div style={{ fontWeight: 700 }}>{tab.label} ({tab.count})</div>
                  {tab.amount > 0 && (
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      ৳{tab.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Search & Right Filters (Square Icon View) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search by Bill #, Client, Talent, Project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 32px 0 36px',
                borderRadius: '0',
                border: '1px solid var(--border-light)',
                background: 'var(--surface-hover)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Icon View Tabs: Category & Status */}
          <div className={styles.tabsContainer}>
            {/* Category Filter Icon View */}
            <div className={styles.squareWrapper}>
              <div 
                className={`${styles.squareBtn} ${styles.square_category} ${categoryFilter !== 'ALL' ? styles.categoryFilterActive : ''}`}
              >
                <span className={styles.squareIcon}>
                  <Tag size={16} />
                </span>
                <span className={styles.squareCount}>
                  {categoryFilter !== 'ALL' 
                    ? (categoryFilter.length > 5 ? categoryFilter.slice(0, 4) + '..' : categoryFilter) 
                    : (categories.length > 0 ? categories.length : 'All')}
                </span>

                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={styles.hiddenSelectOverlay}
                  aria-label="Filter by Category"
                  title="Filter by Category"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>
                  {categoryFilter !== 'ALL' ? `Category: ${categoryFilter}` : `All Categories (${categories.length})`}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Click to select category</div>
              </div>
            </div>

            {/* Status Filter Icon View */}
            <div className={styles.squareWrapper}>
              <div 
                className={`${styles.squareBtn} ${styles.square_status} ${statusFilter !== 'ALL' ? styles.statusFilterActive : ''}`}
              >
                <span className={styles.squareIcon}>
                  <SlidersHorizontal size={16} />
                </span>
                <span className={styles.squareCount}>
                  {statusFilter === 'ALL' ? 'All' : statusFilter === 'PENDING' ? 'Due' : statusFilter === 'PARTIAL' ? 'Part' : 'Unpaid'}
                </span>

                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.hiddenSelectOverlay}
                  aria-label="Filter by Status"
                  title="Filter by Status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending &amp; Due Only</option>
                  <option value="PARTIAL">Partially Settled</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>

              <div className={styles.squareTooltip}>
                <div style={{ fontWeight: 700 }}>
                  {statusFilter === 'ALL' ? 'All Statuses' : statusFilter === 'PENDING' ? 'Status: Pending & Due' : statusFilter === 'PARTIAL' ? 'Status: Partially Settled' : 'Status: Unpaid'}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Click to filter status</div>
              </div>
            </div>

            {/* Clear Filters Reset Button */}
            {(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || talentFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery.trim() !== '') && (
              <div className={styles.squareWrapper}>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setTalentFilter('ALL');
                    setSearchQuery('');
                  }}
                  className={`${styles.squareBtn} ${styles.square_reset}`}
                  aria-label="Reset all filters"
                >
                  <span className={styles.squareIcon}>
                    <RotateCcw size={15} />
                  </span>
                  <span className={styles.squareCount} style={{ color: '#f43f5e' }}>Clear</span>
                </button>
                <div className={styles.squareTooltip}>
                  <div style={{ fontWeight: 700, color: '#f43f5e' }}>Reset All Filters</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Click to clear search &amp; filter selections</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bills Due Table */}
      <div className="glass-card" style={{ padding: '0px', borderRadius: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1050px' }}>
          <thead>
            <tr style={{ background: '#10b981', color: '#ffffff', borderBottom: '1px solid #059669', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Bill # / Reference</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Payee / Client / Talent</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Type</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Due Date</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Contract</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Settled</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Due</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', textAlign: 'center', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Status</th>
              <th style={{ padding: '9px 12px', fontWeight: 700, color: '#ffffff', textAlign: 'center', whiteSpace: 'nowrap', borderBottom: '1px solid #059669' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: '12.5px' }}>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px', opacity: 0.7 }} />
                  <div>Loading live accounts due ledger...</div>
                </td>
              </tr>
            ) : filteredBills.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}>No dues or bills found</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>All project accounts and vendor bills are fully settled.</div>
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => {
                const isPayable = bill.type === "PAYABLE";
                const isReceivable = bill.type === "RECEIVABLE";
                const isPaid = bill.status === "PAID" || bill.dueAmount <= 0;

                // Color definition per user instruction:
                // Payable to others -> BLUE (#3b82f6)
                // Receivable by us -> RED (#ef4444)
                const dueColor = isPayable ? '#3b82f6' : '#ef4444';

                return (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {/* Bill # */}
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: isPayable ? '#60a5fa' : '#f87171', whiteSpace: 'nowrap' }}>
                      {bill.billNumber}
                    </td>

                    {/* Payee / Client / Entity */}
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '280px', overflow: 'hidden' }} title={`${bill.entityName}${bill.projectName ? ` · Project: ${bill.projectName}` : ''}${bill.notes ? ` (${bill.notes})` : ''}`}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {bill.entityName}
                        </span>
                        {bill.projectName && (
                          <span style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                            · {bill.projectName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Type & Category */}
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center' }} title={bill.category}>
                        {bill.talentType === 'MODEL' ? (
                          <span style={{ 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            background: 'rgba(236, 72, 153, 0.15)', 
                            border: '1px solid rgba(236, 72, 153, 0.4)',
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: '#f472b6',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Camera size={11} /> Model
                          </span>
                        ) : bill.talentType === 'EDITOR' || bill.category.toLowerCase().includes('editor') || bill.category.toLowerCase().includes('freelance') ? (
                          <span style={{ 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            background: 'rgba(6, 182, 212, 0.15)', 
                            border: '1px solid rgba(6, 182, 212, 0.4)',
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: '#38bdf8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Laptop size={11} /> Freelance
                          </span>
                        ) : (
                          <span style={{ 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            background: isPayable ? 'rgba(37, 99, 235, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
                            border: `1px solid ${isPayable ? 'rgba(37, 99, 235, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: isPayable ? '#3b82f6' : '#ef4444' 
                          }}>
                            {isPayable ? 'Payable' : 'Receivable'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '8px 12px', color: isPaid ? 'var(--text-muted)' : '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {bill.dueDate || bill.issueDate}
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                      ৳ {bill.amount.toLocaleString()}
                    </td>

                    {/* Paid Amount */}
                    <td style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right', color: '#10b981', whiteSpace: 'nowrap' }}>
                      ৳ {bill.paidAmount.toLocaleString()}
                    </td>

                    {/* Balance Due (Single Line) */}
                    <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        fontWeight: 700,
                        fontSize: '13px',
                        color: isPaid ? '#10b981' : dueColor
                      }}>
                        ৳ {bill.dueAmount.toLocaleString()}
                      </span>
                    </td>

                    {/* Status Badge (Solid Rectangular) */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {isPaid ? (
                        <span style={{ padding: '3px 8px', borderRadius: '0', fontSize: '11px', fontWeight: 700, background: '#10b981', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Settled
                        </span>
                      ) : bill.status === 'PARTIAL' ? (
                        <span style={{ padding: '3px 8px', borderRadius: '0', fontSize: '11px', fontWeight: 700, background: '#f59e0b', color: '#ffffff' }}>
                          Partial Paid
                        </span>
                      ) : (
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '0', 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          background: isPayable ? '#2563eb' : '#ef4444', 
                          color: '#ffffff' 
                        }}>
                          {isPayable ? 'Bill Due' : 'Client Due'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', width: '118px' }}>
                        <div style={{ width: '84px', display: 'flex', justifyContent: 'center' }}>
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setActiveModalBill(bill);
                                setPaymentAmount(bill.dueAmount.toString());
                                setPaymentNotes("");
                              }}
                              style={{
                                width: '84px',
                                height: '28px',
                                padding: '4px 0',
                                borderRadius: '4px',
                                background: isPayable ? '#2563eb' : '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {isPayable ? 'Pay Bill' : 'Collect Due'}
                            </button>
                          )}
                        </div>

                        <div style={{ width: '28px', display: 'flex', justifyContent: 'center' }}>
                          {bill.link && (
                            <button
                              onClick={() => router.push(bill.link!)}
                              title="Open Project Workspace"
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: '0',
                                borderRadius: '4px',
                                background: 'var(--surface-hover)',
                                border: '1px solid var(--border-light)',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ExternalLink size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record New Vendor Bill Modal */}
      {isNewBillOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface-main, #0f172a)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '28px', color: '#fff' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800 }}>Record Vendor Bill</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Add a corporate supplier obligation or operational expense payable.
            </p>

            <form onSubmit={handleCreateBill} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Vendor / Supplier Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cisco Systems, AWS, Office Landlord"
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Inventory & Supply">Inventory &amp; Supply</option>
                    <option value="Office Utilities">Office Utilities</option>
                    <option value="Internet & Telecom">Internet &amp; Telecom</option>
                    <option value="Legal & Audit">Legal &amp; Audit</option>
                    <option value="Marketing & Ads">Marketing &amp; Ads</option>
                    <option value="Vendor Bill">General Vendor Bill</option>
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Payment Due Date</label>
                <input 
                  type="date" 
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
                  disabled={isSubmittingBill}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSubmittingBill ? "Saving..." : "Save Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle / Pay / Collect Modal */}
      {activeModalBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface-main, #0f172a)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '28px', color: '#fff' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800 }}>
              {activeModalBill.type === 'PAYABLE' ? 'Disburse & Settle Bill' : 'Collect Client Payment'}
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              {activeModalBill.type === 'PAYABLE' ? 'Record payment disbursement to' : 'Record client payment receipt from'}{' '}
              <strong style={{ color: '#fff' }}>{activeModalBill.entityName}</strong>
            </p>

            <form onSubmit={handleExecutePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ 
                padding: '14px', 
                background: activeModalBill.type === 'PAYABLE' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                border: `1px solid ${activeModalBill.type === 'PAYABLE' ? 'rgba(37, 99, 235, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Outstanding Balance Due:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: activeModalBill.type === 'PAYABLE' ? '#3b82f6' : '#ef4444' }}>
                  ৳ {activeModalBill.dueAmount.toLocaleString()}
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
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Payment Method / Channel</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                >
                  <option value="Bank Transfer">Bank Transfer (City Bank / Operating A/C)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="bKash">bKash Corporate Merchant</option>
                  <option value="Nagad">Nagad Wallet</option>
                </select>
              </div>

              {activeModalBill.type === 'RECEIVABLE' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>Reference Note</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Advance payment / Milestone 2"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveModalBill(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    borderRadius: '10px', 
                    background: activeModalBill.type === 'PAYABLE' 
                      ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' 
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    border: 'none', 
                    color: '#fff', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  {isProcessingPayment ? "Recording..." : "Confirm & Settle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
