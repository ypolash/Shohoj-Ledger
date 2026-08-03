import React from 'react';
import styles from "@/app/erp/staff-management/page.module.css";
export function EmployeeDetailsDrawer(props: any) { const { selectedEmployee, setSelectedEmployee, openEditModal, formatCurrency, getAvatarInitials, getStatusBadgeClass, getRoleBadgeClass, handleDeleteEmployee } = props; return (<>
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
                  {getAvatarInitials ? getAvatarInitials(selectedEmployee.firstName, selectedEmployee.lastName) : `${selectedEmployee.firstName?.[0] || ''}${selectedEmployee.lastName?.[0] || ''}`.toUpperCase()}
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
    </>
  );
}
