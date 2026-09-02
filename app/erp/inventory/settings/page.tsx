"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  Warehouse, 
  ListPlus, 
  Bell, 
  Sliders, 
  Plus, 
  X, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { useUI } from '@/lib/contexts/UIContext';
import styles from './InventorySettings.module.css';

export default function InventorySettingsPage() {
  const { setPageTitleOverride } = useUI();

  const [warehousesEnabled, setWarehousesEnabled] = useState(false);
  const [globalCustomFields, setGlobalCustomFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [valuationMethod, setValuationMethod] = useState('FIFO');
  const [saveBanner, setSaveBanner] = useState('');

  useEffect(() => {
    setWarehousesEnabled(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    const savedFields = localStorage.getItem('shohoj_inventory_custom_fields');
    if (savedFields) {
      try { setGlobalCustomFields(JSON.parse(savedFields)); } catch(e){}
    }
    const savedValuation = localStorage.getItem('shohoj_inventory_valuation_method');
    if (savedValuation) setValuationMethod(savedValuation);
    const savedAlerts = localStorage.getItem('shohoj_inventory_low_stock_alerts');
    if (savedAlerts !== null) setLowStockAlerts(savedAlerts === 'true');

    setPageTitleOverride("Inventory Settings");
    return () => setPageTitleOverride(null);
  }, [setPageTitleOverride]);

  const showNotification = (msg: string) => {
    setSaveBanner(msg);
    setTimeout(() => setSaveBanner(''), 3500);
  };

  const addCustomField = () => {
    if (newFieldName.trim() && !globalCustomFields.includes(newFieldName.trim())) {
      const updated = [...globalCustomFields, newFieldName.trim()];
      setGlobalCustomFields(updated);
      localStorage.setItem('shohoj_inventory_custom_fields', JSON.stringify(updated));
      setNewFieldName('');
      showNotification(`Added custom field "${newFieldName.trim()}".`);
    }
  };

  const removeCustomField = (field: string) => {
    const updated = globalCustomFields.filter(f => f !== field);
    setGlobalCustomFields(updated);
    localStorage.setItem('shohoj_inventory_custom_fields', JSON.stringify(updated));
    showNotification(`Removed field "${field}".`);
  };

  const toggleWarehouses = () => {
    const newState = !warehousesEnabled;
    setWarehousesEnabled(newState);
    localStorage.setItem('shohoj_inventory_warehouses_enabled', String(newState));
    window.dispatchEvent(new Event('inventorySettingsChanged'));
    showNotification(newState ? "Multi-Warehouse module enabled!" : "Multi-Warehouse module disabled.");
  };

  const toggleAlerts = () => {
    const newState = !lowStockAlerts;
    setLowStockAlerts(newState);
    localStorage.setItem('shohoj_inventory_low_stock_alerts', String(newState));
    showNotification(newState ? "Low stock alert banners activated." : "Low stock alerts muted.");
  };

  const handleValuationChange = (val: string) => {
    setValuationMethod(val);
    localStorage.setItem('shohoj_inventory_valuation_method', val);
    showNotification(`Inventory valuation method updated to ${val}.`);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleGroup}>
          <h1>
            Inventory Settings
            <span className={styles.titleBadge}>Module Configuration</span>
          </h1>
          <p>Configure stock valuation methods, multi-warehouse routing, and global product attributes.</p>
        </div>
      </div>

      {saveBanner && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* 1. Multi-Warehouse Toggle Card */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeaderRow}>
          <div className={styles.iconTitleBlock}>
            <div 
              className={styles.iconBox} 
              style={{ 
                background: warehousesEnabled ? 'rgba(59, 130, 246, 0.15)' : 'var(--surface-hover)', 
                color: warehousesEnabled ? '#3b82f6' : 'var(--text-muted)' 
              }}
            >
              <Warehouse size={22} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Multi-Warehouse Management</h3>
              <p className={styles.cardSubtitle}>
                Enable tracking stock across multiple branches, regional depots, or fulfillment warehouses.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={toggleWarehouses}
            className={`${styles.toggleSwitch} ${warehousesEnabled ? styles.toggleSwitchActive : ''}`}
            aria-label="Toggle Multi-Warehouse"
          >
            <div className={styles.toggleKnob} />
          </button>
        </div>

        {warehousesEnabled && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingTop: '12px', 
            borderTop: '1px solid var(--border-main)',
            fontSize: '0.825rem'
          }}>
            <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> Multi-Warehouse active in navigation
            </span>
            <Link 
              href="/erp/inventory/warehouses" 
              style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Manage Warehouses <ExternalLink size={13} />
            </Link>
          </div>
        )}
      </div>

      {/* 2. Custom Product Attributes */}
      <div className={styles.settingsCard}>
        <div className={styles.iconTitleBlock}>
          <div className={styles.iconBox} style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
            <ListPlus size={22} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Custom Product Fields</h3>
            <p className={styles.cardSubtitle}>
              Define custom attribute fields (e.g. Warranty, Color, Material, Expiry) to display on all product forms.
            </p>
          </div>
        </div>

        <div className={styles.tagFieldGroup}>
          <input 
            type="text" 
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="e.g. Warranty Period, Fabric Material, Color..."
            className={styles.inputField}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustomField(); }}
          />
          <button 
            type="button" 
            onClick={addCustomField}
            className={styles.btnPrimary}
          >
            <Plus size={16} /> Add Field
          </button>
        </div>

        {globalCustomFields.length > 0 ? (
          <div className={styles.tagsContainer}>
            {globalCustomFields.map(field => (
              <div key={field} className={styles.tagPill}>
                <span>{field}</span>
                <button 
                  type="button" 
                  onClick={() => removeCustomField(field)}
                  className={styles.tagCloseBtn}
                  title={`Remove ${field}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            No custom fields configured yet. Enter a field name above to add one.
          </div>
        )}
      </div>

      {/* 3. Low Stock Alerts & Valuation Preferences */}
      <div className={styles.settingsCard}>
        <div className={styles.iconTitleBlock}>
          <div className={styles.iconBox} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Sliders size={22} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Valuation & Automated Alerts</h3>
            <p className={styles.cardSubtitle}>
              Configure inventory accounting valuation models and automated reorder notifications.
            </p>
          </div>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.configItem}>
            <label className={styles.configLabel}>Stock Valuation Model</label>
            <select 
              value={valuationMethod} 
              onChange={(e) => handleValuationChange(e.target.value)}
              className={styles.configSelect}
            >
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="MOVING_AVERAGE">Weighted Moving Average</option>
              <option value="STANDARD_COST">Standard Unit Costing</option>
            </select>
          </div>

          <div className={styles.configItem}>
            <label className={styles.configLabel}>Reporting Currency</label>
            <input 
              type="text" 
              value="BDT (৳) — Bangladeshi Taka" 
              disabled 
              className={styles.inputField} 
              style={{ opacity: 0.8, cursor: 'not-allowed' }} 
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '14px', 
          borderTop: '1px solid var(--border-main)' 
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Enable Low-Stock Amber Alert Badges
            </div>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
              Highlight items in yellow when current stock dips below the minimum threshold.
            </div>
          </div>

          <button 
            type="button"
            onClick={toggleAlerts}
            className={`${styles.toggleSwitch} ${lowStockAlerts ? styles.toggleSwitchActive : ''}`}
            aria-label="Toggle Low Stock Alerts"
          >
            <div className={styles.toggleKnob} />
          </button>
        </div>
      </div>
    </div>
  );
}
