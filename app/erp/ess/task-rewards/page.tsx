"use client";

import React, { useState, useEffect } from "react";
import styles from "../../hr/task-rewards/task-rewards.module.css";

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
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
  maxClaims: number;
  checklist?: { type: string; items: ChecklistItem[] };
  submissions?: any[];
}

interface Submission {
  id: string;
  taskRewardId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submissionNotes?: string;
  proofUrl?: string;
  pointsAwarded: number;
  rewardAmount: number;
  reviewNotes?: string;
  createdAt: string;
  taskReward?: TaskReward;
}

interface Payout {
  id: string;
  pointsRedeemed: number;
  conversionRate: number;
  amount: number;
  payoutMethod: string;
  referenceNo?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export default function EssTaskRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "submissions" | "payouts">("available");
  const [tasks, setTasks] = useState<TaskReward[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [wallet, setWallet] = useState<{
    totalPointsEarned: number;
    totalAmountEarned: number;
    totalPointsRedeemed: number;
    totalAmountRedeemed: number;
    balancePoints: number;
    balanceCash: number;
    pointToCashRate: number;
  }>({
    totalPointsEarned: 0,
    totalAmountEarned: 0,
    totalPointsRedeemed: 0,
    totalAmountRedeemed: 0,
    balancePoints: 0,
    balanceCash: 0,
    pointToCashRate: 10,
  });

  // Claim Modal
  const [claimingTask, setClaimingTask] = useState<TaskReward | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEssData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ess/task-rewards");
      const json = await res.json();
      if (json.success) {
        setTasks(json.data.tasks || []);
        setSubmissions(json.data.mySubmissions || []);
        setPayouts(json.data.myPayouts || []);
        if (json.data.wallet) {
          setWallet(json.data.wallet);
        }
      }
    } catch (err) {
      console.error("Failed to load ESS task rewards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEssData();
  }, []);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingTask) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/hr/task-rewards/${claimingTask.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionNotes,
          proofUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message || "Task submission sent!");
        setClaimingTask(null);
        setSubmissionNotes("");
        setProofUrl("");
        fetchEssData();
        setActiveTab("submissions");
      } else {
        alert(json.error || "Failed to submit task claim");
      }
    } catch (err: any) {
      alert("Submission error: " + err.message);
    } finally {
      setSubmitting(false);
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
      {/* Employee Wallet Header */}
      <div className={styles.headerCard}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <div className={styles.liveBadgeRow}>
              <span className={styles.livePulseDot} />
              <span className={styles.liveBadgeText}>Employee Self-Service • Rewards Portal</span>
            </div>
            <h1 className={styles.pageTitle}>
              <span className={`material-symbols-outlined ${styles.titleIcon}`}>military_tech</span>
              Task Rewards & Extra Income
            </h1>
            <p className={styles.pageSubtitle}>
              Earn extra cash and rewards by completing special tasks, company bounties, and targets.
              Your reward points convert directly into real money paid out by management.
            </p>
          </div>
        </div>

        {/* Wallet Metrics */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiAmber}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>stars</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Available Balance</span>
              <span className={styles.kpiValue} style={{ color: "#2563eb" }}>{wallet.balancePoints} pts</span>
              <span className={styles.kpiSub}>৳ {wallet.balanceCash.toLocaleString()} ready for payout</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiGreen}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>paid</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Total Extra Income Earned</span>
              <span className={styles.kpiValue} style={{ color: "#10b981" }}>৳ {wallet.totalAmountEarned.toLocaleString()}</span>
              <span className={styles.kpiSub}>{wallet.totalPointsEarned} lifetime points</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiBlue}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>savings</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Total Paid Out</span>
              <span className={styles.kpiValue}>৳ {wallet.totalAmountRedeemed.toLocaleString()}</span>
              <span className={styles.kpiSub}>{wallet.totalPointsRedeemed} pts disbursed</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrapper} ${styles.kpiPurple}`}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>currency_exchange</span>
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>Reward Conversion Rate</span>
              <span className={styles.kpiValue}>1 pt = ৳{wallet.pointToCashRate}</span>
              <span className={styles.kpiSub}>Company Standard Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "available" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("available")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>assignment</span>
          Available Special Tasks ({tasks.filter((t) => t.status === "OPEN").length})
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "submissions" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>task_alt</span>
          My Submissions & Approvals ({submissions.length})
        </button>

        <button
          className={`${styles.tabButton} ${activeTab === "payouts" ? styles.tabButtonActive : ""}`}
          onClick={() => setActiveTab("payouts")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>
          My Payout Ledger ({payouts.length})
        </button>
      </div>

      {/* TAB 1: AVAILABLE TASKS */}
      {activeTab === "available" && (
        <div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Loading special tasks...
            </div>
          ) : tasks.length === 0 ? (
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
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0" }}>No Available Tasks Right Now</h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                Check back soon! Management posts new bounties and extra income tasks regularly.
              </p>
            </div>
          ) : (
            <div className={styles.tasksGrid}>
              {tasks.map((task) => {
                const catStyle = getCategoryColor(task.category);
                const cashValue = task.monetaryValue || task.points * wallet.pointToCashRate;
                const hasSubmitted = task.submissions && task.submissions.length > 0;
                const checklistItems = task.checklist?.items || [];

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

                      {/* Checkbox Subtasks Checklist */}
                      {checklistItems.length > 0 && (
                        <div
                          style={{
                            background: "var(--surface-bg)",
                            border: "1px solid var(--border-main)",
                            borderRadius: "10px",
                            padding: "10px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            📋 Checkbox Subtasks Checklist ({checklistItems.length})
                          </div>
                          {checklistItems.map((item) => (
                            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: "16px", color: "#f59e0b" }}
                              >
                                check_box_outline_blank
                              </span>
                              <span>{item.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div className={styles.taskMetaRow}>
                        <span className={styles.rewardCashText}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                          ৳ {cashValue.toLocaleString()} Extra Income
                        </span>
                        {task.deadline && (
                          <span>⏱️ Due {new Date(task.deadline).toLocaleDateString()}</span>
                        )}
                      </div>

                      <div className={styles.taskFooter}>
                        <span className={task.status === "OPEN" ? styles.badgeApproved : styles.badgePending}>
                          {task.status}
                        </span>

                        {hasSubmitted ? (
                          <span style={{ fontSize: "12.5px", color: "#2563eb", fontWeight: 700 }}>
                            ✓ Claim Submitted
                          </span>
                        ) : (
                          <button
                            className={styles.btnPrimary}
                            style={{ padding: "8px 14px", fontSize: "13px" }}
                            onClick={() => {
                              setClaimingTask(task);
                              setSubmissionNotes("");
                              setProofUrl("");
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
                            Submit Completion
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBMISSIONS */}
      {activeTab === "submissions" && (
        <div className={styles.tableCard}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Special Task</th>
                <th>Category</th>
                <th>Submission Date</th>
                <th>My Notes / Proof</th>
                <th>Points Awarded</th>
                <th>Reward Cash</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    You haven't submitted any special task claims yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: 700 }}>{sub.taskReward?.title}</td>
                    <td>
                      <span className={styles.categoryTag} style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
                        {sub.taskReward?.category?.replace("_", " ")}
                      </span>
                    </td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ fontSize: "13px" }}>{sub.submissionNotes || "No notes"}</div>
                      {sub.proofUrl && (
                        <a
                          href={sub.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb", fontSize: "12px", textDecoration: "underline" }}
                        >
                          View Proof 🔗
                        </a>
                      )}
                      {sub.reviewNotes && (
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px" }}>
                          HR Note: <em>{sub.reviewNotes}</em>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#d97706" }}>
                        {sub.status === "APPROVED" ? `+${sub.pointsAwarded} pts` : "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#10b981" }}>
                        {sub.status === "APPROVED" ? `৳ ${sub.rewardAmount}` : "—"}
                      </span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: MY PAYOUT LEDGER */}
      {activeTab === "payouts" && (
        <div className={styles.tableCard}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Disbursed Date</th>
                <th>Points Redeemed</th>
                <th>Disbursed Extra Income</th>
                <th>Payout Method</th>
                <th>Reference / TrxID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No payout disbursements received yet. Keep completing tasks to earn extra money!
                  </td>
                </tr>
              ) : (
                payouts.map((pay) => (
                  <tr key={pay.id}>
                    <td>{new Date(pay.createdAt).toLocaleDateString()}</td>
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
                    <td>{pay.referenceNo || "—"}</td>
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

      {/* MODAL: SUBMIT CLAIM */}
      {claimingTask && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Submit Special Task Completion</h2>
              <button className={styles.closeButton} onClick={() => setClaimingTask(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className={styles.formGrid}>
              <div style={{ background: "rgba(30, 41, 59, 0.7)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>SPECIAL TASK BOUNTY</div>
                <div style={{ fontWeight: 800, fontSize: "16px", marginTop: "2px" }}>
                  {claimingTask.title}
                </div>
                <div style={{ fontSize: "13px", color: "#f59e0b", marginTop: "4px", fontWeight: 700 }}>
                  Reward: +{claimingTask.points} Points (৳ {(claimingTask.monetaryValue || claimingTask.points * wallet.pointToCashRate).toLocaleString()} Extra Income)
                </div>
              </div>

              {/* Show Checkbox items to candidate in modal */}
              {claimingTask.checklist?.items && claimingTask.checklist.items.length > 0 && (
                <div
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Required Subtasks:
                  </div>
                  {claimingTask.checklist.items.map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#f59e0b" }}>
                        check_box
                      </span>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Completion Summary & Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Explain how you completed this special task or target..."
                  className={styles.formTextarea}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Proof Attachment URL (Google Drive / Image / Document link)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://..."
                  className={styles.formInput}
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
                <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  Provide proof to help HR verify and approve your points quickly.
                </span>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setClaimingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                  {submitting ? "Submitting..." : "Submit Claim for Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
