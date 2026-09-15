"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./notices.module.css";

interface Department {
  id: string;
  name: string;
  code?: string;
}

interface Notice {
  id: string;
  title: string;
  message: string;
  targetType: string;
  targetId: string | null;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_NOTICE_FORM = {
  title: "",
  message: "",
  targetType: "ALL",
  targetId: "",
  priority: "NORMAL",
};

export default function HRNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [noticeForm, setNoticeForm] = useState(EMPTY_NOTICE_FORM);
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [noticesRes, deptsRes, empsRes] = await Promise.all([
        fetch("/api/hr/notices").catch(() => null),
        fetch("/api/departments").catch(() => null),
        fetch("/api/employees").catch(() => null),
      ]);

      if (noticesRes && noticesRes.ok) {
        const nData = await noticesRes.json();
        setNotices(nData.notices || []);
      }
      if (deptsRes && deptsRes.ok) {
        const dData = await deptsRes.json();
        setDepartments(Array.isArray(dData) ? dData : []);
      }
      if (empsRes && empsRes.ok) {
        const eData = await empsRes.json();
        setStaffCount(Array.isArray(eData) ? eData.length : 0);
      }
    } catch (err) {
      console.error("[HR Notices] Load data error:", err);
      showToast("Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metrics
  const metrics = useMemo(() => {
    const total = notices.length;
    const active = notices.filter((n) => n.status === "ACTIVE").length;
    const urgent = notices.filter(
      (n) => (n.priority === "URGENT" || n.priority === "IMPORTANT") && n.status === "ACTIVE"
    ).length;
    return { total, active, urgent, staffCount };
  }, [notices, staffCount]);

  // Filtered Notices
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q);

      const matchPriority =
        selectedPriority === "ALL" ||
        n.priority.toUpperCase() === selectedPriority.toUpperCase();

      const matchStatus =
        selectedStatus === "ALL" ||
        n.status.toUpperCase() === selectedStatus.toUpperCase();

      return matchSearch && matchPriority && matchStatus;
    });
  }, [notices, searchQuery, selectedPriority, selectedStatus]);

  // Handle Publish
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.message.trim()) {
      alert("Please provide both a notice title and content message.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hr/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noticeForm.title.trim(),
          message: noticeForm.message.trim(),
          priority: noticeForm.priority,
          targetType: noticeForm.targetType,
          targetId: noticeForm.targetType === "DEPARTMENT" ? noticeForm.targetId : null,
        }),
      });

      if (res.ok) {
        setIsPublishModalOpen(false);
        setNoticeForm(EMPTY_NOTICE_FORM);
        showToast("Company notice published and broadcasted to staff!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to publish notice: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to publish notice"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotice) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hr/notices/${activeNotice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noticeForm.title.trim(),
          message: noticeForm.message.trim(),
          priority: noticeForm.priority,
          targetType: noticeForm.targetType,
          targetId: noticeForm.targetType === "DEPARTMENT" ? noticeForm.targetId : null,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setActiveNotice(null);
        showToast("Notice updated successfully!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to update notice: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to update notice"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Notice
  const handleDeleteNotice = async () => {
    if (!activeNotice) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hr/notices/${activeNotice.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setActiveNotice(null);
        showToast("Notice deleted successfully!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to delete notice: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to delete notice"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active / Archive Status
  const handleToggleStatus = async (notice: Notice) => {
    const nextStatus = notice.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      const res = await fetch(`/api/hr/notices/${notice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`Notice ${nextStatus === "ACTIVE" ? "activated" : "archived"}`);
        await loadData();
      }
    } catch {
      showToast("Failed to toggle status");
    }
  };

  const openEditModal = (notice: Notice) => {
    setActiveNotice(notice);
    setNoticeForm({
      title: notice.title,
      message: notice.message,
      targetType: notice.targetType || "ALL",
      targetId: notice.targetId || "",
      priority: notice.priority || "NORMAL",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (notice: Notice) => {
    setActiveNotice(notice);
    setIsDeleteModalOpen(true);
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = (priority || "").toUpperCase();
    if (p === "URGENT") return styles.badgeUrgent;
    if (p === "IMPORTANT") return styles.badgeImportant;
    return styles.badgeNormal;
  };

  const getCardBorderClass = (priority: string) => {
    const p = (priority || "").toUpperCase();
    if (p === "URGENT") return styles.noticeUrgentCard;
    if (p === "IMPORTANT") return styles.noticeImportantCard;
    return styles.noticeNormalCard;
  };

  const getTargetName = (targetType: string, targetId: string | null) => {
    if (targetType === "DEPARTMENT" && targetId) {
      const dept = departments.find((d) => d.id === targetId);
      return dept ? `Department: ${dept.name}` : "Department";
    }
    return "All Staff Under HR";
  };

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "#0f172a",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 9999,
            fontSize: "13.5px",
            fontWeight: 500,
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: "20px" }}>
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.liveBadgeRow}>
              <div className={styles.livePulseDot} />
              <span className={styles.liveBadgeText}>Live Staff Broadcasts</span>
            </div>
            <h1 className={styles.pageTitle}>
              <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: "30px" }}>
                campaign
              </span>
              Company Notices &amp; Staff Broadcasts
            </h1>
            <p className={styles.pageSubtitle}>
              Broadcast circulars, general notices, and urgent bulletins to all staff with instant sync to the Staff Mobile App.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => {
                setNoticeForm(EMPTY_NOTICE_FORM);
                setIsPublishModalOpen(true);
              }}
              className={styles.primaryBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                send
              </span>
              Publish New Notice
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                campaign
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Notices</span>
              <span className={styles.metricValue}>{metrics.total}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                broadcast_on_personal
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Active Broadcasts</span>
              <span className={styles.metricValue}>{metrics.active}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                priority_high
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Urgent Notices</span>
              <span className={styles.metricValue}>{metrics.urgent}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(147, 51, 234, 0.12)", color: "#7c3aed" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                groups
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Staff Reached</span>
              <span className={styles.metricValue}>{metrics.staffCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchBox}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
            <input
              type="text"
              placeholder="Search notices by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Priorities</option>
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANT">Important</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Broadcasts</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notices List */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div className="material-symbols-outlined" style={{ fontSize: "36px", animation: "spin 1s linear infinite" }}>
            progress_activity
          </div>
          <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading company notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined">mark_email_read</span>
          </div>
          <h3 className={styles.emptyTitle}>No notices found</h3>
          <p className={styles.emptyDesc}>
            {searchQuery || selectedPriority !== "ALL" || selectedStatus !== "ALL"
              ? "No notices match your current search and filter criteria."
              : "No company notices have been published yet. Broadcast your first notice to all staff."}
          </p>
          <button
            onClick={() => {
              setNoticeForm(EMPTY_NOTICE_FORM);
              setIsPublishModalOpen(true);
            }}
            className={styles.primaryBtn}
            style={{ marginTop: "8px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              send
            </span>
            Publish First Notice
          </button>
        </div>
      ) : (
        <div className={styles.noticesList}>
          {filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className={`${styles.noticeCard} ${getCardBorderClass(notice.priority)}`}
            >
              <div className={styles.noticeHeaderRow}>
                <div className={styles.noticeBadges}>
                  <span className={`${styles.badge} ${getPriorityBadgeClass(notice.priority)}`}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "currentColor",
                      }}
                    />
                    {notice.priority}
                  </span>

                  <span className={`${styles.badge} ${styles.badgeTarget}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      {notice.targetType === "DEPARTMENT" ? "domain" : "public"}
                    </span>
                    {getTargetName(notice.targetType, notice.targetId)}
                  </span>

                  <span
                    className={`${styles.badge} ${
                      notice.status === "ACTIVE" ? styles.badgeActive : styles.badgeArchived
                    }`}
                  >
                    {notice.status}
                  </span>
                </div>

                <div className={styles.noticeActions}>
                  <button
                    onClick={() => handleToggleStatus(notice)}
                    className={styles.iconBtn}
                    title={notice.status === "ACTIVE" ? "Archive Notice" : "Restore Notice"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      {notice.status === "ACTIVE" ? "archive" : "unarchive"}
                    </span>
                  </button>
                  <button
                    onClick={() => openEditModal(notice)}
                    className={styles.iconBtn}
                    title="Edit Notice"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      edit
                    </span>
                  </button>
                  <button
                    onClick={() => openDeleteModal(notice)}
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Delete Notice"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      delete
                    </span>
                  </button>
                </div>
              </div>

              <h2 className={styles.noticeTitle}>{notice.title}</h2>

              <p className={styles.noticeMessage}>{notice.message}</p>

              <div className={styles.noticeFooter}>
                <div className={styles.noticeMeta}>
                  <div className={styles.metaItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--text-muted)" }}>
                      account_circle
                    </span>
                    <span>HR Department</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--text-muted)" }}>
                      calendar_today
                    </span>
                    <span>
                      {new Date(notice.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: "12px", color: "#10b981", display: "flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                    phonelink_ring
                  </span>
                  Synced with Staff App
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Publish New Notice */}
      {isPublishModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: "#10b981" }}>
                  campaign
                </span>
                Publish Company Notice
              </h2>
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className={styles.iconBtn}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePublishNotice}>
              <div className={styles.modalBody}>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "12.5px",
                    color: "#065f46",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#10b981", fontSize: "20px" }}>
                    notifications_active
                  </span>
                  <span>
                    This notice will be broadcasted to all staff members under this HR organization and will appear on their Staff App home screen and notice board.
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notice Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Office Closed for Eid Holidays &amp; Attendance Policy"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Audience</label>
                    <select
                      value={noticeForm.targetType}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetType: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="ALL">All Staff Under HR</option>
                      <option value="DEPARTMENT">Specific Department</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority / Urgency</label>
                    <select
                      value={noticeForm.priority}
                      onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="IMPORTANT">Important</option>
                      <option value="URGENT">Urgent (Red Alert)</option>
                    </select>
                  </div>
                </div>

                {noticeForm.targetType === "DEPARTMENT" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Department *</label>
                    <select
                      required
                      value={noticeForm.targetId}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetId: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="">Choose department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notice Message / Content *</label>
                  <textarea
                    required
                    placeholder="Write your company announcement, instructions, or official circular details..."
                    value={noticeForm.message}
                    onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className={styles.secondaryBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Publishing..." : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Notice */}
      {isEditModalOpen && activeNotice && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>
                  edit_note
                </span>
                Edit Notice
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={styles.iconBtn}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Target Audience</label>
                    <select
                      value={noticeForm.targetType}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetType: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="ALL">All Staff Under HR</option>
                      <option value="DEPARTMENT">Specific Department</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority / Urgency</label>
                    <select
                      value={noticeForm.priority}
                      onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="IMPORTANT">Important</option>
                      <option value="URGENT">Urgent (Red Alert)</option>
                    </select>
                  </div>
                </div>

                {noticeForm.targetType === "DEPARTMENT" && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Department</label>
                    <select
                      value={noticeForm.targetId}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetId: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="">Choose department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Notice Message *</label>
                  <textarea
                    required
                    value={noticeForm.message}
                    onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={styles.secondaryBtn}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && activeNotice && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: "440px" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
                <span className="material-symbols-outlined">warning</span>
                Delete Notice
              </h2>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={styles.iconBtn}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--text-main)" }}>
                Are you sure you want to delete the notice <strong>&quot;{activeNotice.title}&quot;</strong>?
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                This will permanently remove the broadcast from the staff mobile app notice board.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className={styles.secondaryBtn}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteNotice}
                className={styles.dangerBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
