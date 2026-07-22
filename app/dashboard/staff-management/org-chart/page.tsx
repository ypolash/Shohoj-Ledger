"use client";

import React, { useState, useEffect } from 'react';
import styles from "../../income/page.module.css";

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  reportingManagerId: string | null;
  status: string;
};

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

  // Find root employees (no manager, or manager not in the list)
  const rootEmployees = employees.filter(e => !e.reportingManagerId || !employees.some(emp => emp.id === e.reportingManagerId));

  const renderNode = (employee: Employee, level: number = 0) => {
    const directReports = employees.filter(e => e.reportingManagerId === employee.id);
    
    return (
      <div key={employee.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', marginTop: level > 0 ? '24px' : '0' }}>
        
        {/* Connection line from parent */}
        {level > 0 && (
          <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', background: 'var(--border)' }}></div>
        )}

        {/* Node Card */}
        <div className="glass-card" style={{ 
          padding: '16px', borderRadius: '12px', minWidth: '220px', maxWidth: '280px',
          display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10,
          border: '1px solid var(--border)', background: 'var(--surface)'
        }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold', color: '#fff', flexShrink: 0
          }}>
            {getInitials(employee.firstName, employee.lastName)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {employee.firstName} {employee.lastName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {employee.designation}
            </div>
            {employee.department && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{employee.department}</div>
            )}
          </div>
        </div>

        {/* Children */}
        {directReports.length > 0 && (
          <div style={{ display: 'flex', position: 'relative', marginTop: '24px', gap: '32px' }}>
            {/* Top connecting line for children */}
            <div style={{ 
              position: 'absolute', top: '-24px', height: '2px', background: 'var(--border)',
              // The line spans from the center of the first child to the center of the last child
              left: `calc(${100 / directReports.length / 2}% )`, 
              right: `calc(${100 / directReports.length / 2}% )`,
              width: directReports.length > 1 ? 'calc(100% - 220px)' : '0' // Approximation, real org chart drawing is tricky in pure CSS flex
            }}></div>
            
            {/* Parent drop line to the horizontal connector */}
            <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', background: 'var(--border)' }}></div>

            {directReports.map(report => renderNode(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Improved recursive tree renderer with Flexbox
  // Note: CSS-based tree lines are complex, using a simplified nested flex structure.
  
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '64px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Organization Chart</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Visual representation of reporting lines and company structure.</p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading organization chart...</div>
      ) : employees.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No employees found to build organization chart.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'min-content' }}>
            {/* If there are multiple root employees, display them side-by-side */}
            <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start' }}>
              {rootEmployees.map(root => renderNode(root))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
