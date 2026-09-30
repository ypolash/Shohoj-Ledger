"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../projects.module.css';
import { 
  PROJECT_PRESETS, 
  ProjectPresetId, 
  getPresetById 
} from "@/lib/projects/projectPresets";

interface Employee { id: string; firstName: string; lastName: string; }

interface RoleAssignment {
  id: string;
  role: 'Employee' | 'Freelancer' | 'Talent' | 'Custom';
  customRoleName?: string;
  employeeType: 'permanent' | 'temporary';
  managerId: string;
  temporaryEmployeeName: string;
  freelancerName: string;
  talentName: string;
  notes: string;
  showAddChoice?: boolean;
}

export default function ProjectListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [defaultCompanyPreset, setDefaultCompanyPreset] = useState<ProjectPresetId>("video_agency");
  const [selectedPresetId, setSelectedPresetId] = useState<ProjectPresetId>("video_agency");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const createDefaultRole = (): RoleAssignment => ({
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    role: 'Employee',
    customRoleName: '',
    employeeType: 'permanent',
    managerId: '',
    temporaryEmployeeName: '',
    freelancerName: '',
    talentName: '',
    notes: '',
    showAddChoice: false,
  });

  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([createDefaultRole()]);

  const handleAddRole = () => {
    setRoleAssignments(prev => [...prev, createDefaultRole()]);
  };

  const handleRemoveRole = (id: string) => {
    setRoleAssignments(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(r => r.id !== id);
    });
  };

  const handleUpdateRole = (id: string, updates: Partial<RoleAssignment>) => {
    setRoleAssignments(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const [form, setForm] = useState({
    name: '', projectCode: '', clientName: '', clientPhone: '', priority: 'Medium',
    startDate: '', endDate: '', expectedProductionDate: '', expectedDeliveryDate: '', estimatedBudget: '', description: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchCompanyPreset();
  }, [search, statusFilter]);

  const fetchCompanyPreset = async () => {
    try {
      const res = await fetch('/api/settings/project-presets');
      const json = await res.json();
      if (json.success && json.defaultPreset) {
        setDefaultCompanyPreset(json.defaultPreset);
        setSelectedPresetId(json.defaultPreset);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter === 'ALL' ? '' : statusFilter;
      const res = await fetch(`/api/projects?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusParam)}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/employees`);
      if (res.ok) setEmployees(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleForm = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const activePresetDef = getPresetById(selectedPresetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      const assignmentLines: string[] = [];
      let validManagerId: string | undefined = undefined;
      const teamMemberIds: string[] = [];
      const projectTags: string[] = [`Preset:${selectedPresetId}`];

      roleAssignments.forEach((ra, idx) => {
        const rolePrefix = roleAssignments.length > 1 ? `Role #${idx + 1}` : 'Role';
        if (ra.role === 'Employee') {
          if (!projectTags.includes('Role:Employee')) projectTags.push('Role:Employee');
          if (ra.employeeType === 'temporary') {
            if (!projectTags.includes('Temp-Employee')) projectTags.push('Temp-Employee');
            const tempName = ra.temporaryEmployeeName.trim() || 'Temporary Staff';
            assignmentLines.push(`• ${rolePrefix}: Employee (Temporary: ${tempName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
          } else {
            if (ra.managerId?.trim()) {
              const empId = ra.managerId.trim();
              if (!validManagerId) validManagerId = empId;
              if (!teamMemberIds.includes(empId)) teamMemberIds.push(empId);
              const emp = employees.find(e => e.id === empId);
              const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Assigned Employee';
              assignmentLines.push(`• ${rolePrefix}: Employee (${empName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
            }
          }
        } else if (ra.role === 'Freelancer') {
          if (!projectTags.includes('Role:Freelancer')) projectTags.push('Role:Freelancer');
          const fName = ra.freelancerName.trim() || 'Specialist';
          assignmentLines.push(`• ${rolePrefix}: ${activePresetDef.deliverableSchema.primaryRoleTitle} (${fName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        } else if (ra.role === 'Talent') {
          const tRoleName = activePresetDef.deliverableSchema.secondaryRoleTitle;
          if (!projectTags.includes(`Role:${tRoleName}`)) projectTags.push(`Role:${tRoleName}`);
          const mName = ra.talentName.trim() || tRoleName;
          assignmentLines.push(`• ${rolePrefix}: ${tRoleName} (${mName})${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        } else if (ra.role === 'Custom') {
          const cRole = ra.customRoleName?.trim() || 'Custom Role';
          if (!projectTags.includes(`Role:${cRole}`)) projectTags.push(`Role:${cRole}`);
          assignmentLines.push(`• ${rolePrefix}: ${cRole}${ra.notes.trim() ? ` - Notes: ${ra.notes.trim()}` : ''}`);
        }
      });

      let finalDescription = form.description.trim();
      if (assignmentLines.length > 0) {
        const assignmentBlock = `[Resource & Team Assignment]\n${assignmentLines.join('\n')}`;
        finalDescription = finalDescription ? `${finalDescription}\n\n${assignmentBlock}` : assignmentBlock;
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          projectCode: form.projectCode.trim(),
          presetId: selectedPresetId,
          clientName: form.clientName.trim() || undefined,
          clientPhone: form.clientPhone.trim() || undefined,
          priority: form.priority,
          managerId: validManagerId,
          teamMemberIds: teamMemberIds.length > 0 ? teamMemberIds : undefined,
          tags: projectTags,
          startDate: form.startDate ? form.startDate : undefined,
          endDate: form.endDate ? form.endDate : undefined,
          expectedShootingDate: form.expectedProductionDate ? form.expectedProductionDate : undefined,
          expectedEditingDate: form.expectedDeliveryDate ? form.expectedDeliveryDate : undefined,
          estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : undefined,
          description: finalDescription || undefined
        })
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to create project'); return; }
      setSuccess('Project created successfully!');
      setShowModal(false);
      setForm({ name: '', projectCode: '', clientName: '', clientPhone: '', priority: 'Medium', startDate: '', endDate: '', expectedProductionDate: '', expectedDeliveryDate: '', estimatedBudget: '', description: '' });
      setRoleAssignments([createDefaultRole()]);
      fetchProjects();
      setTimeout(() => setSuccess(''), 4000);
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  };

  const getProjectPresetInfo = (project: any) => {
    let pId: ProjectPresetId = "video_agency";
    if (project.description && project.description.includes("[[WORKFLOW_META_V1:")) {
      try {
        const match = project.description.match(/\[\[WORKFLOW_META_V1:([\s\S]*?)\]\]/);
        if (match) {
          const parsed = JSON.parse(match[1]);
          if (parsed.presetId && PROJECT_PRESETS[parsed.presetId as ProjectPresetId]) {
            pId = parsed.presetId as ProjectPresetId;
          }
        }
      } catch {}
    }
    const def = getPresetById(pId);
    return def;
  };

  return (
    <div className={styles.projectsWrapper}>
      {/* 1. Minimalist Executive Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            All Projects Directory
            <span className={styles.titleBadge}>
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => fetchProjects()}
            disabled={isLoading}
            title="Refresh Projects"
            aria-label="Refresh Projects"
            className={styles.headerIconBtn}
          >
            <span className={`material-symbols-outlined ${isLoading ? styles.spinning : ''}`} style={{ fontSize: '20px' }}>
              refresh
            </span>
          </button>

          <button
            onClick={() => { 
              setSelectedPresetId(defaultCompanyPreset);
              setShowModal(true); 
              setError(''); 
            }}
            className={`${styles.headerIconBtn} ${styles.headerIconBtnPrimary}`}
            title="Create New Project"
            aria-label="Create New Project"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add
            </span>
          </button>
        </div>
      </header>

      {success && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid #10b981', fontSize: '13px', fontWeight: 600 }}>
          ✓ {success}
        </div>
      )}

      {/* 2. Interactive Projects Directory Card */}
      <section className={styles.directoryCard}>
        <div className={styles.directoryControls}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
            <input
              type="text"
              placeholder="Search projects by code, name, client, preset..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterTabs}>
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'Active', label: 'Active' },
              { id: 'Planning', label: 'Planning' },
              { id: 'Completed', label: 'Completed' },
              { id: 'On Hold', label: 'On Hold' },
            ].map(f => (
              <button
                key={f.id}
                className={`${styles.filterTab} ${statusFilter.toLowerCase() === f.id.toLowerCase() ? styles.filterTabActive : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Code</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Project Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Structure / Preset</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Client</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Progress</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Manager</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading project records...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.5, display: 'block', marginBottom: '8px' }}>folder_off</span>
                    No projects found.
                  </td>
                </tr>
              ) : (
                projects.map(project => {
                  const isCompleted = (project.status || '').toLowerCase() === 'completed';
                  const presetDef = getProjectPresetInfo(project);

                  return (
                    <tr 
                      key={project.id} 
                      className={styles.tableRow}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                        {project.projectCode || 'NO-CODE'}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {project.name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: presetDef.bg,
                          color: presetDef.color,
                          border: `1px solid ${presetDef.color}33`,
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{presetDef.icon}</span>
                          <span>{presetDef.name.replace(" & Media Agency", "").replace(" & Software Development", "").replace(" & Ad Agency", "").replace(" & Real Estate", "")}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div>{project.clientName || '—'}</div>
                        {project.clientPhone && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#2563eb' }}>call</span>
                            <span>{project.clientPhone}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--surface-hover)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ width: `${project.progress || 0}%`, height: '100%', backgroundColor: isCompleted ? '#10b981' : '#2563eb', borderRadius: '9999px' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                          color: isCompleted ? '#10b981' : '#2563eb',
                          border: isCompleted ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(37, 99, 235, 0.25)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {project.status || 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/erp/projects/${project.id}`}
                          className={styles.workspaceLink}
                        >
                          Workspace →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Project Modal with 7-Preset Engine */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className={styles.modalContent} style={{ maxWidth: '840px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderTitleGroup}>
                <div className={styles.modalIconBadge}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>account_tree</span>
                </div>
                <div className={styles.modalTitleText}>
                  <h2 className={styles.modalMainTitle}>Create New Project</h2>
                  <p className={styles.modalSubTitle}>Select project structure preset, configure parameters, and assign leadership.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.closeBtn}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', borderRadius: '12px', color: '#ef4444', fontSize: '12px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Project Structure Preset Selector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className={styles.fieldLabel} style={{ marginBottom: 0 }}>
                    Project Structure Preset
                  </label>
                  <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600 }}>
                    ★ Adapts all 7 stages & deliverables
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' }}>
                  {Object.values(PROJECT_PRESETS).map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          border: isSelected ? `1.5px solid ${preset.color}` : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? preset.bg : 'rgba(255,255,255,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: preset.color }}>
                          {preset.icon}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#ffffff' : '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {preset.name.replace(" & Media Agency", "").replace(" & Software Development", "").replace(" & Ad Agency", "").replace(" & Real Estate", "")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preset Stages Pill Preview */}
                <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${activePresetDef.color}33`, padding: '8px 12px', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                    <span key={s} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0' }}>
                      <strong style={{ color: activePresetDef.color }}>{s}.</strong> {activePresetDef.stages[s]?.shortName || activePresetDef.stages[s]?.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>badge</span>
                  Project Identity
                </span>
                <div className={styles.formSectionLine} />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Project Name <span className={styles.requiredStar}>*</span></label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>folder</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Q4 Commercial Campaign / App Redesign"
                      value={form.name}
                      onChange={(e) => handleForm('name', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Project Code</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>tag</span>
                    <input
                      type="text"
                      placeholder="e.g. PRJ-2026-001"
                      value={form.projectCode}
                      onChange={(e) => handleForm('projectCode', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Client / Stakeholder</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>domain</span>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corporation Ltd"
                      value={form.clientName}
                      onChange={(e) => handleForm('clientName', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Client Phone</label>
                  <div className={styles.inputWrapper}>
                    <span className={`material-symbols-outlined ${styles.inputIcon}`}>call</span>
                    <input
                      type="tel"
                      placeholder="e.g. +880 1712-345678"
                      value={form.clientPhone}
                      onChange={(e) => handleForm('clientPhone', e.target.value)}
                      className={styles.fieldInput}
                    />
                  </div>
                </div>
              </div>

              {/* Resource Assignment with dynamic role titles */}
              <div className={styles.formSectionDivider}>
                <span className={styles.formSectionLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>groups</span>
                  Team &amp; Specialist Allocation
                </span>
                <div className={styles.formSectionLine} />
              </div>

              {roleAssignments.map((ra, idx) => (
                <div key={ra.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Role #{idx + 1}</span>
                    {roleAssignments.length > 1 && (
                      <button type="button" onClick={() => handleRemoveRole(ra.id)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                    <select
                      value={ra.role}
                      onChange={(e) => handleUpdateRole(ra.id, { role: e.target.value as any })}
                      className={styles.fieldInput}
                      style={{ padding: '8px' }}
                    >
                      <option value="Employee">Internal Employee / Manager</option>
                      <option value="Freelancer">{activePresetDef.deliverableSchema.primaryRoleTitle}</option>
                      <option value="Talent">{activePresetDef.deliverableSchema.secondaryRoleTitle}</option>
                      <option value="Custom">Custom Role</option>
                    </select>

                    {ra.role === 'Employee' ? (
                      <select
                        value={ra.managerId}
                        onChange={(e) => handleUpdateRole(ra.id, { managerId: e.target.value })}
                        className={styles.fieldInput}
                        style={{ padding: '8px' }}
                      >
                        <option value="">-- Select Employee --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                        ))}
                      </select>
                    ) : ra.role === 'Freelancer' ? (
                      <input
                        type="text"
                        placeholder={`Name of ${activePresetDef.deliverableSchema.primaryRoleTitle}`}
                        value={ra.freelancerName}
                        onChange={(e) => handleUpdateRole(ra.id, { freelancerName: e.target.value })}
                        className={styles.fieldInput}
                        style={{ padding: '8px' }}
                      />
                    ) : ra.role === 'Talent' ? (
                      <input
                        type="text"
                        placeholder={`Name of ${activePresetDef.deliverableSchema.secondaryRoleTitle}`}
                        value={ra.talentName}
                        onChange={(e) => handleUpdateRole(ra.id, { talentName: e.target.value })}
                        className={styles.fieldInput}
                        style={{ padding: '8px' }}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Custom Role Name"
                        value={ra.customRoleName}
                        onChange={(e) => handleUpdateRole(ra.id, { customRoleName: e.target.value })}
                        className={styles.fieldInput}
                        style={{ padding: '8px' }}
                      />
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddRole}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Another Resource / Role
              </button>

              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                  {submitting ? 'Creating Project...' : 'Launch Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
