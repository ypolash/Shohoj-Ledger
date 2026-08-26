import React from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles.module.css';

interface PunishmentRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRule: any;
  formData: any;
  setFormData: (v: any) => void;
}

export default function PunishmentRuleModal({
  isOpen, onClose, onSave, editingRule, formData, setFormData
}: PunishmentRuleModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
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
            <button onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={onSave} className={styles.saveBtn}>
              Save Rule
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
