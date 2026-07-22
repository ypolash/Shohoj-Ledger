"use client";

import React, { useState, useEffect } from "react";
import { fetchUsers, fetchRoles, createUser, updateUser, toggleUserStatus, resetUserPassword } from "./actions";

// Reuse standard styles from income module or layout
import styles from "../income/page.module.css"; 

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", role: "member" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [u, r] = await Promise.all([fetchUsers(), fetchRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData);
      } else {
        await createUser(formData);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const isActive = user.role !== "inactive";
    if (!confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} this user?`)) return;
    try {
      await toggleUserStatus(user.id, !isActive);
      await loadData();
    } catch (e: any) {
      alert("Failed to toggle status");
    }
  };

  const handleResetPassword = async (user: any) => {
    const newPass = prompt("Enter new temporary password:");
    if (!newPass) return;
    try {
      await resetUserPassword(user.id, newPass);
      alert("Password reset successfully.");
    } catch (e: any) {
      alert("Failed to reset password.");
    }
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setFormData({ name: "", email: "", role: "member" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setIsModalOpen(true);
  };

  // Filtered
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    const isActive = u.role !== "inactive";
    const matchStatus = filterStatus === "ALL" || (filterStatus === "ACTIVE" ? isActive : !isActive);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0 }}>System Users</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>Manage platform access and roles.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Invite User
        </button>
      </div>

      <div className={styles.container}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup} style={{ flex: 1.5 }}>
              <label className="label">Search Users</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Name or Email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Role</label>
              <select className="input" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="ALL">All Roles</option>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                <option value="member">member</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className="label">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>Loading...</td></tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isActive = user.role !== "inactive";
                    return (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                        <td>{user.role}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`${styles.badge} ${isActive ? styles['badge-paid'] : styles['badge-unpaid']}`}>
                            {isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => openEditModal(user)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Edit</button>
                            <button onClick={() => handleResetPassword(user)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Reset Pass</button>
                            <button 
                              onClick={() => handleToggleStatus(user)} 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '12px', color: isActive ? 'var(--warning)' : 'var(--success)', borderColor: isActive ? 'var(--warning)' : 'var(--success)' }}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "var(--spacing-6)" }}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{selectedUser ? "Edit User" : "Invite New User"}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label">Full Name *</label>
                <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label className="label">Email Address *</label>
                <input type="email" className="input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={!!selectedUser} />
                {selectedUser && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email cannot be changed after creation.</span>}
              </div>
              <div className={styles.formGroup}>
                <label className="label">Assign Role *</label>
                <select className="input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required>
                  {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  <option value="member">member</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save User"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
