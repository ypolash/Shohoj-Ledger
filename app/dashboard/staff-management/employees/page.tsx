"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Employee = {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string;
  department: string | null;
  status: string;
  basicSalary: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', basicSalary: '', joinDate: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to load employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEmployee,
          basicSalary: parseFloat(newEmployee.basicSalary)
        })
      });
      
      if (res.ok) {
        const added = await res.json();
        setEmployees([added, ...employees]);
        setIsModalOpen(false);
        setNewEmployee({ firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', basicSalary: '', joinDate: '' });
      } else {
        alert("Failed to add employee. Please check required fields.");
      }
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const getInitials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Employees</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Manage staff profiles and base salaries.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading employees...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          {employees.map((emp) => (
            <div key={emp.id} className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', fontWeight: 'bold', color: '#fff'
                }}>
                  {getInitials(emp.firstName, emp.lastName)}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{emp.firstName} {emp.lastName}</h3>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{emp.employeeId}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(59,130,246,0.1)', borderRadius: '99px', fontSize: '12px', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}>
                  {emp.designation} {emp.department && `• ${emp.department}`}
                </span>
              </div>
              
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Basic Salary</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>৳ {Number(emp.basicSalary).toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Status</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: emp.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>{emp.status}</span>
                </div>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
              No employees found. Add one to get started.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50,
          paddingTop: '15vh'
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Add New Employee</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>First Name *</label>
                  <input type="text" className="input" value={newEmployee.firstName} onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Last Name *</label>
                  <input type="text" className="input" value={newEmployee.lastName} onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Email *</label>
                  <input type="email" className="input" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Phone</label>
                  <input type="text" className="input" value={newEmployee.phone} onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Designation *</label>
                  <input type="text" className="input" value={newEmployee.designation} onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Department</label>
                  <input type="text" className="input" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Basic Salary (BDT) *</label>
                  <input type="number" step="0.01" className="input" value={newEmployee.basicSalary} onChange={(e) => setNewEmployee({...newEmployee, basicSalary: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Join Date *</label>
                  <input type="date" className="input" value={newEmployee.joinDate} onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
