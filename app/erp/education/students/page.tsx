"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  className: string | null;
  schoolOrCollege: string | null;
  status: string;
  admissionDate: string | null;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    studentId: "",
    schoolOrCollege: "Shohoj International School & College",
    email: "",
    phone: "",
    gender: "Male",
    guardianName: "",
    guardianPhone: "",
    className: "Grade 10",
    status: "ACTIVE",
    admissionDate: new Date().toISOString().split("T")[0],
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/education/students");
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const classesList = useMemo(() => {
    const set = new Set(students.map((s) => s.className).filter(Boolean));
    return Array.from(set) as string[];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(search)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.schoolOrCollege && s.schoolOrCollege.toLowerCase().includes(q));

      const matchesClass = selectedClass === "ALL" || s.className === selectedClass;
      const matchesStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, search, selectedClass, selectedStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/education/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess("Student enrolled successfully!");
        setShowModal(false);
        setForm({
          name: "",
          studentId: "",
          schoolOrCollege: "Shohoj International School & College",
          email: "",
          phone: "",
          gender: "Male",
          guardianName: "",
          guardianPhone: "",
          className: "Grade 10",
          status: "ACTIVE",
          admissionDate: new Date().toISOString().split("T")[0],
        });
        fetchStudents();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to create student");
      }
    } catch {
      setError("Network error enrolling student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      const res = await fetch(`/api/education/students?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Student "${name}" deleted.`);
        fetchStudents();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const activeCount = students.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Total Students", value: students.length, icon: "groups", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Active Enrolled", value: activeCount, icon: "how_to_reg", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Class Sections", value: classesList.length, icon: "co_present", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          { label: "Inactive / On-Hold", value: students.length - activeCount, icon: "pause_circle", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
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
              placeholder="Search by student name, roll ID, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Classes</option>
            {classesList.map((c) => (
              <option key={c} value={c}>
                {c}
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
            <option value="GRADUATED">Graduated</option>
          </select>
        </div>

        {/* Enroll Button */}
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
          Enroll New Student
        </button>
      </div>

      {/* Students Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Student Roll &amp; Name</th>
                <th className={styles.th}>School / College</th>
                <th className={styles.th}>Class / Grade</th>
                <th className={styles.th}>Contact Details</th>
                <th className={styles.th}>Guardian Info</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading student records...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No student records found. Click &quot;Enroll New Student&quot; to register a student.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className={styles.tr}>
                    {/* Name & ID */}
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className={styles.avatar}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                            Roll: {s.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* School / College Name */}
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>
                          domain
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {s.schoolOrCollege || "Shohoj Model College"}
                        </span>
                      </div>
                    </td>

                    {/* Class / Grade */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                        {s.className || "Unassigned"}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className={styles.td}>
                      <div style={{ color: "var(--text-main)" }}>{s.phone || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {s.email || "No email"}
                      </div>
                    </td>

                    {/* Guardian */}
                    <td className={styles.td}>
                      <div style={{ color: "var(--text-main)" }}>{s.guardianName || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                        {s.guardianPhone || "No contact"}
                      </div>
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

      {/* Enrollment Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>
                  school
                </span>
                <h3 className={styles.modalTitle}>
                  Enroll New Student
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className={styles.modalCloseBtn}>
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {/* School or College Name */}
              <div>
                <label className={styles.formLabel}>
                  School or College Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhaka Residential Model College, City College"
                  value={form.schoolOrCollege}
                  onChange={(e) => setForm({ ...form, schoolOrCollege: e.target.value })}
                  className={styles.formInput}
                />
              </div>

              {/* Name & Roll ID */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariqul Islam"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Student ID (Roll No)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Class / Grade & Gender */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Class / Grade Section *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10 - Science"
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className={styles.formInput}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Contact Phone & Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Student Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1712-000000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Student Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. student@academy.edu"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Guardian Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Guardian / Parent Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Rafiqul Islam"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Guardian Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1812-999999"
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
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
                  {submitting ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
