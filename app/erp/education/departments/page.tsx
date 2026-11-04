"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface AcademicDepartment {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  headOfDepartment: string | null;
  createdAt: string;
}

interface Teacher {
  id: string;
  name: string;
  department: string | null;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<AcademicDepartment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, teachRes, subRes] = await Promise.all([
        fetch("/api/education/departments").catch(() => null),
        fetch("/api/education/teachers").catch(() => null),
        fetch("/api/education/subjects").catch(() => null),
      ]);

      if (deptRes && deptRes.ok) {
        const d = await deptRes.json();
        if (d.success) setDepartments(d.data || []);
      }
      if (teachRes && teachRes.ok) {
        const t = await teachRes.json();
        if (t.success) setTeachers(t.data || []);
      }
      if (subRes && subRes.ok) {
        const s = await subRes.json();
        if (s.success) setSubjects(s.data || []);
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

  const filteredDepts = useMemo(() => {
    return departments.filter((d) => {
      const q = search.toLowerCase();
      return (
        search === "" ||
        d.name.toLowerCase().includes(q) ||
        (d.code && d.code.toLowerCase().includes(q)) ||
        (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    });
  }, [departments, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/education/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Department "${form.name}" created successfully!`);
        setShowModal(false);
        setForm({
          name: "",
          code: "",
          description: "",
          headOfDepartment: "",
        });
        fetchData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to create department");
      }
    } catch {
      setError("Network error creating department");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove Academic Department "${name}"?`)) return;
    try {
      const res = await fetch(`/api/education/departments?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Department "${name}" removed.`);
        fetchData();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalSubjectCount = subjects.length;
  const totalTeacherCount = teachers.length;

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Academic Departments", value: departments.length, icon: "corporate_fare", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Assigned Faculty", value: totalTeacherCount, icon: "group", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Curriculum Courses", value: totalSubjectCount, icon: "menu_book", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          { label: "Department Units", value: `${departments.length} Units`, icon: "domain", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
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
          <div className={styles.searchWrapper}>
            <span className={`material-symbols-outlined ${styles.searchIcon}`}>
              search
            </span>
            <input
              type="text"
              placeholder="Search academic departments by name, code, HOD..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Add Academic Department Button */}
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
          Add Department
        </button>
      </div>

      {/* Departments Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Department Code</th>
                <th className={styles.th}>Department Name</th>
                <th className={styles.th}>Head of Department (Dean / HOD)</th>
                <th className={styles.th}>Faculty Count</th>
                <th className={styles.th}>Course Count</th>
                <th className={styles.th}>Description</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading academic departments...
                  </td>
                </tr>
              ) : filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No academic departments registered. Click &quot;Add Department&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((d) => {
                  const deptFaculty = teachers.filter((t) => t.department === d.name).length;
                  const deptCourses = subjects.filter((s) => s.department === d.name).length;

                  return (
                    <tr key={d.id} className={styles.tr}>
                      {/* Code */}
                      <td className={styles.td}>
                        <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`} style={{ fontWeight: 700, color: "var(--primary)" }}>
                          {d.code || "DEPT"}
                        </span>
                      </td>

                      {/* Name */}
                      <td className={styles.td} style={{ fontWeight: 700, color: "var(--text-main)" }}>
                        {d.name}
                      </td>

                      {/* HOD */}
                      <td className={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>
                            person_pin
                          </span>
                          <span style={{ color: "var(--text-main)", fontWeight: 600 }}>
                            {d.headOfDepartment || "To be appointed"}
                          </span>
                        </div>
                      </td>

                      {/* Faculty count */}
                      <td className={styles.td}>
                        <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                          {deptFaculty} Faculty
                        </span>
                      </td>

                      {/* Course count */}
                      <td className={styles.td}>
                        <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                          {deptCourses} Courses
                        </span>
                      </td>

                      {/* Description */}
                      <td className={styles.td} style={{ color: "var(--text-muted)", fontSize: "12px", maxWidth: "260px" }}>
                        {d.description || "Academic department curriculum division"}
                      </td>

                      {/* Actions */}
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <button
                          onClick={() => handleDelete(d.id, d.name)}
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

      {/* Add Department Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>
                  corporate_fare
                </span>
                <h3 className={styles.modalTitle}>
                  Add Academic Department
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
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE, EEE, BBA, ENG"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Department Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Head of Department (Dean / Director / Lead)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Dr. Harun-Or-Rashid"
                  value={form.headOfDepartment}
                  onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}
                  className={styles.formInput}
                />
              </div>

              <div>
                <label className={styles.formLabel}>
                  Department Overview & Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Academic scope, disciplines, and laboratory faculties..."
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
                  {submitting ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
