"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";

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
      <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
        Loading Settings...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#60a5fa' }}>warning</span>
          Attendance & Punishment Settings
        </h2>
        <p className={styles.headerDesc}>Configure global attendance limits and monetary penalty slabs.</p>
      </div>

      {/* Global Configuration Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span> 
            Global Settings
          </h3>
          <button 
            onClick={saveConfig}
            disabled={saving}
            className={styles.primaryBtn}
          >
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
        
        {config && (
          <div className={styles.cardBody}>
            <div className={styles.grid}>
              <div className={styles.formGroup}>
                <label>Grace Period (Minutes)</label>
                <input 
                  type="number" 
                  value={config.gracePeriod}
                  onChange={(e) => handleConfigChange('gracePeriod', parseInt(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Shift Start Time (HH:mm)</label>
                <input 
                  type="time" 
                  value={config.shiftStart}
                  onChange={(e) => handleConfigChange('shiftStart', e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Shift End Time (HH:mm)</label>
                <input 
                  type="time" 
                  value={config.shiftEnd}
                  onChange={(e) => handleConfigChange('shiftEnd', e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.checkboxContainer}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={config.fridayOff}
                  onChange={(e) => handleConfigChange('fridayOff', e.target.checked)}
                />
                Friday is an Off-Day
              </label>
              
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={config.enablePunishmentDeduction}
                  onChange={(e) => handleConfigChange('enablePunishmentDeduction', e.target.checked)}
                />
                Enable Monetary Deductions (Warning Only if disabled)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Punishment Rules */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Punishment Slabs (Rules)</h3>
          <button 
            onClick={() => openModal()}
            className={styles.primaryBtn}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add Rule
          </button>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Condition</th>
                <th className={styles.th}>Amount (৳)</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.td} style={{ textAlign: 'center', padding: '2rem' }}>
                    No punishment rules defined yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className={styles.td}>
                      <span className={styles.typeBadge}>{rule.type.replace('_', ' ')}</span>
                    </td>
                    <td className={styles.td}>
                      {rule.fromMinutes} to {rule.toMinutes} mins
                    </td>
                    <td className={styles.td} style={{ color: '#f87171', fontWeight: 'bold' }}>
                      ৳{rule.amount}
                    </td>
                    <td className={styles.td}>
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
                      <div className={styles.actions}>
                        <button onClick={() => openModal(rule)} className={`${styles.iconBtn} ${styles.editBtn}`} title="Edit">
                          ✎
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className={`${styles.iconBtn} ${styles.deleteBtn}`} title="Delete">
                          🗑
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

      {/* Modal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingRule ? "Edit Rule" : "Add Rule"}</h2>
            
            <div className={styles.formGroup}>
              <label>Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className={styles.input}
              >
                <option value="LATE">LATE</option>
                <option value="EARLY_LEAVE">EARLY LEAVE</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
            
            <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>From (Mins)</label>
                <input 
                  type="number" 
                  value={formData.fromMinutes}
                  onChange={(e) => setFormData({...formData, fromMinutes: parseInt(e.target.value)})}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>To (Mins)</label>
                <input 
                  type="number" 
                  value={formData.toMinutes}
                  onChange={(e) => setFormData({...formData, toMinutes: parseInt(e.target.value)})}
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Amount (৳)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                className={styles.input}
              />
            </div>
            
            <label className={styles.checkboxLabel} style={{ marginBottom: '1rem' }}>
              <input 
                type="checkbox" 
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
              />
              Active
            </label>
            
            <div className={styles.modalActions}>
              <button onClick={() => setIsModalOpen(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={saveRule} className={styles.saveBtn}>
                Save Rule
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
