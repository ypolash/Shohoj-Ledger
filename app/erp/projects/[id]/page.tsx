"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15/16: params is a Promise — unwrap it with React.use()
  const { id: projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<{ status: number; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "KANBAN" | "TIMELINE">("OVERVIEW");
  const [isEditingActualCost, setIsEditingActualCost] = useState(false);
  const [actualCostInput, setActualCostInput] = useState<string>("");

  // Kanban State
  const TASK_STAGES = ["To Do", "In Progress", "Review", "Testing", "Completed"];

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
      } else {
        console.error(`[ProjectWorkspace] API Error ${res.status}:`, data);
        setApiError({ status: res.status, message: data.error || data.message || `HTTP ${res.status}` });
      }
    } catch (e) {
      console.error('[ProjectWorkspace] Network error:', e);
      setApiError({ status: 0, message: 'Network error. Check console.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateActualCost = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualCost: Number(actualCostInput) })
      });
      if (res.ok) {
        setIsEditingActualCost(false);
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic Update
    setProject((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t)
    }));
    
    try {
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.error("Failed to update task", e);
      fetchProject(); // Revert
    }
  };

  // Drag and Drop
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  if (isLoading) return <div className="animate-fade-in" style={{ textAlign: "center", padding: "60px", color: 'var(--text-muted)' }}><span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '8px' }}>autorenew</span>Loading Workspace...</div>;
  if (!project) return (
    <div className="animate-fade-in" style={{ textAlign: "center", padding: "60px", color: 'var(--text-muted)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4, display: 'block', marginBottom: '12px' }}>folder_off</span>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
        {apiError ? `Error ${apiError.status}: ${apiError.message}` : 'Project not found'}
      </div>
      {apiError && (
        <div style={{ fontSize: '13px', color: 'var(--danger)', background: 'var(--danger-subtle)', border: '1px solid var(--danger)', padding: '10px 18px', borderRadius: '10px', display: 'inline-block', marginBottom: '16px' }}}>
          {apiError.status === 401 && '⚠ Not authenticated — please log in again.'}
          {apiError.status === 403 && '⚠ Permission denied — you may lack VIEW_PROJECTS permission.'}
          {apiError.status === 404 && '⚠ Project ID not found in your company tenant. Check if it belongs to a different company account.'}
          {apiError.status === 500 && '⚠ Internal server error — check server logs.'}
          {apiError.status === 0 && '⚠ Network error — the server may be down.'}
        </div>
      )}
      <div>
        <button className="btn btn-secondary" onClick={() => router.push('/erp/projects/list')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>Back to Projects
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>
              {project.projectCode}
            </span>
            <h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text-main)' }}>{project.name}</h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Client: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{project.clientName || 'Internal'}</span> • Manager: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={project.status} 
            onChange={handleStatusChange}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px', fontWeight: 600, outline: 'none' }}
          >
            {["Draft", "Planning", "Active", "On Hold", "Completed", "Cancelled", "Archived"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => router.push("/erp/projects/list")}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-main)', marginBottom: '8px' }}>
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: 'dashboard' },
          { id: 'KANBAN', label: 'Kanban Board', icon: 'view_kanban' },
          { id: 'TIMELINE', label: 'Activity & Audit', icon: 'history' },
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
            {tab.label}
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-5)' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>Project Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Description</strong><span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{project.description || '—'}</span></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</strong><span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{project.category || '—'}</span></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</strong><span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{project.priority}</span></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>CRM Lead</strong><span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{project.lead ? project.lead.companyName : 'None'}</span></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date</strong><span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</span></div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>End Date</strong><span style={{ fontSize: '14px', color: 'var(--text-main)' }}>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '—'}</span></div>
            </div>

            <h2 style={{ fontSize: '16px', margin: '24px 0 var(--spacing-4) 0', color: 'var(--text-main)' }}>Financials & Progress</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-main)', padding: '16px', borderRadius: '12px' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>account_balance</span>
                  Estimated Budget
                </strong>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)' }}>৳{(project.estimatedBudget || 0).toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-main)', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--danger)' }}>receipt_long</span>
                    Actual Cost
                  </strong>
                  {!isEditingActualCost && (
                    <button onClick={() => { setIsEditingActualCost(true); setActualCostInput(String(project.actualCost || 0)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }} title="Edit Actual Cost">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                    </button>
                  )}
                </div>
                {isEditingActualCost ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input type="number" value={actualCostInput} onChange={e => setActualCostInput(e.target.value)} style={{ width: '100%', maxWidth: '100px', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} />
                    <button onClick={handleUpdateActualCost} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '12px' }}>Save</button>
                    <button onClick={() => setIsEditingActualCost(false)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>৳{(project.actualCost || 0).toLocaleString()}</div>
                )}
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border-main)', padding: '16px', borderRadius: '12px' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--success)' }}>donut_large</span>
                  Overall Progress
                </strong>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)' }}>{project.progress}%</div>
                <div style={{ marginTop: '8px', width: '100%', height: '6px', backgroundColor: 'var(--border-main)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${project.progress}%`, height: '100%', backgroundColor: 'var(--success)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>group</span>
              Team ({project.teamMembers?.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.teamMembers?.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '10px', border: '1px solid var(--border-main)' }}>
                  <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                    {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.designation || 'Member'}</div>
                  </div>
                </div>
              ))}
              {project.teamMembers?.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No team members assigned.</div>}
            </div>
          </div>
        </div>
      )}

      {/* KANBAN TAB */}
      {activeTab === "KANBAN" && (
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', minHeight: '600px' }}>
          {TASK_STAGES.map(status => (
            <div 
              key={status} 
              className="glass-panel"
              style={{ 
                minWidth: '300px', maxWidth: '300px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '16px'
              }}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>{status}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, background: 'var(--surface-hover)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                  {project.tasks?.filter((t: any) => t.status === status).length || 0}
                </span>
              </div>
              
              {project.tasks?.filter((t: any) => t.status === status).map((task: any) => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  style={{ 
                    backgroundColor: 'var(--surface-card)', padding: '14px', borderRadius: '10px',
                    cursor: 'grab', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '10px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-main)'}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{task.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                      {task.employee ? task.employee.firstName : 'Unassigned'}
                    </div>
                    <span style={{ color: 'var(--warning)', fontWeight: 600, background: 'var(--warning-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                      {task.actualHours || 0} / {task.estimatedHours || 0}h
                    </span>
                  </div>
                </div>
              ))}
              
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', borderStyle: 'dashed', borderColor: 'var(--border-main)', background: 'transparent', color: 'var(--text-muted)' }}
                onClick={() => alert('Add Task feature coming soon.')}
              >
                + Add Task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "TIMELINE" && (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px', borderRadius: '16px', width: '100%' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 var(--spacing-5) 0', color: 'var(--text-main)' }}>Audit & Activity Trail</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            {project.activities?.length > 0 && <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border-main)', zIndex: 0 }} />}
            
            {project.activities?.length > 0 ? (
              project.activities.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: act.type.includes('TASK') ? 'var(--warning-subtle)' : 'var(--primary-subtle)', 
                    color: act.type.includes('TASK') ? 'var(--warning)' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {act.type.includes('TASK') ? 'task_alt' : 'folder_open'}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', flex: 1, border: '1px solid var(--border-main)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{act.type.replace(/_/g, " ")}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {act.description}
                    </div>
                    {(act.oldValue || act.newValue) && (
                      <div style={{ fontSize: '13px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-main)', padding: '8px 12px', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {act.oldValue && <span style={{ textDecoration: 'line-through' }}>{act.oldValue}</span>}
                        {act.oldValue && act.newValue && <span>➔</span>}
                        {act.newValue && <strong style={{ color: 'var(--text-main)' }}>{act.newValue}</strong>}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                      By {act.performedBy?.name || 'System'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ paddingLeft: '20px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.3, display: 'block', marginBottom: '8px' }}>history</span>
                No activities recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
