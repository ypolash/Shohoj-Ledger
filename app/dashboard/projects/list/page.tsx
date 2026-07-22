"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProjectListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [search, statusFilter]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects?search=${search}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return 'var(--primary)';
      case 'Completed': return 'var(--success)';
      case 'Delayed': return 'var(--danger)';
      case 'On Hold': return 'var(--warning)';
      case 'Draft': return 'var(--text-muted)';
      default: return 'var(--text)';
    }
  };

  return (
    <div className="animate-fade-in container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>All Projects</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Manage and monitor your enterprise projects.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => alert('New Project creation modal would open here. (Simplified for demo)')}>
            <span className="material-symbols-outlined">add</span>
            New Project
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "var(--spacing-6)", display: "flex", gap: "12px" }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Search projects..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px' }}>Code</th>
              <th style={{ padding: '12px' }}>Project Name</th>
              <th style={{ padding: '12px' }}>Client</th>
              <th style={{ padding: '12px' }}>Progress</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Manager</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>Loading projects...</td></tr>
            ) : projects.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No projects found.</td></tr>
            ) : (
              projects.map(project => (
                <tr 
                  key={project.id} 
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="hover-row"
                >
                  <td style={{ padding: '12px', fontWeight: 500 }}>{project.projectCode}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{project.name}</td>
                  <td style={{ padding: '12px' }}>{project.clientName || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--background-alt)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${project.progress || 0}%`, height: '100%', backgroundColor: getStatusColor(project.status) }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{project.progress || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: 'var(--background-alt)', 
                      color: getStatusColor(project.status),
                      border: `1px solid ${getStatusColor(project.status)}`,
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 
                    }}>
                      {project.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Unassigned'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
