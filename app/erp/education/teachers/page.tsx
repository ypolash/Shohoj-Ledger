"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  salary: number;
  compensationType: string | null;
  projectRate: number | null;
  status: string;
  joiningDate: string | null;
  createdAt: string;
}

interface AcademicDepartment {
  id: string;
  name: string;
  code: string | null;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedModel, setSelectedModel] = useState("ALL"); // ALL, SALARY, PROJECT
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    teacherId: "",
    designation: "Lecturer",
    department: "Computer Science",
    email: "",
    phone: "",
    compensationType: "SALARY",
    salary: "45000",
    projectRate: "25000",
    status: "ACTIVE",
    joiningDate: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teachRes, deptRes] = await Promise.all([
        fetch("/api/education/teachers").catch(() => null),
        fetch("/api/education/departments").catch(() => null),
      ]);

      if (teachRes && teachRes.ok) {
        const json = await teachRes.json();
        if (json.success) setTeachers(json.data || []);
      }

      if (deptRes && deptRes.ok) {
        const dJson = await deptRes.json();
        if (dJson.success) setDepartments(dJson.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        t.name.toLowerCase().includes(q) ||
        t.teacherId.toLowerCase().includes(q) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.designation && t.designation.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(search));

      const matchesDept =
        selectedDept === "ALL" || t.department === selectedDept;

      const matchesModel =
        selectedModel === "ALL" ||
        (t.compensationType || "SALARY") === selectedModel;

      const matchesStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;

      return matchesSearch && matchesDept && matchesModel && matchesStatus;
    });
  }, [teachers, search, selectedDept, selectedModel, selectedStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/education/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Faculty member "${form.name}" registered successfully!`);
        setShowModal(false);
        setForm({
          name: "",
          teacherId: "",
          designation: "Lecturer",
          department: departments[0]?.name || "Computer Science",
          email: "",
          phone: "",
          compensationType: "SALARY",
          salary: "45000",
          projectRate: "25000",
          status: "ACTIVE",
          joiningDate: new Date().toISOString().split("T")[0],
        });
        fetchData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to register teacher");
      }
    } catch {
      setError("Network error registering teacher");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove teacher "${name}"?`)) return;
    try {
      const res = await fetch(`/api/education/teachers?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Teacher "${name}" deleted.`);
        fetchData();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const salaryCount = teachers.filter((t) => (t.compensationType || "SALARY") === "SALARY").length;
  const projectCount = teachers.filter((t) => t.compensationType === "PROJECT").length;

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Total Faculty", value: teachers.length, icon: "group", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Salary Based Teachers", value: salaryCount, icon: "payments", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Project Based Teachers", value: projectCount, icon: "assignment", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          { label: "Academic Departments", value: departments.length, icon: "corporate_fare", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
        ].map((card, i) => (
          <div key={i} className={styles.kpiCard}>
            <div>
              <div className={styles.kpiLabel}>{card.label}</div>
              <div className={styles.kpiValue}>{card.value}</div>
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

      {/* Controls Bar: Search, Compensation Filter & Register Button */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsGroup}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
            <input
              type="text"
              placeholder="Search faculty name, ID, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Salary vs Project Based Segmented Filter */}
          <div className={styles.buttonGroup}>
            {[
              { key: "ALL", label: "All Types" },
              { key: "SALARY", label: "Salary Based" },
              { key: "PROJECT", label: "Project Based" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedModel(item.key)}
                className={`${styles.buttonGroupItem} ${
                  selectedModel === item.key ? styles.buttonGroupItemActive : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Academic Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Register Teacher Button */}
        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className={styles.btnPrimary}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            person_add
          </span>
          Register Faculty Member
        </button>
      </div>

      {/* Teachers Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Faculty Member</th>
                <th className={styles.th}>Designation</th>
                <th className={styles.th}>Academic Department</th>
                <th className={styles.th}>Compensation Model</th>
                <th className={styles.th}>Remuneration (BDT)</th>
                <th className={styles.th}>Contact</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading faculty records...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No faculty records found. Click &quot;Register Faculty Member&quot; to add a teacher.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isProject = t.compensationType === "PROJECT";
                  return (
                    <tr key={t.id} className={styles.tr}>
                      {/* Faculty Name & ID */}
                      <td className={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div className={styles.avatar}>
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                              ID: {t.teacherId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className={styles.td} style={{ color: "var(--text-main)" }}>
                        {t.designation || "Faculty Instructor"}
                      </td>

                      {/* Department */}
                      <td className={styles.td}>
                        <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                          {t.department || "General Academy"}
                        </span>
                      </td>

                      {/* Compensation Model Badge */}
                      <td className={styles.td}>
                        <span
                          className={`${styles.pillBadge} ${
                            isProject ? styles.pillBadgeWarning : styles.pillBadgeSuccess
                          }`}
                        >
                          {isProject ? "Project Rate" : "Monthly Salary"}
                        </span>
                      </td>

                      {/* Remuneration */}
                      <td className={styles.td}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontVariantNumeric: "tabular-nums" }}>
                          ৳ {isProject ? Number(t.projectRate || 0).toLocaleString() : Number(t.salary || 0).toLocaleString()}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {isProject ? "Per Curriculum / Course" : "Per Month Fixed"}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className={styles.td}>
                        <div style={{ color: "var(--text-main)" }}>{t.phone || "—"}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {t.email || "No email"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        <span
                          className={`${styles.pillBadge} ${
                            t.status === "ACTIVE" ? styles.pillBadgeSuccess : styles.pillBadgeNeutral
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          className={styles.btnDelete}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Faculty Member Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>
                  group
                </span>
                <h3 className={styles.modalTitle}>
                  Register Faculty Member
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {/* Name & Teacher ID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Teacher Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Mahbubur Rahman"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Teacher ID / Staff Code
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Designation & Department */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Professor / Senior Lecturer"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Academic Department
                  </label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className={styles.formInput}
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Business Administration">Business Administration</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Compensation Model Choice */}
              <div>
                <label className={styles.formLabel}>
                  Compensation Model *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, compensationType: "SALARY" })}
                    className={`${styles.buttonGroupItem} ${
                      form.compensationType === "SALARY" ? styles.buttonGroupItemActive : ""
                    }`}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "0px",
                      border: "1px solid var(--border-main)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                    Salary Based
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, compensationType: "PROJECT" })}
                    className={`${styles.buttonGroupItem} ${
                      form.compensationType === "PROJECT" ? styles.buttonGroupItemActive : ""
                    }`}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "0px",
                      border: "1px solid var(--border-main)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>assignment</span>
                    Project / Course Based
                  </button>
                </div>
              </div>

              {/* Salary or Project Rate Amount */}
              {form.compensationType === "SALARY" ? (
                <div>
                  <label className={styles.formLabel}>
                    Monthly Salary (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              ) : (
                <div>
                  <label className={styles.formLabel}>
                    Project / Course Honorarium (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 30000"
                    value={form.projectRate}
                    onChange={(e) => setForm({ ...form, projectRate: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              )}

              {/* Phone & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1712-345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. teacher@academy.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.btnPrimary}
                >
                  {submitting ? "Registering..." : "Register Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
