"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useUI } from '@/lib/contexts/UIContext';

export default function InventorySettingsPage() {
  const { setPageTitleOverride } = useUI();

  const [warehousesEnabled, setWarehousesEnabled] = React.useState(false);

  useEffect(() => {
    setWarehousesEnabled(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    setPageTitleOverride("Inventory Settings");
    return () => setPageTitleOverride(null);
  }, [setPageTitleOverride]);

  const toggleWarehouses = () => {
    const newState = !warehousesEnabled;
    setWarehousesEnabled(newState);
    localStorage.setItem('shohoj_inventory_warehouses_enabled', String(newState));
    window.dispatchEvent(new Event('inventorySettingsChanged'));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', maxWidth: '800px', margin: '0 auto', paddingTop: '20px' }}>
      
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Configure your inventory preferences and advanced modules.</p>
      </div>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr' }}>
        
        {/* Warehouses Toggle Card */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-main)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              background: warehousesEnabled ? 'var(--primary-subtle)' : 'var(--surface-hover)', 
              color: warehousesEnabled ? 'var(--primary)' : 'var(--text-muted)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>warehouse</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Enable Multi-Warehouse</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Turn on this module to manage multiple locations or branches. Once enabled, it will appear in your sidebar.</p>
            </div>
          </div>
          
          <div style={{ marginLeft: '16px' }}>
            <button 
              onClick={toggleWarehouses}
              style={{
                width: '50px', height: '26px',
                borderRadius: '13px',
                background: warehousesEnabled ? 'var(--primary)' : 'var(--surface-hover)',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
                padding: 0
              }}
            >
              <div style={{
                width: '20px', height: '20px',
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: '3px',
                left: warehousesEnabled ? '27px' : '3px',
                transition: 'left 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </div>
        
        {/* Placeholder for future settings */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-main)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          opacity: 0.6
        }}>
          <div style={{ 
            width: '48px', height: '48px', 
            background: 'var(--surface-hover)', 
            color: 'var(--text-muted)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Alert Preferences</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Coming soon. Configure low stock alerts and notification rules.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
