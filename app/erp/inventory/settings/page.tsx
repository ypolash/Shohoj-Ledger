"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUI } from '@/lib/contexts/UIContext';
import ProductModal from '../components/ProductModal';

export default function InventorySettingsPage() {
  const { setPageTitleOverride } = useUI();

  const [warehousesEnabled, setWarehousesEnabled] = useState(false);
  const [globalCustomFields, setGlobalCustomFields] = useState<string[]>([]);
  const [newFieldName, setNewFieldName] = useState('');

  useEffect(() => {
    setWarehousesEnabled(localStorage.getItem('shohoj_inventory_warehouses_enabled') === 'true');
    const savedFields = localStorage.getItem('shohoj_inventory_custom_fields');
    if (savedFields) {
      try { setGlobalCustomFields(JSON.parse(savedFields)); } catch(e){}
    }
    setPageTitleOverride("Inventory Settings");
    return () => setPageTitleOverride(null);
  }, [setPageTitleOverride]);

  const addCustomField = () => {
    if (newFieldName.trim() && !globalCustomFields.includes(newFieldName.trim())) {
      const updated = [...globalCustomFields, newFieldName.trim()];
      setGlobalCustomFields(updated);
      localStorage.setItem('shohoj_inventory_custom_fields', JSON.stringify(updated));
      setNewFieldName('');
    }
  };

  const removeCustomField = (field: string) => {
    const updated = globalCustomFields.filter(f => f !== field);
    setGlobalCustomFields(updated);
    localStorage.setItem('shohoj_inventory_custom_fields', JSON.stringify(updated));
  };

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

        {/* Custom Product Fields Configuration */}
        <div className="glass-panel" style={{ 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid var(--border-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              background: 'var(--primary-subtle)', 
              color: 'var(--primary)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>list_alt_add</span>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>Custom Product Fields</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Define additional fields to show on the Product Editor for all products.</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <input 
              type="text" 
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="e.g. Warranty, Color, Material"
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-main)', background: 'var(--surface-input)', color: 'var(--text-main)', fontSize: '14px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') addCustomField(); }}
            />
            <button 
              className="btn btn-primary"
              onClick={addCustomField}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Add Field
            </button>
          </div>

          {globalCustomFields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {globalCustomFields.map(field => (
                <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-hover)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-main)', fontSize: '13px', color: 'var(--text-main)' }}>
                  <span>{field}</span>
                  <button onClick={() => removeCustomField(field)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
