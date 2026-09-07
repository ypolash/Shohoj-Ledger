"use client";

import React, { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

interface TaskItem {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
}

export function TasksWidget({ data }: { data?: any }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    if (data?.recentTasks) {
      setTasks(
        data.recentTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status || 'PENDING',
          dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
          priority: t.priority || 'MEDIUM',
          completed: t.status === 'COMPLETED'
        }))
      );
    }
  }, [data]);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const getPriorityStyle = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === 'HIGH' || p === 'URGENT') {
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (p === 'MEDIUM') {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  };

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className={styles.panelTitle}>
            <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }}>
              task_alt
            </span>
            Operational Tasks
          </h3>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              padding: '2px 8px',
              borderRadius: '10px'
            }}
          >
            {tasks.filter(t => !t.completed).length} pending
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.length > 0 ? (
          tasks.map(t => {
            const pStyle = getPriorityStyle(t.priority || 'MEDIUM');
            return (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: t.completed ? 'rgba(15, 23, 42, 0.3)' : 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: t.completed ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: t.completed ? '1px solid #10b981' : '1px solid #64748b',
                      background: t.completed ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {t.completed && (
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ffffff' }}>
                        check
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: t.completed ? '#64748b' : '#f8fafc',
                        textDecoration: t.completed ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.title}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Due: {t.dueDate}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 7px',
                    borderRadius: '6px',
                    background: pStyle.bg,
                    color: pStyle.color,
                    border: `1px solid ${pStyle.border}`,
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                >
                  {t.priority}
                </span>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState} style={{ padding: '24px 12px' }}>
            <span className={`material-symbols-outlined ${styles.emptyStateIcon}`} style={{ fontSize: '32px' }}>
              done_all
            </span>
            <span className={styles.emptyStateText} style={{ fontSize: '12px' }}>
              All operational tasks are up to date!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
