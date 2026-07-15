"use client";

import React, { useState, useEffect } from 'react';

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
};

type Task = {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  employee: Employee;
  createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newTask, setNewTask] = useState({
    employeeId: '',
    title: '',
    description: '',
    dueDate: '',
    status: 'PENDING'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, empRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees')
      ]);
      
      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.data);
      }
      if (empRes.ok) {
        const eData = await empRes.json();
        setEmployees(eData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTask({ employeeId: '', title: '', description: '', dueDate: '', status: 'PENDING' });
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Failed to assign task: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'An error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Employee Tasks</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Assign and track tasks for your staff.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_task</span>
          Assign Task
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading tasks...</div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Task</th>
                <th style={{ padding: '12px' }}>Assigned To</th>
                <th style={{ padding: '12px' }}>Due Date</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{t.description}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : 'Unknown'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Due Date'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      style={{ 
                        background: `${getStatusColor(t.status)}22`, 
                        color: getStatusColor(t.status),
                        border: `1px solid ${getStatusColor(t.status)}55`,
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                        outline: 'none'
                      }}
                    >
                      <option value="PENDING" style={{ background: '#11151F', color: '#fff' }}>Pending</option>
                      <option value="IN_PROGRESS" style={{ background: '#11151F', color: '#fff' }}>In Progress</option>
                      <option value="COMPLETED" style={{ background: '#11151F', color: '#fff' }}>Completed</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50,
          paddingTop: '8vh'
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Assign Task</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Employee *</label>
                <select 
                  className="input" 
                  value={newTask.employeeId} 
                  onChange={e => setNewTask({...newTask, employeeId: e.target.value})}
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Task Title *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Description</label>
                <textarea 
                  className="input" 
                  rows={3}
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Due Date</label>
                  <input 
                    type="date" 
                    className="input" 
                    value={newTask.dueDate} 
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Status</label>
                  <select 
                    className="input" 
                    value={newTask.status} 
                    onChange={e => setNewTask({...newTask, status: e.target.value})}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: 'rgba(255,255,255,0.05)' }} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
