"use client";

import React from 'react';

interface SalesOrderItemsProps {
  items: any[];
  products?: any[];
  readOnly?: boolean;
  onItemsChange?: (items: any[]) => void;
}

export function SalesOrderItems({ items, products = [], readOnly, onItemsChange }: SalesOrderItemsProps) {
  const handleItemChange = (index: number, field: string, value: any) => {
    if (readOnly || !onItemsChange) return;
    const newItems = [...items];
    newItems[index][field] = value;
    // Calculate row total
    const qty = Number(newItems[index].quantity || 0);
    const price = Number(newItems[index].unitPrice || 0);
    const discount = Number(newItems[index].discount || 0);
    newItems[index].total = (qty * price) - discount;
    onItemsChange(newItems);
  };

  const handleProductSelect = (index: number, productId: string) => {
    if (readOnly || !onItemsChange) return;
    const newItems = [...items];
    const selectedProd = products.find(p => p.id === productId);
    
    if (selectedProd) {
      const price = Number(selectedProd.sellingPrice || selectedProd.price || selectedProd.costPrice || 0);
      const qty = Number(newItems[index].quantity || 1);
      const discount = Number(newItems[index].discount || 0);
      
      newItems[index] = {
        ...newItems[index],
        productId: selectedProd.id,
        description: selectedProd.name + (selectedProd.sku ? ` (${selectedProd.sku})` : ''),
        unitPrice: price,
        quantity: qty,
        total: (qty * price) - discount
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        productId: '',
        description: '',
        unitPrice: 0,
        total: 0
      };
    }
    onItemsChange(newItems);
  };

  const addItem = () => {
    if (readOnly || !onItemsChange) return;
    onItemsChange([...items, { id: Date.now().toString(), productId: '', description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (readOnly || !onItemsChange) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '0px',
    border: '1px solid var(--border-main)',
    background: 'var(--surface-main)',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-main)',
    outline: 'none',
    MozAppearance: 'textfield',
    appearance: 'textfield'
  };

  return (
    <div style={{ 
      overflowX: 'auto', 
      borderRadius: '0px', 
      border: '1px solid var(--border-main)', 
      background: 'var(--surface-card)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
    }}>
      <style>{`
        .sales-order-table-input::-webkit-outer-spin-button,
        .sales-order-table-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#10b981', color: '#ffffff', borderBottom: '2px solid #059669' }}>
            <th style={{ padding: '14px 20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: '260px' }}>Product (Inventory Item)</th>
            <th style={{ padding: '14px 20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '110px' }}>Quantity</th>
            <th style={{ padding: '14px 20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '150px' }}>Unit Price</th>
            <th style={{ padding: '14px 20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px' }}>Discount</th>
            <th style={{ padding: '14px 20px', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', width: '150px', textAlign: 'right' }}>Total</th>
            {!readOnly && <th style={{ padding: '14px 20px', width: '50px' }}></th>}
          </tr>
        </thead>
        <tbody style={{ fontSize: '13px' }}>
          {items.map((item, index) => (
            <tr key={item.id || index} style={{ borderBottom: '1px solid var(--border-main)', transition: 'background 0.15s ease' }}>
              <td style={{ padding: '14px 20px' }}>
                {readOnly ? (
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.description || item.product?.name || 'Selected Product'}</span>
                    {item.productId && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {item.productId}</div>}
                  </div>
                ) : (
                  <select 
                    value={item.productId || ''} 
                    onChange={(e) => handleProductSelect(index, e.target.value)} 
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    required
                  >
                    <option value="">Select Inventory Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `[${p.sku}]` : ''} - (BDT {Number(p.sellingPrice || p.price || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td style={{ padding: '14px 20px' }}>
                {readOnly ? (
                  <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                ) : (
                  <input 
                    type="number" 
                    className="sales-order-table-input"
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    style={inputStyle} 
                    min="1" 
                  />
                )}
              </td>
              <td style={{ padding: '14px 20px' }}>
                {readOnly ? (
                  <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.unitPrice)}</span>
                ) : (
                  <input 
                    type="number" 
                    className="sales-order-table-input"
                    value={item.unitPrice} 
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} 
                    style={inputStyle} 
                    min="0" 
                  />
                )}
              </td>
              <td style={{ padding: '14px 20px' }}>
                {readOnly ? (
                  <span style={{ color: item.discount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.discount)}
                  </span>
                ) : (
                  <input 
                    type="number" 
                    className="sales-order-table-input"
                    value={item.discount} 
                    onChange={(e) => handleItemChange(index, 'discount', e.target.value)} 
                    style={inputStyle} 
                    min="0" 
                  />
                )}
              </td>
              <td style={{ padding: '14px 20px', fontWeight: 800, textAlign: 'right', color: 'var(--text-main)', fontSize: '14px' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.total)}
              </td>
              {!readOnly && (
                <td style={{ padding: '14px 20px' }}>
                  <button type="button" onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Remove Item">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div style={{ padding: '16px 20px', background: 'var(--surface-hover)', borderTop: '1px solid var(--border-main)' }}>
          <button 
            type="button" 
            onClick={addItem} 
            style={{ 
              padding: '8px 18px', 
              color: '#ffffff', 
              background: '#10b981', 
              border: 'none', 
              borderRadius: '0px', 
              fontSize: '13px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Product Line
          </button>
        </div>
      )}
    </div>
  );
}
