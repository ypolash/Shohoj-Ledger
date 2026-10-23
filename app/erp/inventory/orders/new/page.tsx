"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  UserPlus, 
  UserCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Package,
  Calendar,
  Save,
  Check,
  ChevronRight,
  RotateCcw,
  RefreshCw,
  Building,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import styles from './CreateOrder.module.css';

interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  unit?: string;
  availableStock: number;
  quantity: number | string;
  unitPrice: number | string;
  total: number;
}

interface CustomerData {
  id?: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  address?: string;
  isSavedToCrm?: boolean;
}

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams ? (searchParams.get('from') || searchParams.get('returnUrl')) : null;
  const returnUrl = fromParam || '/erp/inventory/orders';
  const isFromOrdersHub = fromParam === '/erp/orders' || fromParam?.startsWith('/erp/orders');

  const orderFormRef = useRef<HTMLDivElement>(null);

  // Data
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Step 1: Customer Mode ('new' | 'existing') - default is 'new'
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  
  // New Customer Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Existing Customer Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmed Customer state (triggers the order form to pop up from down side)
  const [confirmedCustomer, setConfirmedCustomer] = useState<CustomerData | null>(null);

  // Order Details Form State
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [status, setStatus] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  // Line Items
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  // When customer is confirmed, smoothly scroll down to order form
  useEffect(() => {
    if (confirmedCustomer) {
      setTimeout(() => {
        orderFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [confirmedCustomer]);

  const loadInitialData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/crm/customers?take=200'),
        fetch('/api/inventory/products?limit=250')
      ]);

      if (cRes.ok) {
        const d = await cRes.json();
        setCrmCustomers(d.customers || d.data || []);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProducts(d.products || []);
      }
    } catch (e) {
      console.error("Error loading initial order data:", e);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Filtered CRM customers for Existing Customer search
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return crmCustomers.slice(0, 8); // show top 8 initial customers
    }
    return crmCustomers.filter(c => {
      const name = (c.name || c.displayName || '').toLowerCase();
      const phone = (c.phone || c.mobile || '').toLowerCase();
      const code = (c.customerCode || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q) || email.includes(q);
    }).slice(0, 15);
  }, [crmCustomers, searchQuery]);

  // Handle Save Customer to CRM Directory
  const handleSaveCustomerToCRM = async () => {
    if (!newName.trim()) {
      setErrorMsg("Please enter the customer name.");
      return;
    }

    setSavingCustomer(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        customerName: newName.trim(),
        displayName: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        shippingAddress: newAddress.trim() || undefined,
        billingAddress: newAddress.trim() || undefined
      };

      const res = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save customer to CRM");
      }

      const createdCustomer = data.customer || data;
      const custObj: CustomerData = {
        id: createdCustomer.id,
        name: createdCustomer.name || newName.trim(),
        displayName: createdCustomer.displayName || newName.trim(),
        phone: createdCustomer.phone || newPhone.trim(),
        email: createdCustomer.email || newEmail.trim(),
        address: newAddress.trim(),
        isSavedToCrm: true
      };

      // Add to local CRM list as well
      setCrmCustomers(prev => [createdCustomer, ...prev]);
      setConfirmedCustomer(custObj);
      setSuccessMsg(`Customer "${custObj.name}" successfully registered in CRM directory!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save customer.");
    } finally {
      setSavingCustomer(false);
    }
  };

  // Handle Quick Proceed as Guest / Walk-in without saving to CRM
  const handleProceedAsGuest = () => {
    if (!newName.trim()) {
      setErrorMsg("Please enter the customer name to proceed.");
      return;
    }

    setErrorMsg('');
    setConfirmedCustomer({
      name: newName.trim(),
      displayName: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      address: newAddress.trim(),
      isSavedToCrm: false
    });
  };

  // Handle Select Existing Customer from CRM Search
  const handleSelectExistingCustomer = (c: any) => {
    setErrorMsg('');
    setConfirmedCustomer({
      id: c.id,
      name: c.name || c.displayName,
      displayName: c.displayName || c.name,
      phone: c.phone || c.mobile || '',
      email: c.email || '',
      address: c.addresses?.[0]?.addressLine1 || c.billingAddress || c.shippingAddress || '',
      isSavedToCrm: true
    });
  };

  // Reset Customer selection to change or re-select
  const handleResetCustomer = () => {
    setConfirmedCustomer(null);
    setSuccessMsg('');
    setErrorMsg('');
  };

  // Product Line Item handlers
  const handleAddProduct = (prodId: string) => {
    if (!prodId) return;
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const existingIndex = items.findIndex(i => i.productId === prod.id);
    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = (Number(updated[existingIndex].quantity) || 0) + 1;
      const unitPrice = Number(updated[existingIndex].unitPrice) || 0;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * unitPrice;
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

  const handleUpdateItem = (id: string, field: 'quantity' | 'unitPrice', val: number | string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      updated.total = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Financial Calculations
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const totalItemCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const grandTotal = subtotal;

  // Handle Order Submit
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedCustomer) {
      setErrorMsg("Please select or save a customer first.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Please add at least one product line item to this order.");
      return;
    }

    setSubmittingOrder(true);
    setErrorMsg('');

    const payload: any = {
      customerId: confirmedCustomer.id || undefined,
      temporaryCustomer: !confirmedCustomer.id ? {
        name: confirmedCustomer.name,
        phone: confirmedCustomer.phone,
        email: confirmedCustomer.email,
        address: confirmedCustomer.address
      } : undefined,
      orderDate,
      expectedDelivery: expectedDelivery || undefined,
      status,
      remarks: notes || undefined,
      lines: items.map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
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
        throw new Error(d.error || 'Failed to create sales order');
      }

      router.push(returnUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error saving order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Top Navigation */}
      <div className={styles.topNav}>
        <button 
          onClick={() => router.push(returnUrl)}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>{isFromOrdersHub ? 'Back to Orders' : 'Back to Inventory Orders'}</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className={styles.pageHeader}>
        <div className={styles.headerIcon}>
          <ShoppingCart size={26} />
        </div>
        <div className={styles.headerText}>
          <h1>Create Order</h1>
          <p>Register customer details, configure line items, and generate fulfillment order.</p>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 0,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 0,
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================================================================== */}
      {/* STEP 1: CUSTOMER SELECTION & INPUT                                 */}
      {/* ================================================================== */}
      {!confirmedCustomer ? (
        <div className={styles.selectorCard}>
          <div className={styles.selectorTitle}>
            <span>1. Select Customer Type</span>
          </div>

          {/* Two Prominent Icon Button Views */}
          <div className={styles.customerButtonsGrid}>
            {/* Button 1: New Customer (Default) */}
            <button
              type="button"
              className={`${styles.customerChoiceBtn} ${customerMode === 'new' ? styles.customerChoiceBtnActive : ''}`}
              onClick={() => {
                setCustomerMode('new');
                setErrorMsg('');
              }}
            >
              <div className={`${styles.choiceIconBox} ${styles.choiceIconBoxNew}`}>
                <UserPlus size={26} />
              </div>
              <div className={styles.choiceText}>
                <span className={styles.choiceTitle}>New Customer</span>
                <span className={styles.choiceSubtitle}>Fill in customer details & optionally save to CRM directory</span>
              </div>
              {customerMode === 'new' && (
                <div className={styles.choiceCheckBadge}>
                  <Check size={14} />
                </div>
              )}
            </button>

            {/* Button 2: Existing Customer from CRM */}
            <button
              type="button"
              className={`${styles.customerChoiceBtn} ${customerMode === 'existing' ? styles.customerChoiceBtnActive : ''}`}
              onClick={() => {
                setCustomerMode('existing');
                setErrorMsg('');
              }}
            >
              <div className={`${styles.choiceIconBox} ${styles.choiceIconBoxExisting}`}>
                <UserCheck size={26} />
              </div>
              <div className={styles.choiceText}>
                <span className={styles.choiceTitle}>Existing Customer</span>
                <span className={styles.choiceSubtitle}>Search & select from registered CRM customer directory</span>
              </div>
              {customerMode === 'existing' && (
                <div className={styles.choiceCheckBadge}>
                  <Check size={14} />
                </div>
              )}
            </button>
          </div>

          {/* New Customer Form (Default) */}
          {customerMode === 'new' && (
            <div className={styles.newCustomerSection}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Customer Name <span className={styles.requiredAsterisk}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation / Rahim Ahmed"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className={styles.inputField}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1712-345678"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Delivery / Shipping Address</label>
                  <input
                    type="text"
                    placeholder="e.g. House 42, Road 7, Banani, Dhaka"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>

              {/* Action Buttons: Continue & Save (Right Aligned) */}
              <div className={styles.saveCustomerBar}>
                <button
                  type="button"
                  onClick={handleProceedAsGuest}
                  disabled={!newName.trim()}
                  className={styles.guestProceedBtn}
                  title="Continue to order form"
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustomerToCRM}
                  disabled={savingCustomer || !newName.trim()}
                  className={styles.saveCustomerBtn}
                  title="Save customer to CRM directory and proceed"
                >
                  {savingCustomer ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Existing Customer Section: ONLY Search Field */}
          {customerMode === 'existing' && (
            <div className={styles.existingCustomerSection}>
              <div className={styles.searchWrapper}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search customer by name, phone number, company, or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
              </div>

              {/* Customer Results List */}
              <div className={styles.searchResultsList}>
                {loadingInitial ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading CRM customers directory...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No matching customers found in CRM directory. Try a different query or switch to "New Customer".
                  </div>
                ) : (
                  filteredCustomers.map(c => {
                    const displayName = c.displayName || c.name || 'Unnamed Customer';
                    const phone = c.phone || c.mobile || 'No phone';
                    const code = c.customerCode ? `[${c.customerCode}]` : '';

                    return (
                      <div
                        key={c.id}
                        className={styles.customerResultItem}
                        onClick={() => handleSelectExistingCustomer(c)}
                      >
                        <div className={styles.resultInfo}>
                          <div className={styles.resultAvatar}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.resultDetails}>
                            <span className={styles.resultName}>
                              {displayName} <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '12px' }}>{code}</span>
                            </span>
                            <span className={styles.resultMeta}>
                              <Phone size={12} /> {phone}
                              {c.email && (
                                <>
                                  <span>•</span>
                                  <Mail size={12} /> {c.email}
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <span className={styles.selectPill}>Select Customer</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Confirmed Customer Summary Ribbon */
        <div className={styles.confirmedBanner}>
          <div className={styles.confirmedInfo}>
            <div className={styles.confirmedIcon}>
              <Check size={22} />
            </div>
            <div>
              <div className={styles.confirmedTitle}>
                {confirmedCustomer.displayName || confirmedCustomer.name}
                {confirmedCustomer.isSavedToCrm && (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    marginLeft: '8px', 
                    padding: '2px 8px', 
                    borderRadius: 0, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}>
                    CRM Customer
                  </span>
                )}
              </div>
              <div className={styles.confirmedDetails}>
                {confirmedCustomer.phone && (
                  <span>
                    <Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                    {confirmedCustomer.phone}
                  </span>
                )}
                {confirmedCustomer.email && (
                  <>
                    <span>•</span>
                    <span>{confirmedCustomer.email}</span>
                  </>
                )}
                {confirmedCustomer.address && (
                  <>
                    <span>•</span>
                    <span>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                      {confirmedCustomer.address}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetCustomer}
            className={styles.changeCustomerBtn}
            title="Change or reselect customer"
          >
            <RotateCcw size={14} />
            <span>Change Customer</span>
          </button>
        </div>
      )}

      {/* ================================================================== */}
      {/* STEP 2: ORDER FORM (APPEARS POPPING UP FROM DOWN SIDE)             */}
      {/* ================================================================== */}
      {confirmedCustomer && (
        <form 
          ref={orderFormRef} 
          onSubmit={handleCreateOrder} 
          className={styles.orderPopupCard}
        >
          <div className={styles.sectionHeading}>
            <Package size={20} color="var(--primary)" />
            <span>2. Order Specifications &amp; Line Items</span>
          </div>

          {/* Dates & Status Grid */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Order Date *</label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                required
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Expected Delivery Date</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={e => setExpectedDelivery(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Order Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={styles.inputField}
              >
                <option value="APPROVED">Approved / Confirmed</option>
                <option value="Open">Open / Draft</option>
                <option value="Delivered">Delivered / Completed</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                <span>Line Items ({items.length})</span>
              </div>

              {/* Add Product Selector */}
              <div style={{ minWidth: '320px', flex: 1, maxWidth: '480px' }}>
                <select
                  value={selectedProductToAdd}
                  onChange={e => {
                    setSelectedProductToAdd(e.target.value);
                    handleAddProduct(e.target.value);
                  }}
                  className={styles.inputField}
                  style={{ fontSize: '13px' }}
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

            {/* Products Table */}
            {items.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                border: '1.5px dashed var(--border-main)',
                borderRadius: 0,
                color: 'var(--text-muted)',
                fontSize: '13px'
              }}>
                <Package size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No products added yet. Use the dropdown above to add items to this order.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.productsTable}>
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th style={{ width: '110px' }}>Stock</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Qty</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Unit Price (৳)</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Total (৳)</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>
                            {item.productName}
                          </div>
                          {item.sku && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              SKU: {item.sku}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: item.availableStock > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {item.availableStock} {item.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)}
                            className={styles.qtyInput}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={e => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                            className={styles.priceInput}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '14px' }}>
                          ৳{item.total.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className={styles.deleteItemBtn}
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
            )}
          </div>

          {/* Remarks & Financial Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Order Remarks / Instructions</label>
              <textarea
                rows={4}
                placeholder="Add special packaging, shipping remarks, or customer notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={styles.inputField}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Totals Summary */}
            <div className={styles.totalsCard}>
              <div className={styles.totalRow}>
                <span>Total Items</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{totalItemCount} items</span>
              </div>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>৳{subtotal.toLocaleString()}</span>
              </div>
              <div className={styles.grandTotalRow}>
                <span>Grand Total</span>
                <span className={styles.grandTotalAmount}>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className={styles.submitBar}>
            <button
              type="submit"
              disabled={submittingOrder || items.length === 0}
              className={styles.submitOrderBtn}
            >
              {submittingOrder ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Create Order...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
