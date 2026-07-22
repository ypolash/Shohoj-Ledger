"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyTasks, updateMyTaskStatus } from './actions';

export default function EssTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchMyTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateMyTaskStatus(taskId, newStatus);
      await loadData();
    } catch (err: any) {
      alert("Error updating task: " + err.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High') return 'var(--danger)';
    if (priority === 'Medium') return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-6) 0' }}>My Tasks</h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>You have no assigned tasks.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {tasks.map(task => (
              <div key={task.id} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '12px', 
                padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{task.title}</h3>
                  <span style={{ 
                    fontSize: '12px', padding: '4px 8px', borderRadius: '4px', fontWeight: '500',
                    color: getPriorityColor(task.priority),
                    background: `color-mix(in srgb, ${getPriorityColor(task.priority)} 15%, transparent)`
                  }}>
                    {task.priority} Priority
                  </span>
                </div>
                
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{task.description || "No description provided."}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                  </div>
                  <select 
                    className="input" 
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
