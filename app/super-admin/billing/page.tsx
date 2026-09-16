"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Receipt,
  Trash2,
} from "lucide-react";
import styles from "./billing.module.css";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  companyId: string;
  amount: number;
  status: string;
  dueDate: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  createdAt: string;
  company?: {
    id: string;
    name: string;
    businessType: string;
    status: string;
  };
}

interface CompanyOption {
  id: string;
  name: string;
  businessType?: string;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState<number | string>(0);
  const [dueDate, setDueDate] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/billing");
      if (res.status === 401) {
        window.location.href = "/super-admin/login";
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch billing data");
      }
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/system/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        if (data.companies?.length > 0 && !companyId) {
          setCompanyId(data.companies[0].id);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv))
      );

      const res = await fetch("/api/system/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      showToast(`Invoice marked as ${newStatus}`);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to update invoice status", "error");
      fetchInvoices();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !amount || !dueDate) {
      showToast("Please provide company, amount, and due date", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/system/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          amount: Number(amount) || 0,
          dueDate,
          billingPeriodStart: billingPeriodStart || null,
          billingPeriodEnd: billingPeriodEnd || null,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      showToast("Invoice generated successfully!");
      setShowModal(false);
      fetchInvoices();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to create invoice", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice record?")) return;
    try {
      const res = await fetch(`/api/system/billing?invoiceId=${invoiceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      showToast("Invoice deleted successfully");
      fetchInvoices();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to delete invoice", "error");
    }
  };

  // Metrics computation
  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const pendingInvoices = invoices.filter((inv) => inv.status === "PENDING");
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const overdueInvoices = invoices.filter((inv) => inv.status === "OVERDUE");
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.amount.toString().includes(searchTerm);

    const matchesStatus = !statusFilter || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={styles.toast}
          style={{ backgroundColor: toastMessage.type === "success" ? "#10b981" : "#ef4444" }}
        >
          {toastMessage.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Mission Control Header Card */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Automated Invoice Dispatch &amp; Settlement Engine Active</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Receipt size={26} style={{ color: "#34d399" }} />
            SaaS Billing &amp; Invoices
          </h1>
          <p className={styles.pageSubtitle}>
            Supervise multi-tenant invoice lifecycles, monitor revenue collection, issue custom enterprise invoices, and manage payment settlements.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Invoices"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ""} />
            <span>{loading ? "Refreshing..." : "Refresh Invoices"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              setDueDate(nextMonth.toISOString().slice(0, 10));
              setBillingPeriodStart(now.toISOString().slice(0, 10));
              setBillingPeriodEnd(nextMonth.toISOString().slice(0, 10));
              setAmount(29);
              setShowModal(true);
            }}
            className={styles.primaryActionBtn}
          >
            <Plus size={16} />
            <span>Generate Invoice</span>
          </button>
        </div>
      </section>

      {/* 2. KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Total Billed */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <Receipt size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
              {totalInvoices} Invoices
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Total Invoices Billed</span>
            <span className={styles.kpiValue} style={{ color: "#34d399" }}>
              ${totalBilled.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Paid & Collected */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              <CheckCircle2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
              {paidInvoices.length} Settled
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Paid &amp; Collected</span>
            <span className={styles.kpiValue} style={{ color: "#60a5fa" }}>
              ${totalPaid.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <Clock size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              {pendingInvoices.length} Awaiting
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Pending Collection</span>
            <span className={styles.kpiValue} style={{ color: "#fbbf24" }}>
              ${totalPending.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
              <AlertCircle size={24} />
            </div>
            <span
              className={styles.kpiBadge}
              style={{
                background: overdueInvoices.length > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(100, 116, 139, 0.15)",
                color: overdueInvoices.length > 0 ? "#f87171" : "#94a3b8",
              }}
            >
              {overdueInvoices.length > 0 ? "Action Needed" : "Zero Overdue"}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Overdue Accounts</span>
            <span className={styles.kpiValue} style={{ color: overdueInvoices.length > 0 ? "#f87171" : "#ffffff" }}>
              ${totalOverdue.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Data Card & Governance Controls */}
      <section className={styles.mainCard}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.controlsLeft}>
            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by invoice #, company, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className={styles.clearSearchBtn}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="VOID">Void</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className={styles.filterTabsRow}>
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className={`${styles.filterTabBtn} ${statusFilter === "" ? styles.filterTabBtnActive : ""}`}
          >
            <Receipt size={13} />
            <span>All Invoices ({totalInvoices})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("PAID")}
            className={`${styles.filterTabBtn} ${statusFilter === "PAID" ? styles.filterTabBtnActive : ""}`}
          >
            <CheckCircle2 size={13} />
            <span>Paid ({paidInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`${styles.filterTabBtn} ${statusFilter === "PENDING" ? styles.filterTabBtnActive : ""}`}
          >
            <Clock size={13} />
            <span>Pending ({pendingInvoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("OVERDUE")}
            className={`${styles.filterTabBtn} ${statusFilter === "OVERDUE" ? styles.filterTabBtnActive : ""}`}
          >
            <AlertCircle size={13} />
            <span>Overdue ({overdueInvoices.length})</span>
          </button>
        </div>

        {/* Invoices Table */}
        <div className={styles.tableContainer}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Invoice # &amp; Date</th>
                <th>Tenant / Company</th>
                <th>Billed Amount</th>
                <th>Billing Period</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <RefreshCw size={24} className={styles.spinning} style={{ color: "#10b981" }} />
                      <span>Loading tenant invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className={styles.emptyState}>
                      <Receipt size={48} style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#cbd5e1" }}>No billing records found</p>
                      <span style={{ fontSize: "13px" }}>There are currently no tenant invoices matching this filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "PAID";
                  const isPending = inv.status === "PENDING";
                  const isOverdue = inv.status === "OVERDUE";
                  const statusClass = isPaid
                    ? styles.statusPaid
                    : isPending
                    ? styles.statusPending
                    : isOverdue
                    ? styles.statusOverdue
                    : styles.statusVoid;

                  return (
                    <tr key={inv.id} className={styles.invoiceRow}>
                      {/* Invoice # & Created */}
                      <td>
                        <div className={styles.invoiceIdentityCell}>
                          <div className={styles.invoiceIconBox}>
                            <FileText size={18} />
                          </div>
                          <div className={styles.invoiceInfoText}>
                            <span className={styles.invoiceNumber}>{inv.invoiceNumber}</span>
                            <span className={styles.invoiceCreatedDate}>
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td>
                        <div className={styles.companyCell}>
                          <Building2 size={15} style={{ color: "#64748b" }} />
                          <div>
                            <span className={styles.companyName}>{inv.company?.name || "Unknown"}</span>
                            <div className={styles.companySector}>{inv.company?.businessType || "Enterprise"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td>
                        <span className={styles.amountDisplay}>${Number(inv.amount).toFixed(2)}</span>
                      </td>

                      {/* Period */}
                      <td style={{ color: "#94a3b8", fontSize: "12.5px" }}>
                        {inv.billingPeriodStart && inv.billingPeriodEnd ? (
                          <span>
                            {new Date(inv.billingPeriodStart).toLocaleDateString()} -{" "}
                            {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: "#64748b" }}>Standard Term</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: 600 }}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`${styles.statusPill} ${statusClass}`}>
                          <div className={styles.statusDot} />
                          <span>{inv.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className={styles.actionsGroup}>
                          <select
                            value={inv.status}
                            onChange={(e) => handleUpdateStatus(inv.id, e.target.value)}
                            className={styles.statusActionSelect}
                            title="Update Invoice Status"
                          >
                            <option value="PAID">Mark Paid</option>
                            <option value="PENDING">Set Pending</option>
                            <option value="OVERDUE">Set Overdue</option>
                            <option value="VOID">Set Void</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDelete(inv.id)}
                            className={styles.iconDeleteBtn}
                            title="Delete Invoice Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Generate Invoice Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Receipt size={18} style={{ color: "#10b981" }} />
                Generate New SaaS Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Tenant / Company *</label>
                  <select
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="" disabled>Choose a company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.businessType || "Company"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGridTwoCol}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Invoice Amount (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Due Date *</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGridTwoCol}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Billing Period Start</label>
                    <input
                      type="date"
                      value={billingPeriodStart}
                      onChange={(e) => setBillingPeriodStart(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Billing Period End</label>
                    <input
                      type="date"
                      value={billingPeriodEnd}
                      onChange={(e) => setBillingPeriodEnd(e.target.value)}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="PENDING">Pending (Unpaid)</option>
                    <option value="PAID">Paid (Immediate Settlement)</option>
                    <option value="OVERDUE">Overdue</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.modalSubmitBtn}
                >
                  {isSubmitting ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
