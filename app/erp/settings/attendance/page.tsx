"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import styles from "./styles.module.css";

interface Network {
  id: string;
  name: string;
  ssid: string | null;
  bssid: string | null;
  ipAddress: string | null;
  isActive: boolean;
}

export default function AttendanceSettings() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Network Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [name, setName] = useState("");
  const [ssid, setSsid] = useState("");
  const [bssid, setBssid] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Punishments Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: "LATE",
    fromMinutes: 16,
    toMinutes: 30,
    amount: 100,
    active: true
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [netRes, configRes, rulesRes] = await Promise.all([
        fetch("/api/attendance/networks"),
        fetch("/api/staff/settings/attendance"),
        fetch("/api/staff/settings/punishments")
      ]);
      const netData = await netRes.json();
      const configData = await configRes.json();
      const rulesData = await rulesRes.json();
      
      if (netData.success) {
        setNetworks(netData.data);
      }
      setConfig(configData);
      setRules(rulesData);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIG HANDLERS ---
  const handleConfigChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await fetch("/api/staff/settings/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      alert("Configuration saved successfully");
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setSavingConfig(false);
    }
  };

  // --- RULE HANDLERS ---
  const openRuleModal = (rule: any = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        type: rule.type,
        fromMinutes: rule.fromMinutes,
        toMinutes: rule.toMinutes,
        amount: rule.amount,
        active: rule.active
      });
    } else {
      setEditingRule(null);
      setFormData({
        type: "LATE",
        fromMinutes: 16,
        toMinutes: 30,
        amount: 100,
        active: true
      });
    }
    setIsRuleModalOpen(true);
  };

  const saveRule = async () => {
    try {
      if (editingRule) {
        await fetch(`/api/staff/settings/punishments/${editingRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch("/api/staff/settings/punishments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });
      }
      setIsRuleModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving rule:", error);
    }
  };

  const toggleRuleActive = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/staff/settings/punishments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active })
      });
      fetchData();
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await fetch(`/api/staff/settings/punishments/${id}`, {
        method: "DELETE"
      });
      fetchData();
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  // --- NETWORK HANDLERS ---
  const resetForm = () => {
    setName("");
    setSsid("");
    setBssid("");
    setIpAddress("");
    setIsActive(true);
    setError("");
    setEditingNetwork(null);
  };

  const handleOpenModal = (network?: Network) => {
    if (network) {
      setEditingNetwork(network);
      setName(network.name);
      setSsid(network.ssid || "");
      setBssid(network.bssid || "");
      setIpAddress(network.ipAddress || "");
      setIsActive(network.isActive);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSaveNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim() && !bssid.trim() && !ipAddress.trim()) {
      setError("Please provide at least one identifier (SSID, BSSID, or IP Address).");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const url = editingNetwork 
        ? `/api/attendance/networks/${editingNetwork.id}`
        : "/api/attendance/networks";
      
      const method = editingNetwork ? "PATCH" : "POST";

      const payload = { 
        name, 
        ssid: ssid || null, 
        bssid: bssid || null, 
        ipAddress: ipAddress || null,
        isActive 
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || data.message || "Failed to save network.");
      } else {
        fetchData();
        handleCloseModal();
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!confirm("Are you sure you want to delete this network?")) return;
    try {
      const res = await fetch(`/api/attendance/networks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.message || "Failed to delete network.");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
    }
  };

  const handleToggleActiveNetwork = async (network: Network) => {
    try {
      const res = await fetch(`/api/attendance/networks/${network.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !network.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Attendance Settings" description="Configure attendance settings." />
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
          Loading Settings...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Attendance Settings" 
        description="Configure enterprise attendance settings, punishment slabs, and allowed Wi-Fi networks."
      />
      
      {/* Global Configuration Card */}
      <div className={`glass-card animate-fade-in ${styles.container}`} style={{ padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <div className={styles.header}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span> 
             Global Settings
          </h2>
          <button onClick={saveConfig} disabled={savingConfig} className="btn btn-primary">
            {savingConfig ? "Saving..." : "Save Config"}
          </button>
        </div>
        
        {config && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-6)' }}>
              <div className={styles.formGroup}>
                <label className="label">Grace Period (Minutes)</label>
                <input 
                  type="number" 
                  value={config.gracePeriod}
                  onChange={(e) => handleConfigChange('gracePeriod', parseInt(e.target.value))}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)' }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className="label">Shift Start Time (HH:mm)</label>
                <input 
                  type="time" 
                  value={config.shiftStart}
                  onChange={(e) => handleConfigChange('shiftStart', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)' }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className="label">Shift End Time (HH:mm)</label>
                <input 
                  type="time" 
                  value={config.shiftEnd}
                  onChange={(e) => handleConfigChange('shiftEnd', e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'var(--spacing-6)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={config.fridayOff}
                  onChange={(e) => handleConfigChange('fridayOff', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Friday is an Off-Day
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={config.enablePunishmentDeduction}
                  onChange={(e) => handleConfigChange('enablePunishmentDeduction', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Enable Monetary Deductions (Warning Only if disabled)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Punishment Rules Card */}
      <div className={`glass-card animate-fade-in ${styles.container}`} style={{ padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)' }}>
        <div className={styles.header}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Punishment Slabs (Rules)</h2>
          <button onClick={() => openRuleModal()} className="btn btn-primary">
            + Add Rule
          </button>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Condition</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Amount (৳)</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No punishment rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className={styles.td}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'var(--surface-hover)', fontSize: '12px', fontWeight: 600 }}>
                        {rule.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {rule.fromMinutes} to {rule.toMinutes} mins
                    </td>
                    <td className={styles.td} style={{ color: 'var(--danger)', fontWeight: 'bold', textAlign: 'right' }}>
                      ৳{rule.amount}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleRuleActive(rule.id, !rule.active)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <span className={`${styles.badge} ${rule.active ? styles.active : styles.inactive}`}>
                          {rule.active ? 'Active' : 'Disabled'}
                        </span>
                      </button>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => openRuleModal(rule)} className={`${styles.iconBtn} ${styles.editBtn}`} title="Edit">✎</button>
                        <button onClick={() => deleteRule(rule.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allowed Networks Card */}
      <div className={`glass-card animate-fade-in ${styles.container}`} style={{ padding: 'var(--spacing-6)' }}>
        <div className={styles.header}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Allowed Networks Configuration</h2>
          <button className={styles.addBtn} onClick={() => handleOpenModal()}>
            + Add Network
          </button>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>IP Address</th>
                <th className={styles.th}>SSID</th>
                <th className={styles.th}>BSSID (MAC)</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {networks.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    No networks configured.
                  </td>
                </tr>
              ) : (
                networks.map((network) => (
                  <tr key={network.id}>
                    <td className={styles.td}>{network.name}</td>
                    <td className={styles.td} style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{network.ipAddress || '-'}</td>
                    <td className={styles.td}>{network.ssid || '-'}</td>
                    <td className={styles.td}>{network.bssid || '-'}</td>
                    <td className={styles.td}>
                      <button 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleToggleActiveNetwork(network)}
                        title="Click to toggle status"
                      >
                        <span className={`${styles.badge} ${network.isActive ? styles.active : styles.inactive}`}>
                          {network.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <button className={`${styles.iconBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(network)} title="Edit">✎</button>
                        <button className={`${styles.iconBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteNetwork(network.id)} title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>{editingNetwork ? "Edit Network" : "Add Network"}</h2>
            <form onSubmit={handleSaveNetwork}>
              {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
              <div className={styles.formGroup}>
                <label>Network Name (Optional)</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Office Wi-Fi" />
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Public IP Address</span>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const res = await fetch('https://api.ipify.org?format=json');
                        const data = await res.json();
                        setIpAddress(data.ip);
                      } catch(e) {
                        setIpAddress('auto');
                      }
                    }}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Auto-Detect My IP
                  </button>
                </label>
                <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="e.g. 192.168.1.1 (or click Auto-Detect)" />
              </div>
              <div className={styles.formGroup}>
                <label>SSID (Optional)</label>
                <input type="text" value={ssid} onChange={(e) => setSsid(e.target.value)} placeholder="e.g. SHOHOJ-OFFICE" />
              </div>
              <div className={styles.formGroup}>
                <label>BSSID / Router MAC (Optional)</label>
                <input type="text" value={bssid} onChange={(e) => setBssid(e.target.value)} placeholder="e.g. 3C:84:6A:11:22:33" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Active (Allow check-ins from this network)
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Network"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Rule Modal */}
      {isRuleModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsRuleModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingRule ? "Edit Rule" : "Add Rule"}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className={styles.formGroup}>
                <label className="label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  <option value="LATE">LATE</option>
                  <option value="EARLY_LEAVE">EARLY LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>From (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.fromMinutes}
                    onChange={(e) => setFormData({...formData, fromMinutes: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>To (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.toMinutes}
                    onChange={(e) => setFormData({...formData, toMinutes: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className="label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Amount (৳)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Active
              </label>
              <div className={styles.modalActions} style={{ marginTop: '16px' }}>
                <button onClick={() => setIsRuleModalOpen(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={saveRule} className={styles.saveBtn}>
                  Save Rule
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageContainer>
  );
}
