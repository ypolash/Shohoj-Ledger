"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./task-rewards.module.css";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  designation?: string;
}

interface TaskReward {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  points: number;
  monetaryValue?: number;
  status: string;
  deadline?: string;
  assignedToEmployeeId?: string;
  assignedEmployee?: Employee;
  departmentId?: string;
  maxClaims: number;
  checklist?: any;
  createdAt: string;
  submissions?: TaskSubmission[];
  _count?: { submissions: number };
}

interface TaskSubmission {
  id: string;
  taskRewardId: string;
  employeeId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submissionNotes?: string;
  proofUrl?: string;
  pointsAwarded: number;
  rewardAmount: number;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  taskReward?: TaskReward;
  employee?: Employee;
}

interface EmployeeWallet {
  employee: Employee;
  totalPointsEarned: number;
  totalAmountEarned: number;
  totalPointsRedeemed: number;
  totalAmountRedeemed: number;
  balancePoints: number;
  balanceCash: number;
}

interface PayoutRecord {
  id: string;
  employeeId: string;
  pointsRedeemed: number;
  conversionRate: number;
  amount: number;
  payoutMethod: string;
  reference?: string;
  notes?: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  employee?: Employee;
}

export default function TaskRewardsPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "reviews" | "wallets" | "payouts" | "settings">("tasks");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskReward[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [wallets, setWallets] = useState<EmployeeWallet[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<{ pointToCashRate: number; minRedeemPoints: number; autoApprove: boolean }>({
    pointToCashRate: 10,
    minRedeemPoints: 1,
    autoApprove: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskReward | null>(null);
  const [reviewModalData, setReviewModalData] = useState<TaskSubmission | null>(null);
  const [payoutModalData, setPayoutModalData] = useState<{ employeeId: string; balancePoints: number; name: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "SPECIAL_TASK",
    priority: "MEDIUM",
    points: 10,
    monetaryValue: 100,
    deadline: "",
    assignedToEmployeeId: "",
    maxClaims: 1,
  });

  const [payoutFormData, setPayoutFormData] = useState({
    pointsToRedeem: 10,
    payoutMethod: "CASH",
    reference: "",
    notes: "",
  });

  const [reviewFormData, setReviewFormData] = useState({
    reviewNotes: "",
    customPoints: 0,
    customAmount: 0,
  });

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, statsRes, payoutsRes, settingsRes] = await Promise.all([
        fetch("/api/hr/task-rewards"),
        fetch("/api/hr/task-rewards/stats"),
        fetch("/api/hr/task-rewards/payouts"),
        fetch("/api/hr/task-rewards/settings"),
      ]);

      const [tasksData, statsData, payoutsData, settingsData] = await Promise.all([
        tasksRes.json(),
        statsRes.json(),
        payoutsRes.json(),
        settingsRes.json(),
      ]);

      if (tasksData.success) {
        setTasks(tasksData.data || []);
        // Extract submissions
        const allSubs: TaskSubmission[] = [];
        tasksData.data?.forEach((t: TaskReward) => {
          if (t.submissions) {
            t.submissions.forEach((s) => allSubs.push({ ...s, taskReward: t }));
          }
        });
        setSubmissions(allSubs);
      }

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (payoutsData.success) {
        setWallets(payoutsData.data?.wallets || []);
        setAllEmployees(payoutsData.data?.allEmployees || []);
        setPayouts(payoutsData.data?.payouts || []);
      }

      if (settingsData.success) {
        setSettings({
          pointToCashRate: Number(settingsData.data?.pointToCashRate) || 10,
          minRedeemPoints: Number(settingsData.data?.minRedeemPoints) || 1,
          autoApprove: Boolean(settingsData.data?.autoApprove),
        });
      }
    } catch (err) {
      console.error("Failed to load task rewards data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || task.category === categoryFilter;
      const matchPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchStatus = statusFilter === "ALL" || task.status === statusFilter;
      return matchSearch && matchCategory && matchPriority && matchStatus;
    });
  }, [tasks, searchQuery, categoryFilter, priorityFilter, statusFilter]);

  // Pending submissions
  const pendingSubmissions = useMemo(() => {
    return submissions.filter((s) => s.status === "PENDING");
  }, [submissions]);

  // Handle Save Task (Create or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTask ? `/api/hr/task-rewards/${editingTask.id}` : `/api/hr/task-rewards`;
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to save task");
        return;
      }

      setIsCreateModalOpen(false);
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        category: "SPECIAL_TASK",
        priority: "MEDIUM",
        points: 10,
        monetaryValue: 100,
        deadline: "",
        assignedToEmployeeId: "",
        maxClaims: 1,
      });
      fetchData();
    } catch (err: any) {
      alert("Error saving task: " + err.message);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this special task reward?")) return;
    try {
      const res = await fetch(`/api/hr/task-rewards/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "Failed to delete task");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: TaskReward) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority,
      points: task.points,
      monetaryValue: task.monetaryValue || task.points * settings.pointToCashRate,
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      assignedToEmployeeId: task.assignedToEmployeeId || "",
      maxClaims: task.maxClaims,
    });
    setIsCreateModalOpen(true);
  };

  // Handle Review Submission (Approve / Reject)
  const handleReviewAction = async (action: "APPROVE" | "REJECT") => {
    if (!reviewModalData) return;
    try {
      const res = await fetch(`/api/hr/task-rewards/submissions/${reviewModalData.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNotes: reviewFormData.reviewNotes,
          customPoints: reviewFormData.customPoints,
          customAmount: reviewFormData.customAmount,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setReviewModalData(null);
        fetchData();
      } else {
        alert(json.error || "Failed to process review");
      }
    } catch (err: any) {
      alert("Review error: " + err.message);
    }
  };

  // Handle Disburse Payout
  const handleDisbursePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutModalData) return;
    try {
      const res = await fetch("/api/hr/task-rewards/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: payoutModalData.employeeId,
          pointsToRedeem: payoutFormData.pointsToRedeem,
          payoutMethod: payoutFormData.payoutMethod,
          reference: payoutFormData.reference,
          notes: payoutFormData.notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setPayoutModalData(null);
        fetchData();
      } else {
        alert(json.error || "Failed to disburse payout");
      }
    } catch (err: any) {
      alert("Payout error: " + err.message);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/task-rewards/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (json.success) {
        alert("Settings saved successfully!");
        fetchData();
      } else {
        alert(json.error || "Failed to update settings");
      }
    } catch (err: any) {
      alert("Settings error: " + err.message);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "PROJECT_BOUNTY":
        return { bg: "rgba(147, 51, 234, 0.12)", color: "#9333ea" };
      case "OVERTIME_INCENTIVE":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#dc2626" };
      case "SALES_TARGET":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669" };
      case "ATTENDANCE_STREAK":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#2563eb" };
      case "INNOVATION":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706" };
      default:
        return { bg: "rgba(100, 116, 139, 0.12)", color: "#475569" };
    }
  };

  return (
    <div className={styles.container}>
      {/* Executive Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.liveBadgeRow}>
              <span className={styles.livePulseDot} />
              <span className={styles.liveBadgeText}>HR Performance & Extra Income Hub</span>
            </div>
            <h1 className={styles.pageTitle}>
              <span className={`material-symbols-outlined ${styles.titleIcon}`}>military_tech</span>
              Task Rewards & Incentives
            </h1>
            <p className={styles.pageSubtitle}>
              Create special bounties and extra tasks for employees. Employees earn reward points for completed tasks,
              which convert directly into cash bonuses disbursed immediately (Cash/MFS) or added to payroll.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => {
                setEditingTask(null);
                setFormData({
                  title: "",
                  description: "",
                  category: "SPECIAL_TASK",
                  priority: "MEDIUM",
                  points: 10,
                  monetaryValue: 10 * settings.pointToCashRate,
                  deadline: "",
                  assignedToEmployeeId: "",
                  maxClaims: 1,
                });
                setIsCreateModalOpen(true);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add_task</span>
              Create Special Task
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => setActiveTab("settings")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>tune</span>
              Points Rate (1 pt = ৳{settings.pointToCashRate})
            </button>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiAmber}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>military_tech</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Active Special Tasks</span>
              <span className={styles.kpiValue}>{stats?.activeTasksCount || tasks.filter((t) => t.status === "OPEN").length}</span>
              <span className={styles.kpiSub}>Open bounties for staff</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiBlue}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>pending_actions</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Pending Reviews</span>
              <span className={styles.kpiValue}>{stats?.pendingSubmissionsCount || pendingSubmissions.length}</span>
              <span className={styles.kpiSub}>Claims awaiting HR approval</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiPurple}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>stars</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Total Points Distributed</span>
              <span className={styles.kpiValue}>{stats?.totalPointsEarned || 0} pts</span>
              <span className={styles.kpiSub}>Outstanding: {stats?.totalPointsOutstanding || 0} pts</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiGreen}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>payments</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Extra Income Disbursed</span>
              <span className={styles.kpiValue}>৳ {(stats?.totalDisbursedCash || 0).toLocaleString()}</span>
              <span className={styles.kpiSub}>Cash & Payroll bonuses paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "tasks" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>assignment</span>
          Special Tasks (Bounties)
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "reviews" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>rate_review</span>
          Pending Reviews
          {pendingSubmissions.length > 0 && (
            <span className={styles.tabBadge}>{pendingSubmissions.length}</span>
          )}
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "wallets" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("wallets")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>account_balance_wallet</span>
          Staff Points & Payouts
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "payouts" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("payouts")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>
          Disbursed History
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "settings" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>settings</span>
          Rules & Conversion
        </button>
      </div>

      {/* =========================================================================
          TAB 1: SPECIAL TASKS (BOUNTIES)
          ========================================================================= */}
      {activeTab === "tasks" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search special tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <select
                className={styles.selectInput}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="SPECIAL_TASK">Special Task</option>
                <option value="PROJECT_BOUNTY">Project Bounty</option>
                <option value="OVERTIME_INCENTIVE">Overtime Incentive</option>
                <option value="SALES_TARGET">Sales Target</option>
                <option value="ATTENDANCE_STREAK">Attendance Streak</option>
                <option value="INNOVATION">Innovation</option>
                <option value="OTHER">Other</option>
              </select>

              <select
                className={styles.selectInput}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                className={styles.selectInput}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Tasks Grid */}
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Loading task rewards...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div
              style={{
                background: "var(--surface-card)",
                padding: "50px 20px",
                borderRadius: "18px",
                textAlign: "center",
                border: "1px dashed var(--border-main)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", marginBottom: "12px" }}>
                military_tech
              </span>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0" }}>No Special Tasks Found</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                Create bounties and extra work incentives for your employees.
              </p>
              <button
                className={styles.btnPrimary}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Create First Special Task
              </button>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {filteredTasks.map((task) => {
                const catStyle = getCategoryColor(task.category);
                const cashValue = task.monetaryValue || task.points * settings.pointToCashRate;
                const approvedCount = task.submissions?.filter((s) => s.status === "APPROVED").length || 0;

                return (
                  <div key={task.id} className={styles.taskCard}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div className={styles.taskCardHeader}>
                        <span
                          className={styles.categoryTag}
                          style={{ background: catStyle.bg, color: catStyle.color }}
                        >
                          {task.category.replace("_", " ")}
                        </span>
                        <div className={styles.pointsBadge}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>stars</span>
                          <span>+{task.points} pts</span>
                        </div>
                      </div>

                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      {task.description && <p className={styles.taskDesc}>{task.description}</p>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className={styles.taskMetaRow}>
                        <span className={styles.rewardCashText}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                          ৳ {cashValue.toLocaleString()} Extra Income
                        </span>
                        <span>
                          {approvedCount} / {task.maxClaims} Claims
                        </span>
                      </div>

                      <div className={styles.taskMetaRow}>
                        <span>
                          {task.assignedEmployee
                            ? `👤 ${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}`
                            : "🌐 Open for All Staff"}
                        </span>
                        {task.deadline && (
                          <span style={{ color: new Date(task.deadline) < new Date() ? "#dc2626" : "inherit" }}>
                            ⏱️ {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className={styles.taskFooter}>
                        <span
                          className={
                            task.status === "OPEN"
                              ? styles.badgeApproved
                              : task.status === "COMPLETED"
                              ? styles.badgePending
                              : styles.badgeRejected
                          }
                        >
                          {task.status}
                        </span>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: "6px 10px", fontSize: "12px" }}
                            onClick={() => openEditModal(task)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                            Edit
                          </button>
                          <button
                            className={styles.btnSecondary}
                            style={{ padding: "6px 8px", fontSize: "12px", color: "#dc2626" }}
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: PENDING REVIEWS
          ========================================================================= */}
      {activeTab === "reviews" && (
        <div className={styles.tableCard}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Special Task</th>
                <th>Submitted Date</th>
                <th>Proof / Notes</th>
                <th>Reward Value</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No task submissions received yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {sub.employee?.firstName} {sub.employee?.lastName}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        ID: {sub.employee?.employeeId} • {sub.employee?.designation || "Staff"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{sub.taskReward?.title}</div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {sub.taskReward?.category}
                      </div>
                    </td>
                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                    <td>
                      {sub.submissionNotes || (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No notes provided</span>
                      )}
                      {sub.proofUrl && (
                        <div style={{ marginTop: "4px" }}>
                          <a
                            href={sub.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#2563eb", fontSize: "12px", textDecoration: "underline" }}
                          >
                            View Proof Attachment 🔗
                          </a>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "#d97706" }}>
                        +{sub.pointsAwarded || sub.taskReward?.points} pts
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#10b981", fontWeight: 600 }}>
                        ৳ {sub.rewardAmount || (sub.taskReward?.points || 0) * settings.pointToCashRate}
                      </div>
                    </td>
                    <td>
                      <span
                        className={
                          sub.status === "APPROVED"
                            ? styles.badgeApproved
                            : sub.status === "REJECTED"
                            ? styles.badgeRejected
                            : styles.badgePending
                        }
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {sub.status === "PENDING" ? (
                        <button
                          className={styles.btnPrimary}
                          style={{ padding: "6px 12px", fontSize: "12px" }}
                          onClick={() => {
                            setReviewModalData(sub);
                            setReviewFormData({
                              reviewNotes: "",
                              customPoints: sub.taskReward?.points || 10,
                              customAmount: (sub.taskReward?.points || 10) * settings.pointToCashRate,
                            });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>gavel</span>
                          Review Claim
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          TAB 3: STAFF POINTS & PAYOUTS WALLET
          ========================================================================= */}
      {activeTab === "wallets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Earners Leaderboard */}
          {stats?.leaderboard && stats.leaderboard.length > 0 && (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="material-symbols-outlined" style={{ color: "#f59e0b" }}>emoji_events</span>
                Top Staff Incentive Leaderboard
              </h3>
              <div className={styles.leaderboardGrid}>
                {stats.leaderboard.slice(0, 4).map((item: any, idx: number) => (
                  <div key={item.employee.id} className={styles.leaderCard}>
                    <div
                      className={`${styles.rankBadge} ${
                        idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : idx === 2 ? styles.rank3 : styles.rankDefault
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>
                        {item.employee.firstName} {item.employee.lastName}
                      </span>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        {item.employee.designation || "Staff"} • {item.completedTasks} Tasks Done
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#d97706", fontSize: "15px" }}>
                        {item.points} pts
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#10b981", fontWeight: 700 }}>
                        ৳ {item.totalCash.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wallets Table */}
          <div className={styles.tableCard}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Total Earned Points</th>
                  <th>Total Points Redeemed</th>
                  <th>Available Balance</th>
                  <th>Cash Value (BDT)</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {wallets.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                      No staff reward points recorded yet.
                    </td>
                  </tr>
                ) : (
                  wallets.map((wallet) => (
                    <tr key={wallet.employee.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {wallet.employee.firstName} {wallet.employee.lastName}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          ID: {wallet.employee.employeeId} • {wallet.employee.department || "General"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#d97706" }}>
                          +{wallet.totalPointsEarned} pts
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          ৳ {wallet.totalAmountEarned.toLocaleString()} earned
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--text-muted)" }}>
                          -{wallet.totalPointsRedeemed} pts
                        </div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                          ৳ {wallet.totalAmountRedeemed.toLocaleString()} paid out
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#2563eb" }}>
                          {wallet.balancePoints} pts
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#10b981" }}>
                          ৳ {wallet.balanceCash.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className={styles.btnPrimary}
                          style={{ padding: "6px 14px", fontSize: "12.5px" }}
                          disabled={wallet.balancePoints < settings.minRedeemPoints}
                          onClick={() => {
                            setPayoutModalData({
                              employeeId: wallet.employee.id,
                              balancePoints: wallet.balancePoints,
                              name: `${wallet.employee.firstName} ${wallet.employee.lastName}`,
                            });
                            setPayoutFormData({
                              pointsToRedeem: wallet.balancePoints,
                              payoutMethod: "CASH",
                              reference: "",
                              notes: "",
                            });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                          Disburse Extra Income
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DISBURSED HISTORY
          ========================================================================= */}
      {activeTab === "payouts" && (
        <div className={styles.tableCard}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Disbursed Date</th>
                <th>Employee</th>
                <th>Points Redeemed</th>
                <th>Disbursed Amount</th>
                <th>Payout Method</th>
                <th>Reference / TrxID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No payout disbursements recorded yet.
                  </td>
                </tr>
              ) : (
                payouts.map((pay) => (
                  <tr key={pay.id}>
                    <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {pay.employee?.firstName} {pay.employee?.lastName}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                        ID: {pay.employee?.employeeId}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#d97706" }}>{pay.pointsRedeemed} pts</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#10b981", fontSize: "15px" }}>
                        ৳ {Number(pay.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={styles.badgeApproved}>
                        {pay.payoutMethod.replace("_", " ")}
                      </span>
                    </td>
                    <td>{pay.reference || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td>
                      <span className={styles.badgeApproved}>{pay.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          TAB 5: RULES & CONVERSION SETTINGS
          ========================================================================= */}
      {activeTab === "settings" && (
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "18px",
            padding: "26px",
            maxWidth: "600px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 8px 0" }}>
            Point Conversion & Reward Rules
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px 0" }}>
            Configure how points earned by employees are converted into real cash bonuses and extra income.
          </p>

          <form onSubmit={handleSaveSettings} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Point to Cash Rate (BDT per 1 Point)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontWeight: 700 }}>1 Point = ৳</span>
                <input
                  type="number"
                  step="0.5"
                  className={styles.formInput}
                  value={settings.pointToCashRate}
                  onChange={(e) => setSettings({ ...settings, pointToCashRate: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                Example: If set to 10, a 50-point task gives ৳ 500.00 BDT extra income.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Minimum Points for Payout Disbursement</label>
              <input
                type="number"
                className={styles.formInput}
                value={settings.minRedeemPoints}
                onChange={(e) => setSettings({ ...settings, minRedeemPoints: parseInt(e.target.value, 10) || 1 })}
                required
              />
            </div>

            <div className={styles.formGroup} style={{ flexDirection: "row", alignItems: "center", gap: "10px" }}>
              <input
                type="checkbox"
                id="autoApproveCheck"
                checked={settings.autoApprove}
                onChange={(e) => setSettings({ ...settings, autoApprove: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="autoApproveCheck" className={styles.formLabel} style={{ cursor: "pointer", margin: 0 }}>
                Auto-approve task completions immediately without manual HR review
              </label>
            </div>

            <div style={{ paddingTop: "14px" }}>
              <button type="submit" className={styles.btnPrimary}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREATE / EDIT SPECIAL TASK
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingTask ? "Edit Special Task Reward" : "Create New Special Task Bounty"}
              </h2>
              <button className={styles.closeButton} onClick={() => setIsCreateModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTask} className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Weekend Inventory Audit / Reach Sales Milestone"
                  className={styles.formInput}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Detail what the employee needs to do to qualify for this reward points and bonus..."
                  className={styles.formTextarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formSelect}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="SPECIAL_TASK">Special Task</option>
                    <option value="PROJECT_BOUNTY">Project Bounty</option>
                    <option value="OVERTIME_INCENTIVE">Overtime Incentive</option>
                    <option value="SALES_TARGET">Sales Target</option>
                    <option value="ATTENDANCE_STREAK">Attendance Streak</option>
                    <option value="INNOVATION">Innovation</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    className={styles.formSelect}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reward Points (pts) *</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    value={formData.points}
                    onChange={(e) => {
                      const pts = parseInt(e.target.value, 10) || 0;
                      setFormData({
                        ...formData,
                        points: pts,
                        monetaryValue: pts * settings.pointToCashRate,
                      });
                    }}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Equivalent Cash Value (৳ BDT)</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.formInput}
                    value={formData.monetaryValue}
                    onChange={(e) => setFormData({ ...formData, monetaryValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assign Exclusively To (Optional)</label>
                  <select
                    className={styles.formSelect}
                    value={formData.assignedToEmployeeId}
                    onChange={(e) => setFormData({ ...formData, assignedToEmployeeId: e.target.value })}
                  >
                    <option value="">Open for All Employees</option>
                    {allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Max Completed Claims</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    value={formData.maxClaims}
                    onChange={(e) => setFormData({ ...formData, maxClaims: parseInt(e.target.value, 10) || 1 })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Completion Deadline (Optional)</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                  {editingTask ? "Update Special Task" : "Publish Special Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REVIEW SUBMISSION CLAIM
          ========================================================================= */}
      {reviewModalData && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Review Employee Task Claim</h2>
              <button className={styles.closeButton} onClick={() => setReviewModalData(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ background: "var(--surface-bg)", padding: "14px", borderRadius: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>TASK TITLE</div>
                <div style={{ fontWeight: 800, fontSize: "16px", marginTop: "2px" }}>
                  {reviewModalData.taskReward?.title}
                </div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  Candidate: <strong>{reviewModalData.employee?.firstName} {reviewModalData.employee?.lastName}</strong> ({reviewModalData.employee?.employeeId})
                </div>
              </div>

              {reviewModalData.submissionNotes && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Employee Submission Notes</label>
                  <div style={{ padding: "10px 14px", background: "var(--surface-bg)", borderRadius: "10px", fontSize: "13px" }}>
                    {reviewModalData.submissionNotes}
                  </div>
                </div>
              )}

              {reviewModalData.proofUrl && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Proof Attachment</label>
                  <a
                    href={reviewModalData.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#2563eb", fontSize: "13px", fontWeight: 600 }}
                  >
                    🔗 Click to Open Uploaded Proof Document / Image
                  </a>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Points to Award</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={reviewFormData.customPoints}
                    onChange={(e) => {
                      const pts = parseInt(e.target.value, 10) || 0;
                      setReviewFormData({
                        ...reviewFormData,
                        customPoints: pts,
                        customAmount: pts * settings.pointToCashRate,
                      });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Calculated Extra Income (৳)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={reviewFormData.customAmount}
                    onChange={(e) =>
                      setReviewFormData({ ...reviewFormData, customAmount: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>HR Feedback / Review Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional review notes to employee..."
                  className={styles.formTextarea}
                  value={reviewFormData.reviewNotes}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, reviewNotes: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ color: "#dc2626" }}
                  onClick={() => handleReviewAction("REJECT")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                  Reject Claim
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  onClick={() => handleReviewAction("APPROVE")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                  Approve & Award Points
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DISBURSE EXTRA INCOME PAYOUT
          ========================================================================= */}
      {payoutModalData && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Disburse Extra Income Payout</h2>
              <button className={styles.closeButton} onClick={() => setPayoutModalData(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDisbursePayout} className={styles.formGrid}>
              <div style={{ background: "var(--surface-bg)", padding: "14px", borderRadius: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>RECIPIENT</div>
                <div style={{ fontWeight: 800, fontSize: "16px" }}>{payoutModalData.name}</div>
                <div style={{ fontSize: "13px", color: "#2563eb", marginTop: "2px", fontWeight: 700 }}>
                  Available Balance: {payoutModalData.balancePoints} pts (৳ {(payoutModalData.balancePoints * settings.pointToCashRate).toLocaleString()})
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Points to Redeem *</label>
                  <input
                    type="number"
                    min={settings.minRedeemPoints}
                    max={payoutModalData.balancePoints}
                    className={styles.formInput}
                    value={payoutFormData.pointsToRedeem}
                    onChange={(e) =>
                      setPayoutFormData({
                        ...payoutFormData,
                        pointsToRedeem: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payout Amount (BDT)</label>
                  <div style={{ padding: "10px 14px", background: "rgba(16, 185, 129, 0.1)", color: "#059669", fontWeight: 800, fontSize: "16px", borderRadius: "10px" }}>
                    ৳ {(payoutFormData.pointsToRedeem * settings.pointToCashRate).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Disbursement Method</label>
                <select
                  className={styles.formSelect}
                  value={payoutFormData.payoutMethod}
                  onChange={(e) => setPayoutFormData({ ...payoutFormData, payoutMethod: e.target.value })}
                >
                  <option value="CASH">Instant Cash</option>
                  <option value="BKASH_NAGAD">bKash / Nagad MFS</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="PAYROLL_BONUS">Add to Monthly Payroll Bonus</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reference / Transaction ID / Voucher (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TRX-982348 or Cash Voucher #12"
                  className={styles.formInput}
                  value={payoutFormData.reference}
                  onChange={(e) => setPayoutFormData({ ...payoutFormData, reference: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Extra task payout for Q3 audit completion"
                  className={styles.formInput}
                  value={payoutFormData.notes}
                  onChange={(e) => setPayoutFormData({ ...payoutFormData, notes: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setPayoutModalData(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send_money</span>
                  Confirm & Disburse ৳{(payoutFormData.pointsToRedeem * settings.pointToCashRate).toLocaleString()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
