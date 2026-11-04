"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import styles from "../education.module.css";

interface AcademyClass {
  id: string;
  name: string;
  section: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  schedule: string | null;
  room: string | null;
  capacity: number;
  createdAt: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string | null;
}

interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  designation: string | null;
  department: string | null;
  compensationType: string | null;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [selectedTeacher, setSelectedTeacher] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    section: "A",
    subjectCode: "",
    subjectName: "",
    teacherId: "",
    teacherName: "",
    schedule: "Mon, Wed, Fri (09:00 - 10:30 AM)",
    room: "Room 101",
    capacity: "40",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, subRes, teachRes] = await Promise.all([
        fetch("/api/education/classes").catch(() => null),
        fetch("/api/education/subjects").catch(() => null),
        fetch("/api/education/teachers").catch(() => null),
      ]);

      if (classRes && classRes.ok) {
        const c = await classRes.json();
        setClasses(c.data || []);
      }
      if (subRes && subRes.ok) {
        const s = await subRes.json();
        setSubjects(s.data || []);
      }
      if (teachRes && teachRes.ok) {
        const t = await teachRes.json();
        setTeachers(t.data || []);
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

  const handleSelectSubject = (val: string) => {
    if (!val) {
      setForm((prev) => ({ ...prev, subjectCode: "", subjectName: "" }));
      return;
    }
    const found = subjects.find((s) => s.code === val || s.id === val);
    if (found) {
      setForm((prev) => ({
        ...prev,
        subjectCode: found.code,
        subjectName: found.name,
      }));
    }
  };

  const handleSelectTeacher = (val: string) => {
    if (!val) {
      setForm((prev) => ({ ...prev, teacherId: "", teacherName: "" }));
      return;
    }
    const found = teachers.find((t) => t.id === val || t.teacherId === val);
    if (found) {
      setForm((prev) => ({
        ...prev,
        teacherId: found.id,
        teacherName: found.name,
      }));
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(q) ||
        (c.section && c.section.toLowerCase().includes(q)) ||
        (c.teacherName && c.teacherName.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q)) ||
        (c.room && c.room.toLowerCase().includes(q));

      const matchesSubject =
        selectedSubject === "ALL" || c.subjectName === selectedSubject;

      const matchesTeacher =
        selectedTeacher === "ALL" || c.teacherName === selectedTeacher;

      return matchesSearch && matchesSubject && matchesTeacher;
    });
  }, [classes, search, selectedSubject, selectedTeacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/education/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Class "${form.name}" assigned successfully!`);
        setShowModal(false);
        setForm({
          name: "",
          section: "A",
          subjectCode: "",
          subjectName: "",
          teacherId: "",
          teacherName: "",
          schedule: "Mon, Wed, Fri (09:00 - 10:30 AM)",
          room: "Room 101",
          capacity: "40",
        });
        fetchData();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(json.error || "Failed to create class assignment");
      }
    } catch {
      setError("Network error creating class assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete class assignment "${name}"?`)) return;
    try {
      const res = await fetch(`/api/education/classes?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSuccess(`Class "${name}" deleted.`);
        fetchData();
        setTimeout(() => setSuccess(""), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const assignedTeachersCount = new Set(classes.map((c) => c.teacherName).filter(Boolean)).size;
  const subjectsCoveredCount = new Set(classes.map((c) => c.subjectName).filter(Boolean)).size;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);

  return (
    <div className={styles.container}>
      {/* Standard KPI Metric Stat Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: "Total Classes & Sections", value: classes.length, icon: "calendar_month", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" },
          { label: "Assigned Faculty", value: assignedTeachersCount, icon: "how_to_reg", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
          { label: "Subjects Covered", value: subjectsCoveredCount, icon: "menu_book", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.12)" },
          { label: "Total Student Capacity", value: totalCapacity, icon: "group", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
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
              placeholder="Search by class, section, teacher, subject, room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.code ? `[${s.code}] ` : ""}{s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assign Teacher Button */}
        <button
          onClick={() => {
            setError("");
            setShowModal(true);
          }}
          className={styles.btnPrimary}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            add_task
          </span>
          Assign Class &amp; Teacher
        </button>
      </div>

      {/* Classes Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Class / Grade</th>
                <th className={styles.th}>Section</th>
                <th className={styles.th}>Subject Assigned</th>
                <th className={styles.th}>Assigned Teacher</th>
                <th className={styles.th}>Weekly Schedule</th>
                <th className={styles.th}>Room / Hall</th>
                <th className={styles.th}>Capacity</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading class timetables and teacher assignments...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No class assignments found. Click &quot;Assign Class &amp; Teacher&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => (
                  <tr key={c.id} className={styles.tr}>
                    {/* Class Name */}
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className={styles.avatar}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                          {c.name}
                        </div>
                      </div>
                    </td>

                    {/* Section */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                        {c.section || "A"}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className={styles.td}>
                      {c.subjectName ? (
                        <div>
                          {c.subjectCode && (
                            <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`} style={{ fontWeight: 700, color: "var(--primary)", marginRight: "6px" }}>
                              {c.subjectCode}
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {c.subjectName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                      )}
                    </td>

                    {/* Teacher */}
                    <td className={styles.td}>
                      {c.teacherName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#10b981" }}>
                            person
                          </span>
                          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                            {c.teacherName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>
                          ⚠ No Teacher Assigned
                        </span>
                      )}
                    </td>

                    {/* Schedule */}
                    <td className={styles.td} style={{ color: "var(--text-main)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--primary)" }}>
                          schedule
                        </span>
                        {c.schedule || "Not scheduled"}
                      </div>
                    </td>

                    {/* Room */}
                    <td className={styles.td}>
                      <span className={`${styles.pillBadge} ${styles.pillBadgeNeutral}`}>
                        {c.room || "TBD"}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td className={styles.td} style={{ color: "var(--text-main)", fontWeight: 600 }}>
                      {c.capacity} seats
                    </td>

                    {/* Actions */}
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
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

      {/* Assignment Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "var(--primary)" }}>
                  calendar_month
                </span>
                <h3 className={styles.modalTitle}>
                  Assign Teacher to Class &amp; Subject
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
                    Class / Grade Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grade 10, Class 9, HSC 2nd Year"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Section / Batch
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section A, Diamond, Morning"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Select Subject
                  </label>
                  <select
                    value={form.subjectCode}
                    onChange={(e) => handleSelectSubject(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code ? `[${s.code}] ` : ""}{s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Assigned Teacher
                  </label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => handleSelectTeacher(e.target.value)}
                    className={styles.formInput}
                  >
                    <option value="">-- Choose Teacher --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className={styles.formLabel}>
                    Weekly Schedule
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sun, Tue, Thu (10:00 - 11:30 AM)"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className={styles.formInput}
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>
                    Room / Laboratory / Hall
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204, Science Lab 2"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div>
                <label className={styles.formLabel}>
                  Classroom Capacity (Seats)
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className={styles.formInput}
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
                  {submitting ? "Saving..." : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
