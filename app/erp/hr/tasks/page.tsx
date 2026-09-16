"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "./tasks.module.css";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
}

interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignedToEmployeeId: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  checklist?: any;
  employee?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
  } | null;
}

function parseChecklistData(raw: any): any {
  if (!raw) return null;
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  return parsed;
}

function extractChecklistItems(raw: any): TaskChecklistItem[] {
  const checklist = parseChecklistData(raw);
  if (!checklist) return [];
  if (Array.isArray(checklist)) return checklist;
  if (Array.isArray(checklist.items)) return checklist.items;
  if (Array.isArray(checklist.todos)) return checklist.todos;
  return [];
}

function isChecklistTask(task: Task): boolean {
  if (!task.checklist) return false;
  const items = extractChecklistItems(task.checklist);
  if (items.length > 0) return true;
  const parsed = parseChecklistData(task.checklist);
  if (parsed?.type?.toUpperCase() === "CHECKLIST") return true;
  return false;
}

const EMPTY_TASK_FORM = {
  taskType: "PLAIN" as "PLAIN" | "CHECKLIST",
  title: "",
  description: "",
  assignedToEmployeeId: "",
  priority: "Medium",
  status: "Pending",
  dueDate: "",
  checklistItems: [] as TaskChecklistItem[],
};

export default function HRTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM);
  const [newTodoText, setNewTodoText] = useState("");
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, empsRes] = await Promise.all([
        fetch("/api/hr/tasks").catch(() => null),
        fetch("/api/employees").catch(() => null),
      ]);

      if (tasksRes && tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
      if (empsRes && empsRes.ok) {
        const eData = await empsRes.json();
        setEmployees(Array.isArray(eData) ? eData : []);
      }
    } catch (err) {
      console.error("[HR Tasks] Load data error:", err);
      showToast("Failed to load tasks data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "Pending" || t.status === "To Do").length;
    const inProgress = tasks.filter((t) => t.status === "In Progress").length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const highPriority = tasks.filter((t) => t.priority === "High" || t.priority === "Urgent").length;
    return { total, pending, inProgress, completed, highPriority };
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.employee &&
          `${t.employee.firstName} ${t.employee.lastName} ${t.employee.employeeId}`
            .toLowerCase()
            .includes(q)) ||
        (t.assignedToEmployeeId && t.assignedToEmployeeId.toLowerCase().includes(q));

      const matchStatus =
        selectedStatus === "ALL" ||
        t.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchPriority =
        selectedPriority === "ALL" ||
        t.priority.toLowerCase() === selectedPriority.toLowerCase();

      const matchEmployee =
        selectedEmployeeId === "ALL" ||
        t.assignedToEmployeeId === selectedEmployeeId;

      const isChecklist = isChecklistTask(t);
      const matchType =
        selectedType === "ALL" ||
        (selectedType === "CHECKLIST" && isChecklist) ||
        (selectedType === "PLAIN" && !isChecklist);

      return matchSearch && matchStatus && matchPriority && matchEmployee && matchType;
    });
  }, [tasks, searchQuery, selectedStatus, selectedPriority, selectedEmployeeId, selectedType]);

  // Checklist Helpers for Form
  const handleAddTodoItem = () => {
    if (!newTodoText.trim()) return;
    const newItem: TaskChecklistItem = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: newTodoText.trim(),
      completed: false,
    };
    setTaskForm((prev) => ({
      ...prev,
      checklistItems: [...prev.checklistItems, newItem],
    }));
    setNewTodoText("");
  };

  const handleRemoveTodoItem = (id: string) => {
    setTaskForm((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((item) => item.id !== id),
    }));
  };

  const handleToggleFormTodo = (id: string) => {
    setTaskForm((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    }));
  };

  const toggleExpandTask = (taskId: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Inline Card Checklist Item Toggle
  const handleToggleCardTodo = async (task: Task, itemId: string) => {
    const currentItems = extractChecklistItems(task.checklist);
    const updatedItems = currentItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedChecklist = Array.isArray(task.checklist)
      ? updatedItems
      : {
          ...(typeof task.checklist === "object" ? task.checklist : {}),
          type: "CHECKLIST",
          items: updatedItems,
        };

    const allCompleted = updatedItems.length > 0 && updatedItems.every((it) => it.completed);
    let newStatus = task.status;
    if (allCompleted && task.status !== "Completed") {
      newStatus = "Completed";
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, checklist: updatedChecklist, status: newStatus } : t
      )
    );

    try {
      const res = await fetch(`/api/hr/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist: updatedChecklist, status: newStatus }),
      });
      if (!res.ok) {
        await loadData();
        showToast("Failed to update to-do item");
      }
    } catch {
      await loadData();
      showToast("Error updating to-do item");
    }
  };

  // Handle Assign Task
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.assignedToEmployeeId) {
      alert("Please provide both a task title and an assigned employee.");
      return;
    }

    if (taskForm.taskType === "CHECKLIST" && taskForm.checklistItems.length === 0) {
      alert("Please add at least one to-do item to the checklist, or switch to Plain Task.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: taskForm.title.trim(),
        description: taskForm.description ? taskForm.description.trim() : null,
        assignedToEmployeeId: taskForm.assignedToEmployeeId,
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate || null,
        checklist:
          taskForm.taskType === "CHECKLIST"
            ? {
                type: "CHECKLIST",
                items: taskForm.checklistItems,
              }
            : null,
      };

      const res = await fetch("/api/hr/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        setTaskForm(EMPTY_TASK_FORM);
        setNewTodoText("");
        showToast("Task assigned successfully and staff notified!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to assign task: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to assign task"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Task
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    if (taskForm.taskType === "CHECKLIST" && taskForm.checklistItems.length === 0) {
      alert("Please add at least one to-do item to the checklist, or switch to Plain Task.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        title: taskForm.title.trim(),
        description: taskForm.description ? taskForm.description.trim() : null,
        assignedToEmployeeId: taskForm.assignedToEmployeeId,
        priority: taskForm.priority,
        status: taskForm.status,
        dueDate: taskForm.dueDate || null,
        checklist:
          taskForm.taskType === "CHECKLIST"
            ? {
                ...(typeof activeTask.checklist === "object" ? activeTask.checklist : {}),
                type: "CHECKLIST",
                items: taskForm.checklistItems,
              }
            : null,
      };

      const res = await fetch(`/api/hr/tasks/${activeTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setActiveTask(null);
        setNewTodoText("");
        showToast("Task updated successfully!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to update task: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to update task"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async () => {
    if (!activeTask) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/hr/tasks/${activeTask.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsDeleteModalOpen(false);
        setActiveTask(null);
        showToast("Task deleted successfully!");
        await loadData();
      } else {
        const data = await res.json();
        alert(`Failed to delete task: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to delete task"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Quick Status Update
  const handleInlineStatusChange = async (taskId: string, newStatus: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      const res = await fetch(`/api/hr/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        await loadData();
        showToast("Failed to update status");
      }
    } catch {
      await loadData();
      showToast("Error updating task status");
    }
  };

  const openEditModal = (task: Task) => {
    setActiveTask(task);
    const hasChecklist = isChecklistTask(task);
    const items = extractChecklistItems(task.checklist);
    setTaskForm({
      taskType: hasChecklist ? "CHECKLIST" : "PLAIN",
      title: task.title,
      description: task.description || "",
      assignedToEmployeeId: task.assignedToEmployeeId || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      checklistItems: items,
    });
    setNewTodoText("");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (task: Task) => {
    setActiveTask(task);
    setIsDeleteModalOpen(true);
  };

  const getPriorityBadgeClass = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === "urgent") return styles.priorityUrgent;
    if (p === "high") return styles.priorityHigh;
    if (p === "low") return styles.priorityLow;
    return styles.priorityMedium;
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return styles.statusCompleted;
    if (s === "in progress") return styles.statusInProgress;
    if (s === "blocked") return styles.statusBlocked;
    return styles.statusPending;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName || "")[0] || ""}${(lastName || "")[0] || ""}`.toUpperCase() || "ST";
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "Completed") return false;
    return new Date(dueDate).getTime() < Date.now();
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
              <span className={styles.liveBadgeText}>Workforce Task Dispatch</span>
            </div>
            <h1 className={styles.pageTitle}>
              <span className="material-symbols-outlined" style={{ color: "#3b82f6", fontSize: "30px" }}>
                assignment
              </span>
              Task Dispatch &amp; Staff Assignments
            </h1>
            <p className={styles.pageSubtitle}>
              Assign tasks directly to staff by Employee ID with real-time sync to the Shohoj Staff mobile app.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => {
                setTaskForm(EMPTY_TASK_FORM);
                setNewTodoText("");
                setIsAssignModalOpen(true);
              }}
              className={styles.primaryBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                add_task
              </span>
              Assign New Task
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                assignment
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Total Tasks</span>
              <span className={styles.metricValue}>{metrics.total}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                pending_actions
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Pending</span>
              <span className={styles.metricValue}>{metrics.pending}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(37, 99, 235, 0.12)", color: "#1d4ed8" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                sync
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>In Progress</span>
              <span className={styles.metricValue}>{metrics.inProgress}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                task_alt
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Completed</span>
              <span className={styles.metricValue}>{metrics.completed}</span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap} style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
                priority_high
              </span>
            </div>
            <div className={styles.metricInfo}>
              <span className={styles.metricLabel}>Urgent / High</span>
              <span className={styles.metricValue}>{metrics.highPriority}</span>
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
              placeholder="Search by title, details, employee name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Task Types</option>
              <option value="PLAIN">Plain Tasks Only</option>
              <option value="CHECKLIST">Checklist Tasks Only</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>

            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.employeeId}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>

            <div className={styles.viewToggle}>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`${styles.viewToggleBtn} ${viewMode === "cards" ? styles.viewToggleBtnActive : ""}`}
                title="Cards View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  grid_view
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`${styles.viewToggleBtn} ${viewMode === "table" ? styles.viewToggleBtnActive : ""}`}
                title="Table View"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  format_list_bulleted
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tab Chips */}
        <div className={styles.statusTabs}>
          {["ALL", "Pending", "In Progress", "Completed", "Blocked"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`${styles.statusTab} ${selectedStatus === status ? styles.statusTabActive : ""}`}
            >
              {status === "ALL" ? "All Tasks" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Task Listing */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
          <div className="material-symbols-outlined" style={{ fontSize: "36px", animation: "spin 1s linear infinite" }}>
            progress_activity
          </div>
          <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading staff tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <span className="material-symbols-outlined">assignment_turned_in</span>
          </div>
          <h3 className={styles.emptyTitle}>No tasks found</h3>
          <p className={styles.emptyDesc}>
            {searchQuery || selectedStatus !== "ALL" || selectedPriority !== "ALL" || selectedEmployeeId !== "ALL"
              ? "No tasks match your current search and filter criteria."
              : "No tasks have been assigned yet. Start by assigning a duty to an employee."}
          </p>
          <button
            onClick={() => {
              setTaskForm(EMPTY_TASK_FORM);
              setNewTodoText("");
              setIsAssignModalOpen(true);
            }}
            className={styles.primaryBtn}
            style={{ marginTop: "8px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              add_task
            </span>
            Assign First Task
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* Cards View */
        <div className={styles.cardsGrid}>
          {filteredTasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status);
            const isChecklist = isChecklistTask(task);
            const checklistItems = extractChecklistItems(task.checklist);
            const totalCount = checklistItems.length;
            const completedCount = checklistItems.filter((i) => i.completed).length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isExpanded = !!expandedCardIds[task.id];
            const visibleItems = isExpanded ? checklistItems : checklistItems.slice(0, 3);

            return (
              <div key={task.id} className={styles.taskCard}>
                <div className={styles.cardTopRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                      <span className={styles.badgeDot} style={{ background: "currentColor" }} />
                      {task.priority} Priority
                    </span>

                    {isChecklist ? (
                      <span className={`${styles.badge} ${styles.typeBadgeChecklist}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          checklist
                        </span>
                        Checklist ({completedCount}/{totalCount})
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.typeBadgePlain}`}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                          description
                        </span>
                        Plain Task
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      onClick={() => openEditModal(task)}
                      className={styles.iconBtn}
                      title="Edit Task"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        edit
                      </span>
                    </button>
                    <button
                      onClick={() => openDeleteModal(task)}
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      title="Delete Task"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>

                <h3 className={styles.taskTitle}>{task.title}</h3>

                {task.description && <p className={styles.taskDesc}>{task.description}</p>}

                {/* Checklist / To-Do Items Section */}
                {isChecklist && totalCount > 0 && (
                  <div className={styles.cardProgressSection}>
                    <div className={styles.progressInfoRow}>
                      <span className={styles.progressLabel}>
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#2563eb" }}>
                          playlist_add_check
                        </span>
                        To-Do Checklist
                      </span>
                      <span className={styles.progressValue}>
                        {completedCount}/{totalCount} ({percent}%)
                      </span>
                    </div>

                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className={styles.cardChecklistItems}>
                      {visibleItems.map((item) => (
                        <div
                          key={item.id}
                          className={styles.cardChecklistItem}
                          onClick={() => handleToggleCardTodo(task, item.id)}
                        >
                          <button
                            type="button"
                            className={`${styles.todoCheckboxCustom} ${item.completed ? styles.todoCheckboxCustomChecked : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCardTodo(task, item.id);
                            }}
                            title={item.completed ? "Mark incomplete" : "Mark completed"}
                          >
                            {item.completed && (
                              <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                                check
                              </span>
                            )}
                          </button>
                          <span className={`${styles.cardChecklistText} ${item.completed ? styles.cardChecklistTextCompleted : ""}`}>
                            {item.title}
                          </span>
                        </div>
                      ))}

                      {totalCount > 3 && (
                        <button
                          type="button"
                          className={styles.expandChecklistBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandTask(task.id);
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                            {isExpanded ? "expand_less" : "expand_more"}
                          </span>
                          {isExpanded ? "Show fewer items" : `View all ${totalCount} items`}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Assignee Information */}
                <div className={styles.cardAssigneeRow}>
                  <div className={styles.avatarCircle}>
                    {task.employee
                      ? getInitials(task.employee.firstName, task.employee.lastName)
                      : "ID"}
                  </div>
                  <div className={styles.assigneeText}>
                    <span className={styles.assigneeName}>
                      {task.employee
                        ? `${task.employee.firstName} ${task.employee.lastName}`
                        : `Employee ID: ${task.assignedToEmployeeId || "Unassigned"}`}
                    </span>
                    <span className={styles.assigneeMeta}>
                      {task.employee?.employeeId ? `ID: ${task.employee.employeeId}` : ""}
                      {task.employee?.designation ? ` • ${task.employee.designation}` : ""}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Due Date & Status Selector */}
                <div className={styles.cardFooter}>
                  <div className={`${styles.dueDateBadge} ${overdue ? styles.dueDateOverdue : ""}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                      {overdue ? "warning" : "event"}
                    </span>
                    <span>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No deadline"}
                    </span>
                  </div>

                  <select
                    value={task.status}
                    onChange={(e) => handleInlineStatusChange(task.id, e.target.value)}
                    className={`${styles.badge} ${getStatusBadgeClass(task.status)}`}
                    style={{ border: "none", cursor: "pointer", outline: "none", padding: "5px 10px" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Type &amp; To-Dos</th>
                  <th>Assigned Employee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const isChecklist = isChecklistTask(task);
                  const checklistItems = extractChecklistItems(task.checklist);
                  const totalCount = checklistItems.length;
                  const completedCount = checklistItems.filter((i) => i.completed).length;
                  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                  return (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "320px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td>
                        {isChecklist ? (
                          <div className={styles.tableProgressCell}>
                            <span
                              className={`${styles.badge} ${styles.typeBadgeChecklist}`}
                              style={{ alignSelf: "flex-start", fontSize: "11px", padding: "2px 8px" }}
                            >
                              Checklist ({completedCount}/{totalCount})
                            </span>
                            <div className={styles.tableProgressTrack}>
                              <div
                                className={styles.tableProgressFill}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`${styles.badge} ${styles.typeBadgePlain}`}
                            style={{ fontSize: "11px", padding: "2px 8px" }}
                          >
                            Plain Task
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className={styles.avatarCircle} style={{ width: "28px", height: "28px", fontSize: "11px" }}>
                            {task.employee
                              ? getInitials(task.employee.firstName, task.employee.lastName)
                              : "ID"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>
                              {task.employee
                                ? `${task.employee.firstName} ${task.employee.lastName}`
                                : task.assignedToEmployeeId || "Unassigned"}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                              {task.employee?.employeeId || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          value={task.status}
                          onChange={(e) => handleInlineStatusChange(task.id, e.target.value)}
                          className={`${styles.badge} ${getStatusBadgeClass(task.status)}`}
                          style={{ border: "none", cursor: "pointer", outline: "none", padding: "4px 8px" }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>
                      <td>
                        <div className={`${styles.dueDateBadge} ${overdue ? styles.dueDateOverdue : ""}`}>
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => openEditModal(task)}
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(task)}
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Delete"
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

      {/* Modal: Assign New Task */}
      {isAssignModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>
                  add_task
                </span>
                Assign Task to Staff
              </h2>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className={styles.iconBtn}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAssignTask}>
              <div className={styles.modalBody}>
                {/* Task Type Selector */}
                <div className={styles.typeSelectorGroup}>
                  <label className={styles.formLabel}>Task Type</label>
                  <div className={styles.typeToggle}>
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, taskType: "PLAIN" })}
                      className={`${styles.typeToggleBtn} ${taskForm.taskType === "PLAIN" ? styles.typeToggleBtnActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                        description
                      </span>
                      Plain Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, taskType: "CHECKLIST" })}
                      className={`${styles.typeToggleBtn} ${taskForm.taskType === "CHECKLIST" ? styles.typeToggleBtnActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                        checklist
                      </span>
                      Checklist / To-Do Task
                    </button>
                  </div>
                  <span className={styles.typeToggleDesc}>
                    {taskForm.taskType === "PLAIN"
                      ? "Standard task with a single title and description."
                      : "Task with a title and a dynamic to-do checklist that staff can check off."}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder={taskForm.taskType === "CHECKLIST" ? "e.g., Staff Onboarding Checklist" : "e.g., Audit Monthly Payroll Records"}
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                {/* To-Do List Builder */}
                {taskForm.taskType === "CHECKLIST" && (
                  <div className={styles.checklistBuilder}>
                    <div className={styles.checklistBuilderHeader}>
                      <div className={styles.checklistBuilderTitle}>
                        <span className="material-symbols-outlined" style={{ color: "#2563eb", fontSize: "18px" }}>
                          playlist_add_check
                        </span>
                        Checklist / To-Do Items
                      </div>
                      <span className={styles.checklistCountBadge}>
                        {taskForm.checklistItems.length} {taskForm.checklistItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className={styles.todoInputRow}>
                      <input
                        type="text"
                        placeholder="Add a to-do item (e.g., Collect signed contract)..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTodoItem();
                          }
                        }}
                        className={styles.todoInput}
                      />
                      <button
                        type="button"
                        onClick={handleAddTodoItem}
                        className={styles.addTodoBtn}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          add
                        </span>
                        Add
                      </button>
                    </div>

                    {taskForm.checklistItems.length === 0 ? (
                      <div className={styles.todoItemsEmpty}>
                        No to-do items added yet. Type an item above and click Add (or press Enter).
                      </div>
                    ) : (
                      <div className={styles.todoItemsList}>
                        {taskForm.checklistItems.map((item) => (
                          <div key={item.id} className={styles.todoItemRow}>
                            <div className={styles.todoItemLeft}>
                              <button
                                type="button"
                                className={`${styles.todoCheckboxCustom} ${item.completed ? styles.todoCheckboxCustomChecked : ""}`}
                                onClick={() => handleToggleFormTodo(item.id)}
                                title={item.completed ? "Mark incomplete" : "Mark completed"}
                              >
                                {item.completed && (
                                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                                    check
                                  </span>
                                )}
                              </button>
                              <span className={`${styles.todoItemText} ${item.completed ? styles.todoItemTextDone : ""}`}>
                                {item.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.todoDeleteBtn}
                              onClick={() => handleRemoveTodoItem(item.id)}
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                delete
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assign to Staff (Employee ID) *</label>
                  <select
                    required
                    value={taskForm.assignedToEmployeeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToEmployeeId: e.target.value })}
                    className={styles.formSelect}
                  >
                    <option value="">Select Employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId}) {emp.designation ? `— ${emp.designation}` : ""}
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    The task will be strictly bound to this Employee ID and will appear in their Staff App.
                  </span>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Initial Status</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Task Instructions &amp; Description</label>
                  <textarea
                    placeholder="Provide detailed instructions, checklist items, or deliverables..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
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
                  {isSubmitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Task */}
      {isEditModalOpen && activeTask && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <span className="material-symbols-outlined" style={{ color: "#3b82f6" }}>
                  edit_note
                </span>
                Edit Task
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
                {/* Task Type Selector */}
                <div className={styles.typeSelectorGroup}>
                  <label className={styles.formLabel}>Task Type</label>
                  <div className={styles.typeToggle}>
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, taskType: "PLAIN" })}
                      className={`${styles.typeToggleBtn} ${taskForm.taskType === "PLAIN" ? styles.typeToggleBtnActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                        description
                      </span>
                      Plain Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskForm({ ...taskForm, taskType: "CHECKLIST" })}
                      className={`${styles.typeToggleBtn} ${taskForm.taskType === "CHECKLIST" ? styles.typeToggleBtnActive : ""}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>
                        checklist
                      </span>
                      Checklist / To-Do Task
                    </button>
                  </div>
                  <span className={styles.typeToggleDesc}>
                    {taskForm.taskType === "PLAIN"
                      ? "Standard task with a single title and description."
                      : "Task with a title and a dynamic to-do checklist that staff can check off."}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Task Title *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                {/* To-Do List Builder in Edit Modal */}
                {taskForm.taskType === "CHECKLIST" && (
                  <div className={styles.checklistBuilder}>
                    <div className={styles.checklistBuilderHeader}>
                      <div className={styles.checklistBuilderTitle}>
                        <span className="material-symbols-outlined" style={{ color: "#2563eb", fontSize: "18px" }}>
                          playlist_add_check
                        </span>
                        Checklist / To-Do Items
                      </div>
                      <span className={styles.checklistCountBadge}>
                        {taskForm.checklistItems.length} {taskForm.checklistItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className={styles.todoInputRow}>
                      <input
                        type="text"
                        placeholder="Add a to-do item..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTodoItem();
                          }
                        }}
                        className={styles.todoInput}
                      />
                      <button
                        type="button"
                        onClick={handleAddTodoItem}
                        className={styles.addTodoBtn}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          add
                        </span>
                        Add
                      </button>
                    </div>

                    {taskForm.checklistItems.length === 0 ? (
                      <div className={styles.todoItemsEmpty}>
                        No to-do items in this checklist yet. Add items above.
                      </div>
                    ) : (
                      <div className={styles.todoItemsList}>
                        {taskForm.checklistItems.map((item) => (
                          <div key={item.id} className={styles.todoItemRow}>
                            <div className={styles.todoItemLeft}>
                              <button
                                type="button"
                                className={`${styles.todoCheckboxCustom} ${item.completed ? styles.todoCheckboxCustomChecked : ""}`}
                                onClick={() => handleToggleFormTodo(item.id)}
                                title={item.completed ? "Mark incomplete" : "Mark completed"}
                              >
                                {item.completed && (
                                  <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>
                                    check
                                  </span>
                                )}
                              </button>
                              <span className={`${styles.todoItemText} ${item.completed ? styles.todoItemTextDone : ""}`}>
                                {item.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={styles.todoDeleteBtn}
                              onClick={() => handleRemoveTodoItem(item.id)}
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                delete
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assigned Employee *</label>
                  <select
                    required
                    value={taskForm.assignedToEmployeeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToEmployeeId: e.target.value })}
                    className={styles.formSelect}
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Status</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className={styles.formSelect}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Due Date</label>
                  <input
                    type="datetime-local"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
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
      {isDeleteModalOpen && activeTask && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent} style={{ maxWidth: "440px" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
                <span className="material-symbols-outlined">warning</span>
                Delete Task
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
                Are you sure you want to delete <strong>&quot;{activeTask.title}&quot;</strong>?
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                This will also remove it from the staff member&apos;s mobile app view. This action cannot be undone.
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
                onClick={handleDeleteTask}
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
