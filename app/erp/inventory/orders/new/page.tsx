"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  Search, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import styles from '../OrdersPage.module.css';

interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewInventoryOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [customerMode, setCustomerMode] = useState<'existing' | 'walkin'>('existing');
  const [customerId, setCustomerId] = useState('');
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinAddress, setWalkinAddress] = useState('');

  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  // Line Items
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/crm/customers?take=200'),
        fetch('/api/inventory/products?limit=250')
      ]);

      if (cRes.ok) {
        const d = await cRes.json();
        setCustomers(d.customers || d.data || []);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.products || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleAddProduct = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
      setSelectedProductToAdd('');
      return;
    }

    const newItem: OrderLineItem = {
      id: Math.random().toString(36).substring(2, 9),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit || 'pcs',
      availableStock: prod.currentStock ?? 0,
      quantity: 1,
      unitPrice: Number(prod.sellingPrice || 0),
      total: Number(prod.sellingPrice || 0)
    };

    setItems([...items, newItem]);
    setSelectedProductToAdd('');
  };

  const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice', val: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Financial Totals
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const grandTotal = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerMode === 'existing' && !customerId) {
      setError("Please select a customer for this order.");
      return;
    }
    if (customerMode === 'walkin' && !walkinName.trim()) {
      setError("Please enter customer name.");
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one product line item.");
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      customerId: customerMode === 'existing' ? customerId : undefined,
      temporaryCustomer: customerMode === 'walkin' ? {
        name: walkinName.trim(),
        phone: walkinPhone.trim(),
        address: walkinAddress.trim()
      } : undefined,
      orderDate,
      expectedDelivery: expectedDelivery || undefined,
      status,
      remarks: notes || undefined,
      lines: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        remarks: i.productName
      }))
    };

    try {
      const res = await fetch('/api/crm/sales-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to create sales order');
        return;
      }

      router.push('/erp/inventory/orders');
    } catch (e) {
      setError('Network error saving order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button 
          onClick={() => router.push('/erp/inventory/orders')}
          className={styles.btnSecondary}
        >
          <ArrowLeft size={16} />
          <span>Back to Inventory Orders</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-main)', paddingBottom: '16px' }}>
          <div className={styles.kpiIcon} style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Create Inventory Order
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Record a new customer order with live inventory deduction and fulfillment tracking.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠ {error}
          </div>
        )}

        {/* Customer Information Card */}
        <div style={{ background: 'var(--surface-hover)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <User size={18} color="var(--primary)" />
              <span>Customer Information</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`${styles.statusTab} ${customerMode === 'existing' ? styles.statusTabActive : ''}`}
                onClick={() => setCustomerMode('existing')}
              >
                Existing Account
              </button>
              <button
                type="button"
                className={`${styles.statusTab} ${customerMode === 'walkin' ? styles.statusTabActive : ''}`}
                onClick={() => setCustomerMode('walkin')}
              >
                Walk-in / Temporary
              </button>
            </div>
          </div>

          {customerMode === 'existing' ? (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Customer *</label>
              <select 
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                required={customerMode === 'existing'}
                className={styles.formSelect}
              >
                <option value="">— Search & Select Customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Customer Name"
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  required={customerMode === 'walkin'}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +880 1700-000000"
                  value={walkinPhone}
                  onChange={e => setWalkinPhone(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label className={styles.formLabel}>Delivery Address</label>
                <input 
                  type="text" 
                  placeholder="Delivery address..."
                  value={walkinAddress}
                  onChange={e => setWalkinAddress(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Dates & Status */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Order Date *</label>
            <input 
              type="date"
              value={orderDate}
              onChange={e => setOrderDate(e.target.value)}
              required
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Expected Delivery Date</label>
            <input 
              type="date"
              value={expectedDelivery}
              onChange={e => setExpectedDelivery(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Order Status</label>
            <select 
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={styles.formSelect}
            >
              <option value="APPROVED">Approved / Confirmed</option>
              <option value="Open">Open / Draft</option>
              <option value="Delivered">Delivered / Completed</option>
            </select>
          </div>
        </div>

        {/* Product Items Selection & Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              <Package size={18} color="var(--primary)" />
              <span>Order Line Items ({items.length})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '320px' }}>
              <select
                value={selectedProductToAdd}
                onChange={e => {
                  setSelectedProductToAdd(e.target.value);
                  handleAddProduct(e.target.value);
                }}
                className={styles.formSelect}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="">+ Add Product from Catalog...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.productCode}) — Stock: {p.currentStock ?? 0} {p.unit || 'pcs'} @ ৳{p.sellingPrice}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {items.length > 0 ? (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-main)', borderRadius: '12px' }}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ width: '120px' }}>Available</th>
                    <th style={{ width: '130px' }}>Quantity</th>
                    <th style={{ width: '150px' }}>Unit Price (৳)</th>
                    <th style={{ width: '150px' }}>Total (৳)</th>
                    <th style={{ width: '50px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.productName}</div>
                        {item.sku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.availableStock > 0 ? '#10b981' : '#ef4444' }}>
                          {item.availableStock} {item.unit}
                        </span>
                      </td>
                      <td>
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className={styles.formInput}
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className={styles.formInput}
                          style={{ padding: '6px 10px', fontSize: '0.85rem', fontFamily: 'monospace' }}
                        />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        ৳{item.total.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px dashed var(--border-main)', color: 'var(--text-muted)' }}>
              Select a product from the dropdown above to add items to this order.
            </div>
          )}
        </div>

        {/* Financial Summary Box */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px 20px',
          background: 'var(--surface-hover)',
          borderRadius: '14px',
          border: '1px solid var(--border-main)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>৳{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', borderTop: '1px solid var(--border-main)', paddingTop: '8px' }}>
              <span>Grand Total:</span>
              <span style={{ fontFamily: 'monospace' }}>৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Internal Remarks / Shipping Notes</label>
          <textarea 
            rows={3}
            placeholder="Special delivery instructions, tracking IDs, or notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={styles.formTextarea}
          />
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            type="button" 
            onClick={() => router.push('/erp/inventory/orders')}
            className={styles.btnSecondary}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.btnPrimary}
            disabled={submitting}
          >
            {submitting ? "Processing Order..." : "Confirm & Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
