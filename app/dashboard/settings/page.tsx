"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { 
  loadAdminData, 
  updateProfile, 
  updateSettings, 
  toggleModuleAction, 
  deactivateUserAction, 
  assignUserRoleAction, 
  createRoleAction, 
  deleteRoleAction, 
  assignPermissionsAction 
} from "./actions";

type Tab = "profile" | "settings" | "modules" | "users" | "roles" | "permissions";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshData = async () => {
    try {
      const result = await loadAdminData();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (isLoading) return <div className={styles.container}>Loading administration settings...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!data) return <div className={styles.container}>No data found.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Company Administration</h1>
        <p className={styles.subtitle}>Manage your enterprise workspace, users, and module access.</p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <button 
            className={`${styles.tabBtn} ${activeTab === "profile" ? styles.active : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            🏢 Company Profile
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "settings" ? styles.active : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Preferences & Schedule
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "modules" ? styles.active : ""}`}
            onClick={() => setActiveTab("modules")}
          >
            🧩 Module Management
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "users" ? styles.active : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 User Management
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "roles" ? styles.active : ""}`}
            onClick={() => setActiveTab("roles")}
          >
            🛡️ Role Management
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === "permissions" ? styles.active : ""}`}
            onClick={() => setActiveTab("permissions")}
          >
            🔐 Permissions
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {activeTab === "profile" && <CompanyProfile company={data.company} onSave={refreshData} />}
          {activeTab === "settings" && <CompanySettings settings={data.company.settings} onSave={refreshData} />}
          {activeTab === "modules" && <ModuleManagement modules={data.modules} onSave={refreshData} />}
          {activeTab === "users" && <UserManagement users={data.users} roles={data.roles} onSave={refreshData} />}
          {activeTab === "roles" && <RoleManagement roles={data.roles} onSave={refreshData} />}
          {activeTab === "permissions" && <PermissionManagement roles={data.roles} permissions={data.permissions} onSave={refreshData} />}
        </div>
      </div>
    </div>
  );
}

function CompanyProfile({ company, onSave }: any) {
  const [name, setName] = useState(company?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name });
      await onSave();
    } catch (e) {
      alert("Error saving profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Company Profile</h2>
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Company Name</label>
          <input className={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Business Type</label>
          <input className={styles.input} type="text" value={company?.businessType || ""} disabled />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Status</label>
          <input className={styles.input} type="text" value={company?.status || ""} disabled />
        </div>
      </div>
      <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

function CompanySettings({ settings, onSave }: any) {
  const [currency, setCurrency] = useState(settings?.currency || "BDT");
  const [timezone, setTimezone] = useState(settings?.timezone || "Asia/Dhaka");
  const [shiftStart, setShiftStart] = useState(settings?.shiftStartTime || "09:00");
  const [shiftEnd, setShiftEnd] = useState(settings?.shiftEndTime || "18:00");
  const [gracePeriod, setGracePeriod] = useState(settings?.gracePeriodMinutes || 15);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({ currency, timezone, shiftStartTime: shiftStart, shiftEndTime: shiftEnd, gracePeriodMinutes: gracePeriod });
      await onSave();
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Working Schedule & Preferences</h2>
      <div className={styles.grid}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Currency</label>
          <select className={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="BDT">BDT (৳)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Timezone</label>
          <select className={styles.select} value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Shift Start Time</label>
          <input className={styles.input} type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Shift End Time</label>
          <input className={styles.input} type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Grace Period (Minutes)</label>
          <input className={styles.input} type="number" value={gracePeriod} onChange={e => setGracePeriod(Number(e.target.value))} />
        </div>
      </div>
      <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Update Settings"}
      </button>
    </div>
  );
}

function ModuleManagement({ modules, onSave }: any) {
  const handleToggle = async (moduleId: string, isActive: boolean) => {
    try {
      await toggleModuleAction(moduleId, isActive);
      await onSave();
    } catch (e) {
      alert("Error toggling module");
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Installed Modules</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modules.map((mod: any) => (
          <div key={mod.module.id} className={styles.moduleCard}>
            <div className={styles.moduleInfo}>
              <h3>{mod.module.name}</h3>
              <p>{mod.module.description || "System Module"}</p>
            </div>
            <label className={styles.toggleSwitch}>
              <input 
                type="checkbox" 
                checked={mod.isActive} 
                onChange={(e) => handleToggle(mod.moduleId, e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserManagement({ users, roles, onSave }: any) {
  const handleDeactivate = async (userId: string) => {
    if (!confirm("Deactivate user?")) return;
    try {
      await deactivateUserAction(userId);
      await onSave();
    } catch (e) {
      alert("Error deactivating user");
    }
  };

  const handleRoleChange = async (userId: string, roleName: string) => {
    try {
      await assignUserRoleAction(userId, roleName);
      await onSave();
    } catch (e) {
      alert("Error assigning role");
    }
  };

  return (
    <div>
      <div className={styles.flexHeader}>
        <h2>Users</h2>
        <button className={styles.addBtn}>+ Invite User</button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    className={styles.select} 
                    style={{ padding: "0.25rem", width: "auto" }}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDeactivate(user.id)}>Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleManagement({ roles, onSave }: any) {
  const handleCreate = async () => {
    const name = prompt("Enter new role name:");
    if (!name) return;
    try {
      await createRoleAction(name);
      await onSave();
    } catch (e: any) {
      alert(e.message || "Error creating role");
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm("Delete role?")) return;
    try {
      await deleteRoleAction(roleId);
      await onSave();
    } catch (e: any) {
      alert(e.message || "Error deleting role");
    }
  };

  return (
    <div>
      <div className={styles.flexHeader}>
        <h2>Roles</h2>
        <button className={styles.addBtn} onClick={handleCreate}>+ Create Role</button>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r: any) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.isDefault ? "System Default" : "Custom"}</td>
                <td>
                  {!r.isDefault && (
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(r.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionManagement({ roles, permissions, onSave }: any) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  const selectedRole = roles.find((r: any) => r.id === selectedRoleId);
  const selectedRolePermissionActions = selectedRole?.permissions.map((rp: any) => rp.permission.action) || [];

  const [currentActions, setCurrentActions] = useState<string[]>(selectedRolePermissionActions);

  useEffect(() => {
    setCurrentActions(selectedRolePermissionActions);
  }, [selectedRoleId, roles]);

  const togglePermission = (action: string) => {
    if (currentActions.includes(action)) {
      setCurrentActions(currentActions.filter(a => a !== action));
    } else {
      setCurrentActions([...currentActions, action]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await assignPermissionsAction(selectedRoleId, currentActions);
      await onSave();
      alert("Permissions saved successfully");
    } catch (e: any) {
      alert(e.message || "Error saving permissions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className={styles.sectionTitle}>Role Permissions</h2>
      <div className={styles.formGroup} style={{ marginBottom: '2rem', maxWidth: '300px' }}>
        <label className={styles.label}>Select Role to Modify</label>
        <select className={styles.select} value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
          {roles.map((r: any) => (
            <option key={r.id} value={r.id}>{r.name} {r.isDefault ? "(Default)" : ""}</option>
          ))}
        </select>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Action</th>
              <th>Module Scope</th>
              <th>Assigned</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p: any) => (
              <tr key={p.id}>
                <td>{p.action}</td>
                <td>{p.moduleKey}</td>
                <td>
                  <input 
                    type="checkbox" 
                    checked={currentActions.includes(p.action)} 
                    onChange={() => togglePermission(p.action)}
                    disabled={selectedRole?.isDefault} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!selectedRole?.isDefault && (
        <button className={styles.saveBtn} style={{ marginTop: '2rem' }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Permissions"}
        </button>
      )}
      {selectedRole?.isDefault && (
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Default role permissions cannot be modified.</p>
      )}
    </div>
  );
}
