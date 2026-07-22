"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from "../../income/page.module.css";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "./actions";

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
  basicSalary: string | number;
  joinDate: string | Date;
  createdAt: string | Date;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Layout State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [filterDesignation, setFilterDesignation] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [newEmployee, setNewEmployee] = useState({
    firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', 
    departmentId: '', designationId: '', reportingManagerId: '', employmentType: '', location: '', shift: '', employmentStatus: 'Probation',
    basicSalary: '', joinDate: '', password: '', status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(data as any[]);
      
      const [deptRes, desigRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/designations')
      ]);
      if(deptRes.ok) setDepartments(await deptRes.json());
      if(desigRes.ok) setDesignations(await desigRes.json());
      
    } catch (error) {
      console.error('Failed to load employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setNewEmployee({ 
      firstName: '', lastName: '', email: '', phone: '', designation: '', department: '', 
      departmentId: '', designationId: '', reportingManagerId: '', employmentType: '', location: '', shift: '', employmentStatus: 'Probation',
      basicSalary: '', joinDate: '', password: '', status: 'ACTIVE' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setIsEditMode(true);
    setNewEmployee({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      designation: emp.designation,
      department: emp.department || '',
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || '',
      reportingManagerId: emp.reportingManagerId || '',
      employmentType: emp.employmentType || '',
      location: emp.location || '',
      shift: emp.shift || '',
      employmentStatus: emp.employmentStatus || 'Probation',
      basicSalary: String(emp.basicSalary),
      joinDate: new Date(emp.joinDate).toISOString().split('T')[0],
      password: '',
      status: emp.status
    });
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...newEmployee,
        basicSalary: parseFloat(newEmployee.basicSalary)
      };

      if (isEditMode && selectedEmployee) {
        await updateEmployee(selectedEmployee.id, payload);
      } else {
        await createEmployee(payload);
      }
      
      await loadData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to save employee.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to terminate this employee?")) return;
    try {
      await deleteEmployee(id);
      await loadData();
      if (selectedEmployee && selectedEmployee.id === id) {
        setSelectedEmployee(null);
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete employee.");
    }
  };

  const getInitials = (f: string, l: string) => `${f ? f[0] : ''}${l ? l[0] : ''}`.toUpperCase();

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  // Derived Metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveEmployees = employees.filter(e => e.status !== 'ACTIVE').length;
  const uniqueDepartments = new Set(employees.map(e => e.department).filter(Boolean)).size;
  const totalMonthlySalary = employees.filter(e => e.status === 'ACTIVE').reduce((sum, e) => sum + Number(e.basicSalary), 0);
  const newEmployeesThisMonth = employees.filter(e => {
    if (!e.joinDate) return false;
    const d = new Date(e.joinDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Filter & Sort Logic
  const allDepartments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
  const allDesignations = Array.from(new Set(employees.map(e => e.designation).filter(Boolean)));

  let filteredEmployees = employees.filter(e => {
    const searchString = `${e.firstName} ${e.lastName} ${e.employeeId} ${e.email}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    const matchesDept = filterDepartment === "ALL" || e.department === filterDepartment;
    const matchesDesig = filterDesignation === "ALL" || e.designation === filterDesignation;
    const matchesStatus = filterStatus === "ALL" || e.status === filterStatus;
    return matchesSearch && matchesDept && matchesDesig && matchesStatus;
  });

  // Sort by created descending
  filteredEmployees.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const router = useRouter();
  const handleRowClick = (emp: Employee) => {
    router.push(`/dashboard/staff-management/employees/${emp.id}`);
  };

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>Employees</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>Manage staff profiles and base salaries.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Add Employee
        </button>
      </div>

      <div className={styles.container}>
        
        {/* Top Section Metrics */}
        <div className={styles.metricsGrid}>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Employees</div>
            <div className={styles.metricValue} style={{ color: 'var(--text)' }}>{totalEmployees}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Active Employees</div>
            <div className={styles.metricValue} style={{ color: 'var(--success)' }}>{activeEmployees}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Inactive Employees</div>
            <div className={styles.metricValue} style={{ color: 'var(--warning)' }}>{inactiveEmployees}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Departments</div>
            <div className={styles.metricValue}>{uniqueDepartments}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>Total Monthly Salary</div>
            <div className={styles.metricValue}>{formatCurrency(totalMonthlySalary)}</div>
          </div>
          <div className="glass-card" style={{ padding: 'var(--spacing-4)' }}>
            <div className={styles.metricTitle}>New This Month</div>
            <div className={styles.metricValue}>{newEmployeesThisMonth}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          {/* Filters Section */}
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search Employee</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Name, ID, Email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Department</label>
              <select className="input" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="ALL">All Departments</option>
                {allDepartments.map((dept: any) => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Designation</label>
              <select className="input" value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)}>
                <option value="ALL">All Designations</option>
                {allDesignations.map((desig: any) => <option key={desig} value={desig}>{desig}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div className={styles.filterGroup} style={{ flex: 'none', paddingBottom: '2px' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Avatar</th>
                  <th>Employee Name</th>
                  <th>Employee ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Contact Info</th>
                  <th>Joining Date</th>
                  <th style={{ textAlign: 'right' }}>Basic Salary</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : paginatedEmployees.length > 0 ? (
                  paginatedEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className={styles.clickableRow}
                      onClick={() => handleRowClick(emp)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 'bold', color: '#fff'
                        }}>
                          {getInitials(emp.firstName, emp.lastName)}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{emp.firstName} {emp.lastName}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.employeeId}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{emp.department || '-'}</td>
                      <td>{emp.designation}</td>
                      <td>
                        <div style={{ fontSize: '12px' }}>{emp.phone || '-'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </td>
                      <td>{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '-'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(emp.basicSalary)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.badge} ${
                          emp.status === 'ACTIVE' ? styles['badge-paid'] : 
                          emp.status === 'ON_LEAVE' ? styles['badge-partial'] : styles['badge-unpaid']
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleRowClick(emp)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--border)' }}>View</button>
                          <button onClick={(e) => handleDeleteEmployee(emp.id, e)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.5 }}>groups</span>
                        <p>No employees found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} entries
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <button 
                  className="btn btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{isEditMode ? "Edit Employee" : "Add New Employee"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">First Name *</label>
                  <input type="text" className="input" value={newEmployee.firstName} onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Last Name *</label>
                  <input type="text" className="input" value={newEmployee.lastName} onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})} required />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={newEmployee.email} onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Phone</label>
                  <input type="text" className="input" value={newEmployee.phone} onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Designation *</label>
                  <input type="text" className="input" value={newEmployee.designation} onChange={(e) => setNewEmployee({...newEmployee, designation: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Department</label>
                  <input type="text" className="input" value={newEmployee.department} onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})} />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label">Basic Salary (BDT) *</label>
                  <input type="number" step="0.01" className="input" value={newEmployee.basicSalary} onChange={(e) => setNewEmployee({...newEmployee, basicSalary: e.target.value})} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Join Date *</label>
                  <input type="date" className="input" value={newEmployee.joinDate} onChange={(e) => setNewEmployee({...newEmployee, joinDate: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 var(--spacing-4) 0', color: 'var(--text)' }}>Organization Details</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label">Department Reference</label>
                    <select className="input" value={newEmployee.departmentId} onChange={(e) => {
                      const dept = departments.find(d => d.id === e.target.value);
                      setNewEmployee({...newEmployee, departmentId: e.target.value, department: dept?.name || newEmployee.department});
                    }}>
                      <option value="">None</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Designation Reference</label>
                    <select className="input" value={newEmployee.designationId} onChange={(e) => {
                      const des = designations.find(d => d.id === e.target.value);
                      setNewEmployee({...newEmployee, designationId: e.target.value, designation: des?.name || newEmployee.designation});
                    }}>
                      <option value="">None</option>
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label">Reporting Manager</label>
                    <select className="input" value={newEmployee.reportingManagerId} onChange={(e) => setNewEmployee({...newEmployee, reportingManagerId: e.target.value})}>
                      <option value="">None</option>
                      {employees.filter(emp => emp.id !== selectedEmployee?.id).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Employment Type</label>
                    <select className="input" value={newEmployee.employmentType} onChange={(e) => setNewEmployee({...newEmployee, employmentType: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label">Location</label>
                    <input type="text" className="input" value={newEmployee.location} onChange={(e) => setNewEmployee({...newEmployee, location: e.target.value})} placeholder="e.g. Dhaka Office" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">Shift</label>
                    <input type="text" className="input" value={newEmployee.shift} onChange={(e) => setNewEmployee({...newEmployee, shift: e.target.value})} placeholder="e.g. Day Shift" />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-4)', background: 'rgba(59,130,246,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.1)' }}>
                <h4 style={{ margin: '0 0 var(--spacing-4) 0', color: 'var(--primary)' }}>App Login Credentials</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label">Employee ID (Auto-generated)</label>
                    <input type="text" className="input" value="Generated on Save" disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label">App Password {isEditMode ? '(Leave blank to keep)' : '*'}</label>
                    <input type="text" className="input" placeholder={isEditMode ? "••••••••" : "e.g. 123456"} value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} required={!isEditMode} />
                  </div>
                </div>
              </div>

              {isEditMode && (
                <div className={styles.formRow} style={{ marginTop: 'var(--spacing-4)' }}>
                  <div className={styles.formGroup}>
                    <label className="label">Employment Status</label>
                    <select className="input" value={newEmployee.status} onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Employee"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      {selectedEmployee && (
        <div className={styles.modalOverlay} onClick={() => setSelectedEmployee(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '100%', maxWidth: '500px', borderRadius: 0, overflowY: 'auto' }}>
            <div className={styles.modalHeader} style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10, padding: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: 0 }}>Employee Profile</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedEmployee.employeeId}</div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-6)' }}>
              
              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: 'bold', color: '#fff',
                  flexShrink: 0
                }}>
                  {getInitials(selectedEmployee.firstName, selectedEmployee.lastName)}
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <div style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '14px', marginBottom: '8px' }}>
                    {selectedEmployee.designation} {selectedEmployee.department && `• ${selectedEmployee.department}`}
                  </div>
                  <span className={`${styles.badge} ${
                    selectedEmployee.status === 'ACTIVE' ? styles['badge-paid'] : 
                    selectedEmployee.status === 'ON_LEAVE' ? styles['badge-partial'] : styles['badge-unpaid']
                  }`}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontWeight: 500, fontSize: '13px', wordBreak: 'break-all' }}>{selectedEmployee.email}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</div>
                  <div style={{ fontWeight: 500 }}>{selectedEmployee.phone || '-'}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Joining Date</div>
                  <div style={{ fontWeight: 500 }}>{selectedEmployee.joinDate ? new Date(selectedEmployee.joinDate).toLocaleDateString() : '-'}</div>
                </div>
                <div style={{ background: 'var(--surface-light)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Basic Salary</div>
                  <div style={{ fontWeight: 500 }}>{formatCurrency(selectedEmployee.basicSalary)}</div>
                </div>
              </div>

              {/* Attendance & Salary Summary placeholders */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Current Month Overview</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Attendance Summary</span>
                  <span>(Calculating...)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bonuses</span>
                  <span style={{ color: 'var(--success)' }}>+ {formatCurrency(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Punishments / Deductions</span>
                  <span style={{ color: 'var(--danger)' }}>- {formatCurrency(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '8px 0' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Est. Net Salary</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(selectedEmployee.basicSalary)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0' }}>Recent Activity</h4>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px' }}></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500 }}>Profile Created</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(selectedEmployee.createdAt || Date.now()).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'auto' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setSelectedEmployee(null); openEditModal(selectedEmployee); }}>Edit Profile</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>Manage Salary</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>Attendance</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>Performance</button>
                
                <button 
                  className="btn btn-secondary" 
                  style={{ gridColumn: '1 / -1', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={(e) => handleDeleteEmployee(selectedEmployee.id, e)}
                >
                  Delete Employee
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
