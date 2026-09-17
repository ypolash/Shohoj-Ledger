"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";
import { fetchMyTasks, updateMyTaskStatus, toggleMyTaskChecklistItem } from './actions';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

function extractChecklistItems(checklist: any): ChecklistItem[] {
  if (!checklist) return [];
  let parsed = checklist;
  if (typeof checklist === "string") {
    try {
      parsed = JSON.parse(checklist);
    } catch {
      return [];
    }
  }
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.items)) return parsed.items;
  if (Array.isArray(parsed?.todos)) return parsed.todos;
  return [];
}

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

  const handleToggleChecklistItem = async (taskId: string, itemId: string, currentlyCompleted: boolean) => {
    const newCompleted = !currentlyCompleted;

    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const items = extractChecklistItems(t.checklist);
      const updatedItems = items.map(item => item.id === itemId ? { ...item, completed: newCompleted } : item);
      const newChecklist = Array.isArray(t.checklist)
        ? updatedItems
        : { ...(typeof t.checklist === 'object' ? t.checklist : {}), items: updatedItems };
      return { ...t, checklist: newChecklist };
    }));

    try {
      await toggleMyTaskChecklistItem(taskId, itemId, newCompleted);
    } catch (err: any) {
      console.error("Failed to toggle checklist item:", err);
      await loadData();
    }
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High' || priority === 'Urgent') return 'var(--danger, #ef4444)';
    if (priority === 'Medium') return 'var(--warning, #f59e0b)';
    return 'var(--success, #10b981)';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: 'var(--spacing-6, 24px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>My Assigned Tasks</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Complete assigned duties and check off to-do checklist items.
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>You have no assigned tasks.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {tasks.map(task => {
              const checklistItems = extractChecklistItems(task.checklist);
              const hasChecklist = checklistItems.length > 0;
              const completedCount = checklistItems.filter(i => i.completed).length;
              const percent = hasChecklist ? Math.round((completedCount / checklistItems.length) * 100) : 0;

              return (
                <div key={task.id} style={{ 
                  background: task.isSpecialTask 
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 50%, rgba(15, 23, 42, 0.95) 100%)' 
                    : 'var(--surface-card, #ffffff)', 
                  border: task.isSpecialTask ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid var(--border-main, #e2e8f0)', 
                  borderRadius: '16px', 
                  padding: '20px',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '14px',
                  boxShadow: task.isSpecialTask ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '0 2px 8px -2px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}>
                  {task.isSpecialTask && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(245, 158, 11, 0.22)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#fbbf24'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f59e0b' }}>star</span>
                        SPECIAL BOUNTY TASK
                      </span>
                      <span style={{ color: '#34d399', fontWeight: 800 }}>
                        ৳{Number(task.rewardAmount || 0).toLocaleString()} ({task.points} pts)
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: task.isSpecialTask ? '#f8fafc' : 'var(--text-main, #0f172a)', wordBreak: 'break-word' }}>
                      {task.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <span style={{ 
                        fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600',
                        color: getPriorityColor(task.priority),
                        background: `color-mix(in srgb, ${getPriorityColor(task.priority)} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${getPriorityColor(task.priority)} 30%, transparent)`
                      }}>
                        {task.priority}
                      </span>
                      {hasChecklist && (
                        <span style={{ 
                          fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: '600',
                          color: '#2563eb',
                          background: 'rgba(37, 99, 235, 0.1)',
                          border: '1px solid rgba(37, 99, 235, 0.2)'
                        }}>
                          Checklist
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p style={{ margin: 0, fontSize: '13.5px', color: task.isSpecialTask ? '#cbd5e1' : 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
                      {task.description}
                    </p>
                  )}

                  {/* Checklist Section */}
                  {hasChecklist && (
                    <div style={{
                      background: 'var(--surface-bg, #f8fafc)',
                      border: '1px solid var(--border-main, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-secondary, #475569)' }}>To-Do Progress</span>
                        <span style={{ color: 'var(--text-main, #0f172a)' }}>{completedCount} / {checklistItems.length} ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-main, #e2e8f0)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        {checklistItems.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleChecklistItem(task.id, item.id, item.completed)}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '5px 6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '5px',
                              border: item.completed ? '1.5px solid #10b981' : '1.5px solid #94a3b8',
                              background: item.completed ? '#10b981' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                              color: '#ffffff',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.15s ease'
                            }}>
                              {item.completed && "✓"}
                            </div>
                            <span style={{
                              fontSize: '13px',
                              color: item.completed ? 'var(--text-muted, #94a3b8)' : 'var(--text-main, #1e293b)',
                              textDecoration: item.completed ? 'line-through' : 'none',
                              lineHeight: 1.4,
                              wordBreak: 'break-word'
                            }}>
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: 'auto', 
                    paddingTop: '12px', 
                    borderTop: '1px solid var(--border-main, #e2e8f0)',
                    gap: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                    </div>
                    <select 
                      style={{ 
                        width: 'auto', 
                        padding: '5px 10px', 
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid var(--border-main, #cbd5e1)',
                        background: 'var(--surface-bg, #f8fafc)',
                        color: 'var(--text-main, #0f172a)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
