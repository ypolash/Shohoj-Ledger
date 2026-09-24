"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

interface CustomerSummary {
  id: string;
  name: string;
  customerCode: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: string;
  tags: string[];
  addresses?: { addressLine1: string; city: string | null }[];
  contacts?: { name: string; phone: string | null; email: string | null }[];
}

interface FollowUpItem {
  id: string;
  companyId: string;
  customerId: string;
  customer: CustomerSummary;
  performedBy?: { id: string; name: string; email: string };
  type: string;
  title: string;
  date: string;
  status: string;
  computedStatus: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  agenda: string;
  outcome?: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  CALL: { label: "Phone Call", icon: "call", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
  MEETING: { label: "In-Person Meeting", icon: "groups", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
  ONLINE_MEETING: { label: "Video Call", icon: "videocam", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" },
  WHATSAPP: { label: "WhatsApp", icon: "chat", color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)" },
  VISIT: { label: "Site Visit", icon: "store", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  DEMO: { label: "Product Demo", icon: "desktop_windows", color: "#ec4899", bg: "rgba(236, 72, 153, 0.12)" },
  TASK: { label: "Follow-up Task", icon: "task_alt", color: "#64748b", bg: "rgba(100, 116, 139, 0.12)" },
  PAYMENT_FOLLOWUP: { label: "Payment Collection", icon: "payments", color: "#eab308", bg: "rgba(234, 179, 8, 0.12)" },
};

const PRIORITY_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: "Urgent", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  HIGH: { label: "High", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" },
  MEDIUM: { label: "Medium", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  LOW: { label: "Low", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)" },
};

export default function FollowUpsPage() {
  const router = useRouter();

  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    cancelled: 0,
    byType: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<"ALL" | "TODAY" | "UPCOMING" | "OVERDUE" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  // Customers for dropdown
  const [customerOptions, setCustomerOptions] = useState<{ id: string; name: string; phone: string | null }[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);

  // Create Form State
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    phone: "",
    email: "",
    companyName: "",
    address: "",
    type: "CALL",
    title: "",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow same time
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    agenda: "",
    location: "",
    meetingLink: "",
  });

  // Reschedule Form
  const [rescheduleData, setRescheduleData] = useState({
    date: new Date().toISOString().slice(0, 16),
    reason: "",
  });

  // Complete Form
  const [completeData, setCompleteData] = useState({
    outcome: "",
    notes: "",
    scheduleNext: false,
    nextDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    nextType: "CALL",
    nextTitle: "Next Follow-up Call",
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Follow-Ups
  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (activeTab !== "ALL") qParams.append("status", activeTab);
      if (typeFilter !== "ALL") qParams.append("type", typeFilter);
      if (priorityFilter !== "ALL") qParams.append("priority", priorityFilter);
      if (searchQuery) qParams.append("search", searchQuery);

      const res = await fetch(`/api/crm/follow-ups?${qParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setFollowUps(json.data || []);
        if (json.counts) setCounts(json.counts);
      }
    } catch (err) {
      console.error("Failed to fetch follow-ups:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeFilter, priorityFilter, searchQuery]);

  // Load customer options for create modal
  const fetchCustomerOptions = async () => {
    try {
      const res = await fetch("/api/crm/customers?take=100");
      if (res.ok) {
        const json = await res.json();
        const list = (json.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone || c.mobile,
        }));
        setCustomerOptions(list);
      }
    } catch (err) {
      console.error("Failed to fetch customer options:", err);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  useEffect(() => {
    fetchCustomerOptions();
  }, []);

  // Handle Form Change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Create Appointment / Follow-up
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        type: formData.type,
        title: formData.title || (isNewCustomer ? `Appointment: ${formData.customerName}` : "Follow-up Appointment"),
        date: formData.date,
        priority: formData.priority,
        agenda: formData.agenda,
        location: formData.location || undefined,
        meetingLink: formData.meetingLink || undefined,
      };

      if (isNewCustomer) {
        payload.customerName = formData.customerName;
        payload.phone = formData.phone;
        payload.email = formData.email || undefined;
        payload.companyName = formData.companyName || undefined;
        payload.address = formData.address || undefined;
      } else {
        payload.customerId = formData.customerId;
      }

      const res = await fetch("/api/crm/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setFormData({
          customerId: "",
          customerName: "",
          phone: "",
          email: "",
          companyName: "",
          address: "",
          type: "CALL",
          title: "",
          date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
          priority: "MEDIUM",
          agenda: "",
          location: "",
          meetingLink: "",
        });
        fetchFollowUps();
        fetchCustomerOptions();
      } else {
        const errJson = await res.json();
        alert(`Failed to save: ${errJson.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while booking the follow-up.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleData.date,
          status: "UPCOMING",
          agenda: selectedFollowUp.agenda
            ? `${selectedFollowUp.agenda}\n[Rescheduled: ${rescheduleData.reason || "Client requested new time"}]`
            : `[Rescheduled: ${rescheduleData.reason || "Client requested new time"}]`,
        }),
      });

      if (res.ok) {
        setShowRescheduleModal(false);
        setSelectedFollowUp(null);
        fetchFollowUps();
      } else {
        const errJson = await res.json();
        alert(`Failed to reschedule: ${errJson.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error rescheduling appointment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Completed with Outcome
  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/crm/follow-ups/${selectedFollowUp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          outcome: completeData.outcome || "Follow-up completed successfully.",
          notes: completeData.notes || undefined,
        }),
      });

      if (res.ok) {
        // If user also wanted to schedule next follow-up
        if (completeData.scheduleNext && selectedFollowUp.customerId) {
          await fetch("/api/crm/follow-ups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: selectedFollowUp.customerId,
              type: completeData.nextType,
              title: completeData.nextTitle,
              date: completeData.nextDate,
              priority: "MEDIUM",
              agenda: `Follow-up after outcome: ${completeData.outcome}`,
            }),
          });
        }

        setShowCompleteModal(false);
        setSelectedFollowUp(null);
        setCompleteData({
          outcome: "",
          notes: "",
          scheduleNext: false,
          nextDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
          nextType: "CALL",
          nextTitle: "Next Follow-up Call",
        });
        fetchFollowUps();
      } else {
        const errJson = await res.json();
        alert(`Failed: ${errJson.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error recording completion outcome.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel
  const handleCancelAppointment = async (item: FollowUpItem) => {
    if (!confirm(`Are you sure you want to cancel the appointment with ${item.customer?.name}?`)) return;
    try {
      const res = await fetch(`/api/crm/follow-ups/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Follow-up
  const handleDeleteFollowUp = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this follow-up record?")) return;
    try {
      const res = await fetch(`/api/crm/follow-ups/${id}`, { method: "DELETE" });
      if (res.ok) fetchFollowUps();
    } catch (err) {
      console.error(err);
    }
  };

  // Format Date Friendly
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now.getTime() + 86400000);
    const isTomorrow =
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;

    return `${d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at ${timeStr}`;
  };

  return (
    <PageContainer>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)" }}>
              event_upcoming
            </span>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
              Follow-Ups & Appointments
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
            Manage scheduled meetings, client calls, and prospective customers who appointed you for later.
          </p>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => {
              setIsNewCustomer(true);
              setShowCreateModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-700, #1d4ed8) 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--primary-glow)",
              transition: "all 0.2s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              add_circle
            </span>
            <span>+ Book Appointment / Follow-up</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* Today */}
        <div
          onClick={() => setActiveTab("TODAY")}
          style={{
            background: activeTab === "TODAY" ? "var(--primary-glow)" : "var(--surface-main)",
            border: activeTab === "TODAY" ? "2px solid var(--primary)" : "1px solid var(--border-main)",
            borderRadius: "16px",
            padding: "20px",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Today's Appts
            </span>
            <span className="material-symbols-outlined" style={{ color: "#3b82f6", fontSize: "22px" }}>
              today
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#3b82f6" }}>
            {counts.today}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Scheduled for today
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveTab("UPCOMING")}
          style={{
            background: activeTab === "UPCOMING" ? "rgba(139, 92, 246, 0.1)" : "var(--surface-main)",
            border: activeTab === "UPCOMING" ? "2px solid #8b5cf6" : "1px solid var(--border-main)",
            borderRadius: "16px",
            padding: "20px",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Upcoming Later
            </span>
            <span className="material-symbols-outlined" style={{ color: "#8b5cf6", fontSize: "22px" }}>
              upcoming
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#8b5cf6" }}>
            {counts.upcoming}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Appointed future dates
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveTab("OVERDUE")}
          style={{
            background: activeTab === "OVERDUE" ? "rgba(239, 68, 68, 0.1)" : "var(--surface-main)",
            border: activeTab === "OVERDUE" ? "2px solid #ef4444" : "1px solid var(--border-main)",
            borderRadius: "16px",
            padding: "20px",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Pending / Overdue
            </span>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "22px" }}>
              notification_important
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ef4444" }}>
            {counts.overdue}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Requires immediate contact
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveTab("COMPLETED")}
          style={{
            background: activeTab === "COMPLETED" ? "rgba(34, 197, 94, 0.1)" : "var(--surface-main)",
            border: activeTab === "COMPLETED" ? "2px solid #22c55e" : "1px solid var(--border-main)",
            borderRadius: "16px",
            padding: "20px",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              Completed
            </span>
            <span className="material-symbols-outlined" style={{ color: "#22c55e", fontSize: "22px" }}>
              check_circle
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#22c55e" }}>
            {counts.completed}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Followed up & logged
          </div>
        </div>
      </div>

      {/* Tabs, Search & Filters Bar */}
      <div
        style={{
          background: "var(--surface-main)",
          border: "1px solid var(--border-main)",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Status Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { id: "ALL", label: "All Records", count: counts.total },
            { id: "TODAY", label: "Today's Schedule", count: counts.today },
            { id: "UPCOMING", label: "Upcoming Later", count: counts.upcoming },
            { id: "OVERDUE", label: "Overdue", count: counts.overdue },
            { id: "COMPLETED", label: "Completed", count: counts.completed },
            { id: "CANCELLED", label: "Cancelled", count: counts.cancelled },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  border: "none",
                  background: active ? "var(--primary)" : "var(--surface-hover)",
                  color: active ? "#ffffff" : "var(--text-muted)",
                  fontWeight: active ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: active ? "rgba(255, 255, 255, 0.25)" : "var(--border-main)",
                    color: active ? "#ffffff" : "var(--text-main)",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Type Filter & View Mode Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "18px" }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, phone, subject, or notes..."
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "10px",
                border: "1px solid var(--border-main)",
                background: "var(--bg-main)",
                color: "var(--text-main)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-main)",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Interaction Types</option>
            <option value="CALL">📞 Phone Call</option>
            <option value="MEETING">🤝 In-Person Meeting</option>
            <option value="ONLINE_MEETING">💻 Video Call (Zoom/Meet)</option>
            <option value="WHATSAPP">💬 WhatsApp</option>
            <option value="VISIT">🏢 Site Visit</option>
            <option value="DEMO">🎯 Product Demo</option>
            <option value="PAYMENT_FOLLOWUP">💰 Payment Collection</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-main)",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">🔴 Urgent</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🔵 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>

          {/* View Toggle */}
          <div style={{ display: "flex", background: "var(--surface-hover)", borderRadius: "8px", padding: "3px", border: "1px solid var(--border-main)" }}>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "card" ? "var(--surface-main)" : "transparent",
                color: viewMode === "card" ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                grid_view
              </span>
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "none",
                background: viewMode === "table" ? "var(--surface-main)" : "transparent",
                color: viewMode === "table" ? "var(--primary)" : "var(--text-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                table_rows
              </span>
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content List / Table */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "36px", animation: "spin 1s linear infinite" }}>
            sync
          </span>
          <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading appointments and follow-ups...</p>
        </div>
      ) : followUps.length === 0 ? (
        <div
          style={{
            background: "var(--surface-main)",
            border: "1px dashed var(--border-main)",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(59, 130, 246, 0.1)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>
              event_available
            </span>
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700, color: "var(--text-main)" }}>
            No Follow-ups or Appointments Found
          </h3>
          <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-muted)", maxWidth: "400px", marginInline: "auto" }}>
            {searchQuery || activeTab !== "ALL" || typeFilter !== "ALL"
              ? "No items match your active search filters. Try resetting the filters."
              : "Book a new follow-up or register customers who appointed your company for later."}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsNewCustomer(true);
              setShowCreateModal(true);
            }}
            style={{
              padding: "9px 18px",
              borderRadius: "10px",
              background: "var(--primary)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            + Book First Appointment
          </button>
        </div>
      ) : viewMode === "card" ? (
        /* CARD / TIMELINE VIEW */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "18px",
          }}
        >
          {followUps.map((item) => {
            const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.CALL;
            const priorityConf = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.MEDIUM;
            const isCompleted = item.status === "COMPLETED";
            const isOverdue = item.computedStatus === "OVERDUE";
            const isToday = item.computedStatus === "TODAY";
            const phone = item.customer?.phone || item.customer?.mobile;
            const cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";

            return (
              <div
                key={item.id}
                style={{
                  background: "var(--surface-main)",
                  border: isOverdue
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : isToday
                    ? "1px solid rgba(59, 130, 246, 0.4)"
                    : "1px solid var(--border-main)",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "16px",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Top Section */}
                <div>
                  {/* Badge Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: typeConf.color,
                        background: typeConf.bg,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                        {typeConf.icon}
                      </span>
                      <span>{typeConf.label}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "12px",
                          color: priorityConf.color,
                          background: priorityConf.bg,
                          textTransform: "uppercase",
                        }}
                      >
                        {priorityConf.label}
                      </span>

                      {isOverdue && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            color: "#ef4444",
                            background: "rgba(239, 68, 68, 0.15)",
                          }}
                        >
                          OVERDUE
                        </span>
                      )}

                      {isCompleted && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            color: "#22c55e",
                            background: "rgba(34, 197, 94, 0.15)",
                          }}
                        >
                          COMPLETED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Customer Name */}
                  <h3
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      lineHeight: "1.3",
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Customer Link & Info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <Link
                      href={`/erp/crm/customers/${item.customerId}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--primary)",
                        textDecoration: "none",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        person
                      </span>
                      {item.customer?.name || "Customer"}
                    </Link>

                    {item.customer?.customerCode && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "monospace",
                          color: "var(--text-muted)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: "var(--bg-main)",
                          border: "1px solid var(--border-main)",
                        }}
                      >
                        {item.customer.customerCode}
                      </span>
                    )}
                  </div>

                  {/* Date & Time with visual highlight */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isOverdue ? "#ef4444" : isToday ? "#3b82f6" : "var(--text-main)",
                      marginBottom: "10px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                      schedule
                    </span>
                    <span>{formatDateDisplay(item.date)}</span>
                  </div>

                  {/* Agenda / Notes */}
                  {item.agenda && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        background: "var(--bg-main)",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                        marginBottom: "10px",
                        lineHeight: "1.4",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong>Agenda:</strong> {item.agenda}
                    </div>
                  )}

                  {/* Outcome if Completed */}
                  {item.outcome && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--success-text)",
                        background: "rgba(34, 197, 94, 0.08)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                        marginBottom: "10px",
                      }}
                    >
                      <strong>Outcome:</strong> {item.outcome}
                    </div>
                  )}
                </div>

                {/* Bottom Section: Direct Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                  {/* Fast Contact Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "var(--surface-hover)",
                          border: "1px solid var(--border-main)",
                          color: "var(--text-main)",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#22c55e" }}>
                          call
                        </span>
                        Call
                      </a>
                    )}

                    {phone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "rgba(37, 211, 102, 0.1)",
                          border: "1px solid rgba(37, 211, 102, 0.3)",
                          color: "#16a34a",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                          chat
                        </span>
                        WhatsApp
                      </a>
                    )}

                    {item.customer?.email && (
                      <a
                        href={`mailto:${item.customer.email}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "var(--surface-hover)",
                          border: "1px solid var(--border-main)",
                          color: "var(--text-main)",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#3b82f6" }}>
                          mail
                        </span>
                        Email
                      </a>
                    )}

                    {item.meetingLink && (
                      <a
                        href={item.meetingLink.startsWith("http") ? item.meetingLink : `https://${item.meetingLink}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "rgba(6, 182, 212, 0.1)",
                          border: "1px solid rgba(6, 182, 212, 0.3)",
                          color: "#0891b2",
                          fontSize: "12px",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                          videocam
                        </span>
                        Join Meet
                      </a>
                    )}
                  </div>

                  {/* Manage Buttons */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFollowUp(item);
                            setCompleteData((prev) => ({ ...prev, outcome: "" }));
                            setShowCompleteModal(true);
                          }}
                          style={{
                            flex: 1,
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "var(--success)",
                            color: "#ffffff",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            check
                          </span>
                          Complete
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFollowUp(item);
                            setRescheduleData({
                              date: new Date(item.date).toISOString().slice(0, 16),
                              reason: "",
                            });
                            setShowRescheduleModal(true);
                          }}
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-main)",
                            background: "var(--surface-hover)",
                            color: "var(--text-main)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            edit_calendar
                          </span>
                          Reschedule
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(item)}
                          title="Cancel appointment"
                          style={{
                            padding: "7px 8px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-main)",
                            background: "transparent",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            close
                          </span>
                        </button>
                      </>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <button
                          type="button"
                          onClick={() => router.push(`/erp/crm/quotations/new?customerId=${item.customerId}`)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-main)",
                            background: "var(--surface-hover)",
                            color: "var(--text-main)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--primary)" }}>
                            request_quote
                          </span>
                          Create Quote
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFollowUp(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div
          style={{
            background: "var(--surface-main)",
            border: "1px solid var(--border-main)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "var(--bg-main)", borderBottom: "1px solid var(--border-main)", color: "var(--text-muted)", fontWeight: 700, fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 16px" }}>Customer / Contact</th>
                  <th style={{ padding: "14px 16px" }}>Subject / Agenda</th>
                  <th style={{ padding: "14px 16px" }}>Type</th>
                  <th style={{ padding: "14px 16px" }}>Scheduled Date</th>
                  <th style={{ padding: "14px 16px" }}>Priority</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((item) => {
                  const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.CALL;
                  const priorityConf = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.MEDIUM;
                  const isCompleted = item.status === "COMPLETED";
                  const isOverdue = item.computedStatus === "OVERDUE";
                  const isToday = item.computedStatus === "TODAY";
                  const phone = item.customer?.phone || item.customer?.mobile;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-light)",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                          <Link href={`/erp/crm/customers/${item.customerId}`} style={{ color: "var(--primary)", textDecoration: "none" }}>
                            {item.customer?.name}
                          </Link>
                        </div>
                        {phone && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{phone}</div>}
                      </td>

                      <td style={{ padding: "14px 16px", maxWidth: "240px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{item.title}</div>
                        {item.agenda && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.agenda}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: typeConf.color,
                            background: typeConf.bg,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                            {typeConf.icon}
                          </span>
                          {typeConf.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: isOverdue ? "#ef4444" : isToday ? "#3b82f6" : "var(--text-main)" }}>
                          {formatDateDisplay(item.date)}
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "10px",
                            color: priorityConf.color,
                            background: priorityConf.bg,
                          }}
                        >
                          {priorityConf.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "12px",
                            color: isCompleted ? "#22c55e" : isOverdue ? "#ef4444" : "#3b82f6",
                            background: isCompleted
                              ? "rgba(34, 197, 94, 0.12)"
                              : isOverdue
                              ? "rgba(239, 68, 68, 0.12)"
                              : "rgba(59, 130, 246, 0.12)",
                          }}
                        >
                          {isCompleted ? "COMPLETED" : isOverdue ? "OVERDUE" : "UPCOMING"}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                          {!isCompleted && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFollowUp(item);
                                  setShowCompleteModal(true);
                                }}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "none",
                                  background: "var(--success)",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Complete
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFollowUp(item);
                                  setRescheduleData({
                                    date: new Date(item.date).toISOString().slice(0, 16),
                                    reason: "",
                                  });
                                  setShowRescheduleModal(true);
                                }}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--border-main)",
                                  background: "var(--surface-hover)",
                                  color: "var(--text-main)",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                }}
                              >
                                Reschedule
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteFollowUp(item.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. BOOK APPOINTMENT / FOLLOW-UP MODAL */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface-main)",
              border: "1px solid var(--border-main)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.3))",
              padding: "24px",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--primary)" }}>
                  event_available
                </span>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "var(--text-main)" }}>
                  Book Follow-Up / Appointment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                  close
                </span>
              </button>
            </div>

            {/* Toggle: New Customer Appointed Later vs Existing Customer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                padding: "4px",
                background: "var(--bg-main)",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid var(--border-main)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                style={{
                  padding: "9px",
                  borderRadius: "9px",
                  border: "none",
                  background: isNewCustomer ? "var(--primary)" : "transparent",
                  color: isNewCustomer ? "#ffffff" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                  person_add
                </span>
                New Customer (Appointed Later)
              </button>

              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                style={{
                  padding: "9px",
                  borderRadius: "9px",
                  border: "none",
                  background: !isNewCustomer ? "var(--primary)" : "transparent",
                  color: !isNewCustomer ? "#ffffff" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                  group
                </span>
                Existing Customer
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Customer Section */}
              {isNewCustomer ? (
                <div
                  style={{
                    background: "rgba(59, 130, 246, 0.05)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                      info
                    </span>
                    This customer will be automatically saved in the Customer Registry.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Tanvir Ahmed"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="e.g. +880 1712 345678"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tanvir@example.com"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="e.g. Apex Tech"
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "13px",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Select Customer *
                  </label>
                  <select
                    required
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="">-- Choose a registered customer --</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Appointment Title */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Subject / Agenda Title *
                </label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Product Demo & Price Negotiation"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Type & Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Follow-up Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="CALL">📞 Phone Call</option>
                    <option value="MEETING">🤝 In-Person Meeting</option>
                    <option value="ONLINE_MEETING">💻 Video Call (Zoom/Meet)</option>
                    <option value="WHATSAPP">💬 WhatsApp Chat / Call</option>
                    <option value="VISIT">🏢 Site / Office Visit</option>
                    <option value="DEMO">🎯 Product Demo</option>
                    <option value="PAYMENT_FOLLOWUP">💰 Payment Collection</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-main)",
                      background: "var(--bg-main)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">🔴 Urgent</option>
                  </select>
                </div>
              </div>

              {/* Appointment Date & Time */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Appointment Scheduled For (Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Meeting Link / Location (Optional) */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Location or Video Meeting URL (Optional)
                </label>
                <input
                  type="text"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleInputChange}
                  placeholder="e.g. meet.google.com/xyz or Office Conference Room"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Detailed Agenda / Notes */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Agenda & Notes
                </label>
                <textarea
                  name="agenda"
                  rows={3}
                  value={formData.agenda}
                  onChange={handleInputChange}
                  placeholder="Discuss project requirements, show demo, finalize timeline..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    background: "var(--surface-hover)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "9px 22px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  {actionLoading ? "Booking..." : "Confirm & Save Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RESCHEDULE MODAL */}
      {/* ========================================================= */}
      {showRescheduleModal && selectedFollowUp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface-main)",
              border: "1px solid var(--border-main)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
              Reschedule Appointment
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
              With <strong>{selectedFollowUp.customer?.name}</strong>
            </p>

            <form onSubmit={handleRescheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  New Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Reason / Memo (Optional)
                </label>
                <input
                  type="text"
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Client requested Monday afternoon instead"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    background: "var(--surface-hover)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--primary)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {actionLoading ? "Updating..." : "Save New Time"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. COMPLETE & LOG OUTCOME MODAL */}
      {/* ========================================================= */}
      {showCompleteModal && selectedFollowUp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface-main)",
              border: "1px solid var(--border-main)",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "520px",
              padding: "24px",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: "var(--success)" }}>
                task_alt
              </span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text-main)" }}>
                Complete Follow-Up & Log Outcome
              </h3>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
              Record meeting results for <strong>{selectedFollowUp.customer?.name}</strong>
            </p>

            <form onSubmit={handleCompleteSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Follow-Up Outcome / Key Result *
                </label>
                <input
                  type="text"
                  required
                  value={completeData.outcome}
                  onChange={(e) => setCompleteData((prev) => ({ ...prev, outcome: e.target.value }))}
                  placeholder="e.g. Client requested Quotation for 5 licenses"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Detailed Meeting Notes
                </label>
                <textarea
                  rows={3}
                  value={completeData.notes}
                  onChange={(e) => setCompleteData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Client loved the presentation, discussed payment terms..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-main)",
                    background: "var(--bg-main)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Checkbox: Schedule next follow up */}
              <div
                style={{
                  background: "var(--bg-main)",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>
                  <input
                    type="checkbox"
                    checked={completeData.scheduleNext}
                    onChange={(e) => setCompleteData((prev) => ({ ...prev, scheduleNext: e.target.checked }))}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  Schedule next follow-up with this customer
                </label>

                {completeData.scheduleNext && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>
                        Next Follow-up Date
                      </label>
                      <input
                        type="datetime-local"
                        value={completeData.nextDate}
                        onChange={(e) => setCompleteData((prev) => ({ ...prev, nextDate: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "12px",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>
                        Next Follow-up Type
                      </label>
                      <select
                        value={completeData.nextType}
                        onChange={(e) => setCompleteData((prev) => ({ ...prev, nextType: e.target.value }))}
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-main)",
                          background: "var(--surface-main)",
                          color: "var(--text-main)",
                          fontSize: "12px",
                        }}
                      >
                        <option value="CALL">📞 Phone Call</option>
                        <option value="MEETING">🤝 Meeting</option>
                        <option value="WHATSAPP">💬 WhatsApp</option>
                        <option value="ONLINE_MEETING">💻 Video Call</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-main)",
                    background: "var(--surface-hover)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--success)",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {actionLoading ? "Saving..." : "Record & Close"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
