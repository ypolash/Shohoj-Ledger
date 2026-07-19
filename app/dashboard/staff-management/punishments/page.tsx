"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "../../income/page.module.css";

export default function PunishmentSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    type: "LATE",
    fromMinutes: 16,
    toMinutes: 30,
    amount: 100,
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, rulesRes] = await Promise.all([
        fetch("/api/staff/settings/attendance"),
        fetch("/api/staff/settings/punishments")
      ]);
      const configData = await configRes.json();
      const rulesData = await rulesRes.json();
      setConfig(configData);
      setRules(rulesData);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const saveConfig = async () => {
    setSaving(true);
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
      setSaving(false);
    }
  };

  const openModal = (rule: any = null) => {
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
    setIsModalOpen(true);
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
      setIsModalOpen(false);
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

  if (loading) {
    return (
      <div className="animate-fade-in container" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="animate-fade-in container" style={{ maxWidth: '1400px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "var(--spacing-6)" }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)' }}>warning</span>
            Attendance & Punishment Settings
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: 'var(--text-muted)' }}>
            Configure global attendance limits and monetary penalty slabs.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        
        {/* Global Configuration Card */}
        <div className="glass-card" style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span> 
              Global Settings
            </h3>
            <button onClick={saveConfig} disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Save Config"}
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
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Shift Start Time (HH:mm)</label>
                  <input 
                    type="time" 
                    value={config.shiftStart}
                    onChange={(e) => handleConfigChange('shiftStart', e.target.value)}
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">Shift End Time (HH:mm)</label>
                  <input 
                    type="time" 
                    value={config.shiftEnd}
                    onChange={(e) => handleConfigChange('shiftEnd', e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: 'var(--spacing-6)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text)' }}>
                  <input 
                    type="checkbox" 
                    checked={config.fridayOff}
                    onChange={(e) => handleConfigChange('fridayOff', e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  Friday is an Off-Day
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text)' }}>
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

        {/* Punishment Rules */}
        <div className="glass-card" style={{ padding: 'var(--spacing-6)', marginTop: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', paddingBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0 }}>Punishment Slabs (Rules)</h3>
            <button onClick={() => openModal()} className="btn btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add Rule
            </button>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Condition</th>
                  <th style={{ textAlign: 'right' }}>Amount (৳)</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
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
                    <tr key={rule.id} className={styles.clickableRow}>
                      <td>
                        <span className={`${styles.badge} ${styles['badge-partial']}`}>
                          {rule.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {rule.fromMinutes} to {rule.toMinutes} mins
                      </td>
                      <td style={{ color: 'var(--danger)', fontWeight: 'bold', textAlign: 'right' }}>
                        ৳{rule.amount}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => toggleRuleActive(rule.id, !rule.active)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <span className={`${styles.badge} ${rule.active ? styles['badge-paid'] : styles['badge-unpaid']}`}>
                            {rule.active ? 'Active' : 'Disabled'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openModal(rule)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--border)' }}>
                            Edit
                          </button>
                          <button onClick={() => deleteRule(rule.id)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingRule ? "Edit Rule" : "Add Rule"}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={styles.formGroup}>
                <label className="label">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="input"
                >
                  <option value="LATE">LATE</option>
                  <option value="EARLY_LEAVE">EARLY LEAVE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className="label">From (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.fromMinutes}
                    onChange={(e) => setFormData({...formData, fromMinutes: parseInt(e.target.value)})}
                    className="input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className="label">To (Mins)</label>
                  <input 
                    type="number" 
                    value={formData.toMinutes}
                    onChange={(e) => setFormData({...formData, toMinutes: parseInt(e.target.value)})}
                    className="input"
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className="label">Amount (৳)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="input"
                />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: 'var(--text)' }}>
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                Active
              </label>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={saveRule} className="btn btn-primary" style={{ flex: 1 }}>
                  Save Rule
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
