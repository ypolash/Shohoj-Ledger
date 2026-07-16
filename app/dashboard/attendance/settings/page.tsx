"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

interface Network {
  id: string;
  name: string;
  ssid: string;
  bssid: string;
  isActive: boolean;
}

export default function AttendanceSettings() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [ssid, setSsid] = useState("");
  const [bssid, setBssid] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const res = await fetch("/api/attendance/networks");
      const data = await res.json();
      if (data.success) {
        setNetworks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch networks:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSsid("");
    setBssid("");
    setIsActive(true);
    setError("");
    setEditingNetwork(null);
  };

  const handleOpenModal = (network?: Network) => {
    if (network) {
      setEditingNetwork(network);
      setName(network.name);
      setSsid(network.ssid);
      setBssid(network.bssid);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssid.trim() || !bssid.trim()) {
      setError("SSID and BSSID are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingNetwork 
        ? `/api/attendance/networks/${editingNetwork.id}`
        : "/api/attendance/networks";
      
      const method = editingNetwork ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ssid, bssid, isActive }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to save network.");
      } else {
        await fetchNetworks();
        handleCloseModal();
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this network?")) return;

    try {
      const res = await fetch(`/api/attendance/networks/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchNetworks();
      } else {
        alert(data.message || "Failed to delete network.");
      }
    } catch (error) {
      alert("An error occurred while deleting.");
    }
  };

  const handleToggleActive = async (network: Network) => {
    try {
      const res = await fetch(`/api/attendance/networks/${network.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !network.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchNetworks();
      }
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className={`animate-fade-in ${styles.container}`}>
      <div className={styles.header}>
        <h1>Allowed Networks</h1>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          + Add Network
        </button>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>SSID</th>
                <th className={styles.th}>BSSID (MAC Address)</th>
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
                    <td className={styles.td}>{network.ssid}</td>
                    <td className={styles.td}>{network.bssid}</td>
                    <td className={styles.td}>
                      <button 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleToggleActive(network)}
                        title="Click to toggle status"
                      >
                        <span className={`${styles.badge} ${network.isActive ? styles.active : styles.inactive}`}>
                          {network.isActive ? "Active" : "Inactive"}
                        </span>
                      </button>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <button 
                          className={`${styles.iconBtn} ${styles.editBtn}`}
                          onClick={() => handleOpenModal(network)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button 
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(network.id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingNetwork ? "Edit Network" : "Add Network"}</h2>
            <form onSubmit={handleSave}>
              {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
              
              <div className={styles.formGroup}>
                <label>Network Name (Optional)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Office Wi-Fi"
                />
              </div>

              <div className={styles.formGroup}>
                <label>SSID *</label>
                <input 
                  type="text" 
                  value={ssid} 
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="e.g. SHOHOJ-OFFICE"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>BSSID (Router MAC) *</label>
                <input 
                  type="text" 
                  value={bssid} 
                  onChange={(e) => setBssid(e.target.value)}
                  placeholder="e.g. 3C:84:6A:11:22:33"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Active (Allow check-ins from this network)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Network"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
