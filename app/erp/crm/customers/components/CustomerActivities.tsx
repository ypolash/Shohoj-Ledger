"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomerActivitiesProps {
  customer: any;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  CALL: { label: "Phone Call", icon: "call", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  MEETING: { label: "Meeting", icon: "groups", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
  ONLINE_MEETING: { label: "Video Call", icon: "videocam", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" },
  WHATSAPP: { label: "WhatsApp", icon: "chat", color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
  VISIT: { label: "Site Visit", icon: "store", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  DEMO: { label: "Product Demo", icon: "desktop_windows", color: "#ec4899", bg: "rgba(236, 72, 153, 0.12)" },
  TASK: { label: "Task", icon: "task_alt", color: "#64748b", bg: "rgba(100, 116, 139, 0.12)" },
  PAYMENT_FOLLOWUP: { label: "Payment Follow-up", icon: "payments", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)" },
};

export function CustomerActivities({ customer }: CustomerActivitiesProps) {
  const [activities, setActivities] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [completeOutcome, setCompleteOutcome] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "CALL",
    title: "",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    priority: "MEDIUM",
    status: "UPCOMING",
    notes: "",
  });

  const fetchActivities = async () => {
    if (!customer?.id) return;
    try {
      const res = await fetch(`/api/crm/follow-ups?customerId=${customer.id}`);
      if (res.ok) {
        const json = await res.json();
        setActivities(json.data || []);
      } else {
        // Fallback to legacy activities endpoint
        const fallback = await fetch(`/api/crm/customers/${customer.id}/activities`);
        if (fallback.ok) {
          const data = await fallback.json();
          setActivities(data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (customer?.id) {
      fetchActivities();
    }
  }, [customer?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/crm/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          ...formData,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          type: "CALL",
          title: "",
          date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
          priority: "MEDIUM",
          status: "UPCOMING",
          notes: "",
        });
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCompleteActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/follow-ups/${selectedActivity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          outcome: completeOutcome,
        }),
      });
      if (res.ok) {
        setShowCompleteModal(false);
        setSelectedActivity(null);
        setCompleteOutcome("");
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>
            event_upcoming
          </span>
          Follow-Ups & Appointments ({activities.length})
        </h4>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: "6px 14px",
            background: "var(--primary)",
            color: "white",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            add
          </span>
          Schedule Follow-up
        </button>
      </div>

      {activities.map((act) => {
        const typeConf = TYPE_CONFIG[act.type] || TYPE_CONFIG.CALL;
        const isDone = act.status === "COMPLETED";
        const isOverdue = act.computedStatus === "OVERDUE" || act.status === "OVERDUE";
        const isToday = act.computedStatus === "TODAY";

        return (
          <div
            key={act.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "14px 16px",
              border: isOverdue ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border-light)",
              borderRadius: "12px",
              background: "var(--surface-main)",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: typeConf.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: typeConf.color,
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                {typeConf.icon}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                  {act.title || "Follow-up Appointment"}
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    color: isDone ? "#22c55e" : isOverdue ? "#ef4444" : "#3b82f6",
                    background: isDone
                      ? "rgba(34, 197, 94, 0.12)"
                      : isOverdue
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(59, 130, 246, 0.12)",
                  }}
                >
                  {isDone ? "COMPLETED" : isOverdue ? "OVERDUE" : isToday ? "TODAY" : "UPCOMING"}
                </span>
              </div>

              <div style={{ fontSize: "12px", color: isOverdue ? "#ef4444" : "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>
                📅 {new Date(act.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </div>

              {act.agenda && (
                <div style={{ fontSize: "12px", color: "var(--text-main)", marginTop: "6px", background: "var(--bg-main)", padding: "6px 10px", borderRadius: "6px" }}>
                  {act.agenda}
                </div>
              )}

              {act.outcome && (
                <div style={{ fontSize: "12px", color: "var(--success-text)", marginTop: "6px", fontWeight: 600 }}>
                  ✓ Outcome: {act.outcome}
                </div>
              )}

              {!isDone && (
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedActivity(act);
                      setShowCompleteModal(true);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--success)",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      check
                    </span>
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {activities.length === 0 && (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "13px",
            background: "var(--surface-main)",
            borderRadius: "10px",
            border: "1px dashed var(--border-light)",
          }}
        >
          No follow-ups or appointments scheduled for this customer yet.
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "var(--surface-main)",
                padding: "24px",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "460px",
                maxHeight: "90vh",
                overflowY: "auto",
                border: "1px solid var(--border-main)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                Schedule Follow-up / Appointment
              </h3>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Interaction Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  >
                    <option value="CALL">📞 Phone Call</option>
                    <option value="MEETING">🤝 Meeting</option>
                    <option value="ONLINE_MEETING">💻 Video Call</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="VISIT">🏢 Site Visit</option>
                    <option value="DEMO">🎯 Product Demo</option>
                    <option value="PAYMENT_FOLLOWUP">💰 Payment Follow-up</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Subject / Title *
                  </label>
                  <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Quotation Review & Contract Signing"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Scheduled Date & Time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Agenda & Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe discussion items..."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "8px 16px",
                      background: "var(--surface-hover)",
                      color: "var(--text-main)",
                      border: "1px solid var(--border-main)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "8px 18px",
                      background: "var(--primary)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {loading ? "Saving..." : "Schedule Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* COMPLETE OUTCOME MODAL */}
      {showCompleteModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              style={{
                background: "var(--surface-main)",
                padding: "24px",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "440px",
                border: "1px solid var(--border-main)",
                boxShadow: "var(--shadow-xl)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                Complete Follow-Up
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                {selectedActivity?.title}
              </p>

              <form onSubmit={handleCompleteActivity} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Outcome / Notes *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={completeOutcome}
                    onChange={(e) => setCompleteOutcome(e.target.value)}
                    placeholder="e.g. Discussed proposal, customer requested updated quote."
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCompleteModal(false)}
                    style={{
                      padding: "8px 16px",
                      background: "var(--surface-hover)",
                      color: "var(--text-main)",
                      border: "1px solid var(--border-main)",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "8px 18px",
                      background: "var(--success)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {loading ? "Saving..." : "Mark Complete"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
