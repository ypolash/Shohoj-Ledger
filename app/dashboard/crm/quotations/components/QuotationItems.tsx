"use client";

import React from 'react';

interface QuotationItemsProps {
  items: any[];
  readOnly?: boolean;
  onItemsChange?: (items: any[]) => void;
}

export function QuotationItems({ items, readOnly, onItemsChange }: QuotationItemsProps) {
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

  const addItem = () => {
    if (readOnly || !onItemsChange) return;
    onItemsChange([...items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (readOnly || !onItemsChange) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    onItemsChange(newItems);
  };

  const inputStyle = {
    width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-main)',
    background: 'var(--bg-main)', fontSize: '13px', color: 'var(--text-main)', outline: 'none'
  };

  return (
    <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 24px', fontWeight: 600 }}>Item & Description</th>
            <th style={{ padding: '12px 24px', fontWeight: 600, width: '100px' }}>Quantity</th>
            <th style={{ padding: '12px 24px', fontWeight: 600, width: '150px' }}>Unit Price</th>
            <th style={{ padding: '12px 24px', fontWeight: 600, width: '120px' }}>Discount</th>
            <th style={{ padding: '12px 24px', fontWeight: 600, width: '150px', textAlign: 'right' }}>Total</th>
            {!readOnly && <th style={{ padding: '12px 24px', width: '50px' }}></th>}
          </tr>
        </thead>
        <tbody style={{ fontSize: '14px' }}>
          {items.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
              <td style={{ padding: '12px 24px' }}>
                {readOnly ? item.description : (
                  <input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} style={inputStyle} placeholder="Item description" />
                )}
              </td>
              <td style={{ padding: '12px 24px' }}>
                {readOnly ? item.quantity : (
                  <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} style={inputStyle} min="1" />
                )}
              </td>
              <td style={{ padding: '12px 24px' }}>
                {readOnly ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.unitPrice) : (
                  <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} style={inputStyle} min="0" />
                )}
              </td>
              <td style={{ padding: '12px 24px' }}>
                {readOnly ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.discount) : (
                  <input type="number" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} style={inputStyle} min="0" />
                )}
              </td>
              <td style={{ padding: '12px 24px', fontWeight: 600, textAlign: 'right' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(item.total)}
              </td>
              {!readOnly && (
                <td style={{ padding: '12px 24px' }}>
                  <button type="button" onClick={() => removeItem(index)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div style={{ padding: '16px 24px' }}>
          <button type="button" onClick={addItem} style={{ padding: '8px 16px', color: 'var(--primary)', background: 'var(--primary-glow)', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + Add Line Item
          </button>
        </div>
      )}
    </div>
  );
}
