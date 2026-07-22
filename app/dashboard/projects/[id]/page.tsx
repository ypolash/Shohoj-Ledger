"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "KANBAN" | "TIMELINE">("KANBAN");

  // Kanban State
  const TASK_STAGES = ["To Do", "In Progress", "Review", "Testing", "Completed"];

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
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

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic Update
    setProject((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t)
    }));
    
    try {
      await fetch(`/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      // Optionally fetchProject() to sync audit logs
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

  if (isLoading) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Loading Workspace...</div>;
  if (!project) return <div className="container" style={{ textAlign: "center", padding: "40px" }}>Project not found</div>;

  return (
    <div className="animate-fade-in container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: "var(--spacing-6)" }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              {project.projectCode}
            </span>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{project.name}</h1>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            Client: {project.clientName || 'Internal'} • Manager: {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'None'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            className="input" 
            value={project.status} 
            onChange={handleStatusChange}
            style={{ fontWeight: "bold", width: "auto" }}
          >
            {["Draft", "Planning", "Active", "On Hold", "Completed", "Cancelled", "Archived"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => router.push("/dashboard/projects/list")}>
            Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: 'var(--spacing-6)' }}>
        {[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'KANBAN', label: 'Kanban Board' },
          { id: 'TIMELINE', label: 'Activity & Audit' },
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 400
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Project Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Description</strong>{project.description || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Category</strong>{project.category || '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Priority</strong>{project.priority}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Start Date</strong>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>End Date</strong>{project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</div>
              <div><strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>CRM Lead</strong>{project.lead ? project.lead.companyName : 'None'}</div>
            </div>

            <h2 style={{ fontSize: '16px', margin: '24px 0 var(--spacing-4) 0' }}>Financials & Progress</h2>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <div style={{ flex: 1, backgroundColor: 'var(--background-alt)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Estimated Budget</strong>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>BDT {project.estimatedBudget || 0}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--background-alt)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Actual Cost</strong>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>BDT {project.actualCost || 0}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: 'var(--background-alt)', padding: '16px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Overall Progress</strong>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success)' }}>{project.progress}%</div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Team Members ({project.teamMembers?.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.teamMembers?.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                    {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{m.firstName} {m.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.designation || 'Member'}</div>
                  </div>
                </div>
              ))}
              {project.teamMembers?.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No team members assigned.</div>}
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
              className="glass-card"
              style={{ 
                minWidth: '300px', maxWidth: '300px', backgroundColor: 'var(--background-alt)', 
                padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px'
              }}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, status)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                <span>{status}</span>
                <span style={{ fontSize: '12px', background: 'var(--border)', padding: '2px 8px', borderRadius: '12px' }}>
                  {project.tasks?.filter((t: any) => t.status === status).length || 0}
                </span>
              </div>
              
              {project.tasks?.filter((t: any) => t.status === status).map((task: any) => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => onDragStart(e, task.id)}
                  style={{ 
                    backgroundColor: 'var(--background)', padding: '12px', borderRadius: '8px',
                    cursor: 'grab', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '14px' }}>{task.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>person</span>
                      {task.employee ? task.employee.firstName : 'Unassigned'}
                    </div>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{task.actualHours || 0} / {task.estimatedHours || 0}h</span>
                  </div>
                </div>
              ))}
              
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', borderStyle: 'dashed', backgroundColor: 'transparent' }}
                onClick={() => alert('Open Create Task modal for ' + status)}
              >
                + Add Task
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === "TIMELINE" && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 var(--spacing-4) 0' }}>Project Audit Logs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', backgroundColor: 'var(--border)', zIndex: 0 }}></div>
            
            {project.activities?.length > 0 ? (
              project.activities.map((act: any) => (
                <div key={act.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    backgroundColor: act.type.includes('TASK') ? 'var(--warning)' : 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {act.type.includes('TASK') ? 'task' : 'folder'}
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--background-alt)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px' }}>{act.type.replace(/_/g, " ")}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '8px' }}>
                      {act.description}
                    </div>
                    {(act.oldValue || act.newValue) && (
                      <div style={{ fontSize: '12px', backgroundColor: 'var(--background)', padding: '6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        {act.oldValue} ➔ <strong>{act.newValue}</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                      {act.performedBy?.name || 'System'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ paddingLeft: '40px', color: 'var(--text-muted)' }}>No activities recorded yet.</div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
