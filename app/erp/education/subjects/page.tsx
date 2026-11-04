"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
  creditHours: number | null;
  description: string | null;
  status: string;
  createdAt: string;
}

interface AcademicDepartment {
  id: string;
  name: string;
  code: string | null;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    department: "Computer Science",
    creditHours: "3",
    description: "",
    status: "ACTIVE",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, deptRes] = await Promise.all([
        fetch("/api/education/subjects").catch(() => null),
        fetch("/api/education/departments").catch(() => null),
      ]);

      if (subRes && subRes.ok) {
        const json = await subRes.json();
        if (json.success) setSubjects(json.data || []);
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

  const deptsList = useMemo(() => {
    if (departments.length > 0) return departments.map((d) => d.name);
    const set = new Set(subjects.map((s) => s.department).filter(Boolean));
    return Array.from(set) as string[];
  }, [departments, subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        s.code.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q));

      const matchesDept = selectedDept === "ALL" || s.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [subjects, search, selectedDept]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/education/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Subject "${form.name}" added successfully!`);
        setShowModal(false);
        setForm({
          code: "",
          name: "",
          department: departments[0]?.name || "Computer Science",
          creditHours: "3",
          description: "",
          status: "ACTIVE",
        });
        fetchData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to create subject");
      }
    } catch {
      setError("Network error adding subject");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      const res = await fetch(`/api/education/subjects?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Subject "${name}" deleted.`);
        fetchData();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalCredits = subjects.reduce((sum, s) => sum + (s.creditHours || 0), 0);

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Total Curriculum Courses", value: subjects.length, icon: "menu_book", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Academic Departments", value: deptsList.length, icon: "corporate_fare", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Total Credit Hours", value: totalCredits, icon: "school", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          { label: "Active Syllabi", value: subjects.filter((s) => s.status === "ACTIVE").length, icon: "verified", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
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

      {/* Standard Controls Bar */}
      <div className={styles.controlsCard}>
        <div className={styles.controlsGroup}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
            <input
              type="text"
              placeholder="Search by subject code, title, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Academic Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Departments</option>
            {deptsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Add Subject Button */}
        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className={styles.btnPrimary}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add
          </span>
          Add Curriculum Subject
        </button>
      </div>

      {/* Subjects Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Course Code</th>
                <th className={styles.th}>Subject Title</th>
                <th className={styles.th}>Academic Department</th>
                <th className={styles.th}>Credit Weight</th>
                <th className={styles.th}>Syllabus Description</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading academic subjects...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No curriculum subjects found. Click &quot;Add Curriculum Subject&quot; to define a subject.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s) => (
                  <tr key={s.id} className={styles.tr}>
                    {/* Code */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`} style={{ fontWeight: 700, color: "var(--primary)" }}>
                        {s.code}
                      </span>
                    </td>

                    {/* Title */}
                    <td className={styles.td} style={{ fontWeight: 700, color: "var(--text-main)" }}>
                      {s.name}
                    </td>

                    {/* Department */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                        {s.department || "General Curriculum"}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className={styles.td} style={{ color: "var(--text-main)", fontWeight: 600 }}>
                      {s.creditHours || 3} Credits
                    </td>

                    {/* Description */}
                    <td className={styles.td} style={{ color: "var(--text-muted)", fontSize: "12px", maxWidth: "260px" }}>
                      {s.description || "Core syllabus modules & examinations"}
                    </td>

                    {/* Status */}
                    <td className={styles.td}>
                      <span
                        className={`${styles.pillBadge} ${
                          s.status === "ACTIVE" ? styles.pillBadgeSuccess : styles.pillBadgeWarning
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className={styles.btnDelete}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>
                  menu_book
                </span>
                <h3 className={styles.modalTitle}>
                  Add Curriculum Subject
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Course / Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-101, PHY-201"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Subject Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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

                <div>
                  <label className={styles.formLabel}>
                    Credit Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.creditHours}
                    onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Syllabus / Course Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline core themes, modules, or prerequisites..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={styles.formInput}
                  style={{ resize: "vertical" }}
                />
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
                  {submitting ? "Adding..." : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
