import React from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles.module.css';

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  editingNetwork: any;
  name: string;
  setName: (v: string) => void;
  ssid: string;
  setSsid: (v: string) => void;
  bssid: string;
  setBssid: (v: string) => void;
  ipAddress: string;
  setIpAddress: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  error: string;
  saving: boolean;
}

export default function NetworkModal({
  isOpen, onClose, onSave, editingNetwork,
  name, setName, ssid, setSsid, bssid, setBssid,
  ipAddress, setIpAddress, isActive, setIsActive,
  error, saving
}: NetworkModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>{editingNetwork ? "Edit Network" : "Add Network"}</h2>
        <form onSubmit={onSave}>
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
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save Network"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
