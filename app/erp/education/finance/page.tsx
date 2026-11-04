"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface AcademyFee {
  id: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  paidAmount: number;
  dueAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  dueDate: string | null;
  paymentDate: string | null;
  createdAt: string;
}

interface FinanceSummary {
  totalBilled: number;
  totalCollected: number;
  totalDues: number;
  totalTeacherSalary: number;
  totalProjectTeacherOutlay?: number;
  totalFacultyOutlay?: number;
  netAcademyMargin: number;
}

interface Student {
  id: string;
  studentId: string;
  name: string;
  className: string | null;
  schoolOrCollege: string | null;
}

export default function EducationFinancePage() {
  const [fees, setFees] = useState<AcademyFee[]>([]);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalBilled: 0,
    totalCollected: 0,
    totalDues: 0,
    totalTeacherSalary: 0,
    totalProjectTeacherOutlay: 0,
    totalFacultyOutlay: 0,
    netAcademyMargin: 0,
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feeTypeFilter, setFeeTypeFilter] = useState("ALL");

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<AcademyFee | null>(null);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [invoiceForm, setInvoiceForm] = useState({
    studentId: "",
    studentName: "",
    feeType: "Tuition Fee",
    amount: "1500",
    paidAmount: "0",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, stuRes] = await Promise.all([
        fetch(`/api/education/finance${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`).catch(() => null),
        fetch("/api/education/students").catch(() => null),
      ]);

      if (finRes && finRes.ok) {
        const json = await finRes.json();
        if (json.success) {
          setFees(json.data.fees || []);
          setSummary(json.data.summary || {
            totalBilled: 0,
            totalCollected: 0,
            totalDues: 0,
            totalTeacherSalary: 0,
            totalProjectTeacherOutlay: 0,
            totalFacultyOutlay: 0,
            netAcademyMargin: 0,
          });
        }
      }

      if (stuRes && stuRes.ok) {
        const sJson = await stuRes.json();
        if (sJson.success) setStudents(sJson.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStudentSelect = (selectedId: string) => {
    const s = students.find((st) => st.studentId === selectedId);
    if (s) {
      setInvoiceForm((prev) => ({
        ...prev,
        studentId: s.studentId,
        studentName: s.name,
      }));
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.studentName || !invoiceForm.amount) return;

    setSubmittingInvoice(true);
    setError("");
    try {
      const res = await fetch("/api/education/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceForm),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Fee Invoice for "${invoiceForm.studentName}" generated successfully!`);
        setShowInvoiceModal(false);
        setInvoiceForm({
          studentId: "",
          studentName: "",
          feeType: "Tuition Fee",
          amount: "1500",
          paidAmount: "0",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
        fetchData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to create invoice");
      }
    } catch {
      setError("Network error creating invoice");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleOpenPayment = (fee: AcademyFee) => {
    setSelectedFeeForPayment(fee);
    setPaymentAmount(String(fee.dueAmount));
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeForPayment || !paymentAmount) return;

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/education/finance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeId: selectedFeeForPayment.id,
          paidAmount: Number(paymentAmount),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Payment of ৳${paymentAmount} collected.`);
        setShowPaymentModal(false);
        setSelectedFeeForPayment(null);
        fetchData();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        f.studentName.toLowerCase().includes(q) ||
        f.studentId.toLowerCase().includes(q) ||
        f.feeType.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" || f.status === statusFilter;

      const matchesType =
        feeTypeFilter === "ALL" || f.feeType === feeTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [fees, search, statusFilter, feeTypeFilter]);

  const feeTypes = useMemo(() => {
    const set = new Set(fees.map((f) => f.feeType).filter(Boolean));
    return Array.from(set);
  }, [fees]);

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Total Fees Billed", value: `৳${summary.totalBilled.toLocaleString()}`, icon: "receipt_long", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Total Collected", value: `৳${summary.totalCollected.toLocaleString()}`, icon: "payments", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Outstanding Dues", value: `৳${summary.totalDues.toLocaleString()}`, icon: "pending_actions", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
          { label: "Salary Faculty Outlay", value: `৳${summary.totalTeacherSalary.toLocaleString()}`, icon: "badge", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" },
          { label: "Project Faculty Outlay", value: `৳${(summary.totalProjectTeacherOutlay || 0).toLocaleString()}`, icon: "assignment", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          {
            label: "Net Academy Margin",
            value: `${summary.netAcademyMargin >= 0 ? "+" : ""}৳${summary.netAcademyMargin.toLocaleString()}`,
            icon: summary.netAcademyMargin >= 0 ? "trending_up" : "trending_down",
            color: summary.netAcademyMargin >= 0 ? "#10b981" : "#ef4444",
            bg: summary.netAcademyMargin >= 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
          },
        ].map((card, i) => (
          <div key={i} className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>{card.label}</div>
              <div className={styles.kpiValue} style={{ color: card.color }}>{card.value}</div>
            </div>
            <div className={styles.kpiIconBox} style={{ background: card.bg, color: card.color }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                {card.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      {success && (
        <div style={{ padding: "12px 18px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#10b981", fontSize: "13px", fontWeight: 600, borderRadius: "0px" }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 18px", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#ef4444", fontSize: "13px", fontWeight: 600, borderRadius: "0px" }}>
          ✕ {error}
        </div>
      )}

      {/* Standard Controls Bar */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsGroup}>
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
            <input
              type="text"
              placeholder="Search by student name, ID, fee category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Status Tabs Segmented Button */}
          <div className={styles.buttonGroup}>
            {["ALL", "PENDING", "PARTIAL", "PAID"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`${styles.buttonGroupItem} ${
                  statusFilter === st ? styles.buttonGroupItemActive : ""
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Fee Type Filter */}
          <select
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Fee Categories</option>
            {feeTypes.map((ft) => (
              <option key={ft} value={ft}>
                {ft}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Invoice Button */}
        <button
          onClick={() => {
            setError("");
            setShowInvoiceModal(true);
          }}
          className={styles.btnPrimary}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add_card
          </span>
          Issue Fee Invoice
        </button>
      </div>

      {/* Invoices Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Student Roll &amp; Name</th>
                <th className={styles.th}>Fee Category</th>
                <th className={styles.th}>Total Amount</th>
                <th className={styles.th}>Paid</th>
                <th className={styles.th}>Balance Due</th>
                <th className={styles.th}>Due Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading student fee ledgers &amp; invoices...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No fee records found for the selected filter. Click &quot;Issue Fee Invoice&quot; to bill a student.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr key={fee.id} className={styles.tr}>
                    {/* Student */}
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className={styles.avatar}>
                          {fee.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                            {fee.studentName}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            ID: {fee.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Fee Type */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                        {fee.feeType}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className={styles.td} style={{ fontWeight: 700, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
                      ৳{Number(fee.amount).toLocaleString()}
                    </td>

                    {/* Paid Amount */}
                    <td className={styles.td} style={{ fontWeight: 700, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                      ৳{Number(fee.paidAmount).toLocaleString()}
                    </td>

                    {/* Due Amount */}
                    <td className={styles.td} style={{ fontWeight: 700, color: fee.dueAmount > 0 ? "#ef4444" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      ৳{Number(fee.dueAmount).toLocaleString()}
                    </td>

                    {/* Due Date */}
                    <td className={styles.td} style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                      {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "Immediate"}
                    </td>

                    {/* Status Badge */}
                    <td className={styles.td}>
                      <span
                        className={`${styles.pillBadge} ${
                          fee.status === "PAID"
                            ? styles.pillBadgeSuccess
                            : fee.status === "PARTIAL"
                            ? styles.pillBadgeWarning
                            : styles.pillBadgeNeutral
                        }`}
                      >
                        {fee.status}
                      </span>
                    </td>

                    {/* Record Payment Button */}
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      {fee.status !== "PAID" ? (
                        <button
                          onClick={() => handleOpenPayment(fee)}
                          className={styles.btnPrimary}
                          style={{ padding: "6px 14px", fontSize: "12px" }}
                        >
                          Collect
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700 }}>
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Fee Invoice Modal */}
      {showInvoiceModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Issue Student Fee Invoice
                </h3>
                <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Bill tuition, laboratory, exam, or admission dues
                </p>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateInvoice} className={styles.modalBody}>
              <div>
                <label className={styles.formLabel}>
                  Select Enrolled Student
                </label>
                <select
                  value={invoiceForm.studentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="">-- Choose from Enrolled Students or Enter Below --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.studentId}>
                      {s.name} ({s.studentId}) - {s.className || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={invoiceForm.studentName}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, studentName: e.target.value })
                    }
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Student ID
                  </label>
                  <input
                    type="text"
                    placeholder="STU-1001"
                    value={invoiceForm.studentId}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, studentId: e.target.value })
                    }
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Fee Category
                </label>
                <select
                  value={invoiceForm.feeType}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, feeType: e.target.value })
                  }
                  className={styles.formInput}
                >
                  <option value="Tuition Fee">Tuition Fee</option>
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Laboratory & Research Fee">Laboratory &amp; Research Fee</option>
                  <option value="Library & Course Materials">Library &amp; Course Materials</option>
                  <option value="Extracurricular / Sports Fee">Extracurricular / Sports Fee</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Total Billed Amount (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={invoiceForm.amount}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, amount: e.target.value })
                    }
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Initial Collected (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceForm.paidAmount}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, paidAmount: e.target.value })
                    }
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                  }
                  className={styles.formInput}
                />
              </div>

              {/* Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className={styles.btnPrimary}
                >
                  {submittingInvoice ? "Issuing..." : "Confirm & Issue Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedFeeForPayment && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: "460px" }}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>
                  Record Payment Collection
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  Student: {selectedFeeForPayment.studentName}
                </p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleRecordPayment} className={styles.modalBody}>
              <div
                style={{
                  padding: "14px 18px",
                  background: "var(--surface-hover)",
                  border: "1px solid var(--border-main)",
                  borderRadius: "0px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600 }}>Total Billed</div>
                  <div style={{ fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>৳{Number(selectedFeeForPayment.amount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600 }}>Currently Paid</div>
                  <div style={{ fontWeight: 800, color: "#10b981", marginTop: "2px" }}>৳{Number(selectedFeeForPayment.paidAmount).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 600 }}>Remaining Due</div>
                  <div style={{ fontWeight: 800, color: "#ef4444", marginTop: "2px" }}>৳{Number(selectedFeeForPayment.dueAmount).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Payment Amount to Collect (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedFeeForPayment.dueAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={styles.formInput}
                  style={{ fontSize: "16px", fontWeight: 700 }}
                />
              </div>

              {/* Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className={styles.btnPrimary}
                >
                  {submittingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
