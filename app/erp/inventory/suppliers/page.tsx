"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Edit3, 
  Trash2, 
  Eye, 
  Building2, 
  ShoppingBag,
  ExternalLink,
  Tag,
  Upload
} from 'lucide-react';
import { InventoryDataTable, InventoryColumn } from '../components/InventoryDataTable';
import styles from './SuppliersPage.module.css';
import invStyles from '../inventory.module.css';

interface SupplierCategory {
  id: string;
  name: string;
  description?: string;
}

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  logoUrl?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  taxNumber?: string | null;
  currency?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  _count?: { purchaseOrders: number; goodsReceiptNotes?: number };
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  'linear-gradient(135deg, #10b981, #047857)',
  'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #ec4899, #be185d)',
  'linear-gradient(135deg, #06b6d4, #0e7490)',
];

function getAvatarGradient(name: string = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

function getInitials(name: string = ''): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: 'Net 30',
    taxNumber: '',
    categoryId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to upload logo');
        return;
      }
      setForm(prev => ({ ...prev, logoUrl: json.fileUrl }));
    } catch (err) {
      console.error(err);
      setError('Error uploading supplier logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [supRes, catRes] = await Promise.all([
        fetch('/api/inventory/suppliers'),
        fetch('/api/supplier-categories')
      ]);

      if (supRes.ok) {
        const d = await supRes.json();
        setSuppliers(d.suppliers || []);
      }
      if (catRes.ok) {
        const c = await catRes.json();
        setCategories(c.categories || []);
      }
    } catch (e) {
      console.error('Failed to fetch suppliers:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm({
      name: '',
      logoUrl: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      paymentTerms: 'Net 30',
      taxNumber: '',
      categoryId: categories[0]?.id || '',
      status: 'ACTIVE'
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      logoUrl: supplier.logoUrl || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      paymentTerms: supplier.paymentTerms || 'Net 30',
      taxNumber: supplier.taxNumber || '',
      categoryId: supplier.categoryId || '',
      status: supplier.status || 'ACTIVE'
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = editingSupplier 
        ? `/api/inventory/suppliers/${editingSupplier.id}` 
        : '/api/inventory/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const d = await res.json();
      if (!res.ok) {
        setError(d.error || 'Failed to save supplier');
        return;
      }

      setSuccessMsg(editingSupplier ? 'Supplier updated successfully!' : 'Supplier added successfully!');
      setShowModal(false);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Network error saving supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete or deactivate supplier "${supplier.name}"?`)) return;

    try {
      const res = await fetch(`/api/inventory/suppliers/${supplier.id}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (!res.ok) {
        alert(d.error || 'Failed to delete supplier');
        return;
      }

      setSuccessMsg(d.message || `Supplier "${supplier.name}" removed successfully!`);
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
      alert('Error deleting supplier');
    }
  };

  // KPI Calculations
  const totalCount = suppliers.length;
  const activeCount = useMemo(() => suppliers.filter(s => s.status === 'ACTIVE').length, [suppliers]);
  const totalOrders = useMemo(() => suppliers.reduce((sum, s) => sum + (s._count?.purchaseOrders || 0), 0), [suppliers]);
  const categoriesTotal = categories.length;

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = 
        !search.trim() ||
        s.name.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || s.categoryId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [suppliers, search, statusFilter, categoryFilter]);

  // Universal Table Columns
  const columns: InventoryColumn<Supplier>[] = [
    {
      key: 'supplierCode',
      header: 'Code',
      width: '120px',
      render: (s) => (
        <span style={{ 
          fontFamily: 'monospace', 
          fontSize: '12px', 
          fontWeight: 700, 
          padding: '3px 8px', 
          borderRadius: '0px', 
          background: 'rgba(56, 189, 248, 0.1)', 
          color: 'var(--primary, #38bdf8)',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          {s.supplierCode}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Supplier & Vendor',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {s.logoUrl ? (
            <div 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '0px', 
                overflow: 'hidden', 
                border: '1px solid var(--border-main)',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <img 
                src={s.logoUrl} 
                alt={s.name} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
          ) : (
            <div 
              className={styles.avatarBadge} 
              style={{ background: getAvatarGradient(s.name), borderRadius: '0px' }}
            >
              {getInitials(s.name) || 'SP'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>
              {s.name}
            </div>
            {s.category ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '11px', 
                color: 'var(--text-secondary)',
                marginTop: '2px' 
              }}>
                <Tag size={10} />
                {s.category.name}
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                General Supplier
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>
            {s.contactPerson || '—'}
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {s.phone && (
              <a href={`tel:${s.phone}`} className={styles.contactLink} title="Call Phone">
                <Phone size={12} />
                <span>{s.phone}</span>
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className={styles.contactLink} title="Send Email">
                <Mail size={12} />
                <span>{s.email}</span>
              </a>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Location / City',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <MapPin size={14} color="var(--text-muted)" />
          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {s.address || '—'}
          </span>
        </div>
      )
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      width: '130px',
      render: (s) => (
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          color: 'var(--text-main)', 
          background: 'var(--surface-hover)', 
          padding: '4px 10px', 
          borderRadius: '0px', 
          border: '1px solid var(--border-main)' 
        }}>
          {s.paymentTerms || 'Standard'}
        </span>
      )
    },
    {
      key: 'orders',
      header: 'Purchase Orders',
      width: '130px',
      align: 'center',
      render: (s) => (
        <Link 
          href={`/erp/inventory/purchases?search=${encodeURIComponent(s.name)}`}
          style={{ textDecoration: 'none' }}
          title="View linked purchases"
        >
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '3px 10px', 
            borderRadius: '0px', 
            background: 'rgba(37, 99, 235, 0.1)', 
            color: 'var(--primary, #2563eb)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            <ShoppingBag size={12} />
            {s._count?.purchaseOrders || 0} POs
          </span>
        </Link>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (s) => {
        let pillClass = styles.statusActive;
        let label = 'Active';
        if (s.status === 'INACTIVE') {
          pillClass = styles.statusInactive;
          label = 'Inactive';
        } else if (s.status === 'SUSPENDED') {
          pillClass = styles.statusSuspended;
          label = 'Suspended';
        }

        return (
          <span className={`${styles.statusPill} ${pillClass}`}>
            <span className={styles.statusDot} />
            {label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      render: (s) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setViewingSupplier(s)}
            className={styles.iconBtn}
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => openEditModal(s)}
            className={styles.iconBtn}
            title="Edit Supplier"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={() => handleDelete(s)}
            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
            title="Delete / Deactivate"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={invStyles.headerCard}>
        <div className={invStyles.headerTitleGroup}>
          <h1 className={invStyles.pageTitle}>
            Suppliers & Vendors
            <span className={invStyles.titleBadge}>{totalCount} Registered</span>
          </h1>
        </div>

        <div className={invStyles.headerActions}>
          <button 
            className={invStyles.headerIconBtn}
            onClick={handleRefresh}
            title="Refresh Suppliers"
            aria-label="Refresh Suppliers"
            disabled={isLoading}
          >
            <span 
              className={`material-symbols-outlined ${isRefreshing || isLoading ? invStyles.spinning : ''}`} 
              style={{ fontSize: '20px' }}
            >
              refresh
            </span>
          </button>

          <button 
            className={`${invStyles.headerIconBtn} ${invStyles.headerIconBtnPrimary}`}
            onClick={openCreateModal}
            title="Add New Supplier"
            aria-label="Add New Supplier"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              add
            </span>
          </button>
        </div>
      </header>

      {/* Success Notification Alert */}
      {successMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '0px',
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
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Universal Inventory Table with Filter Slot */}
      <InventoryDataTable
        columns={columns}
        data={filteredSuppliers}
        isLoading={isLoading}
        emptyIcon="local_shipping"
        emptyTitle="No suppliers found"
        emptySubtitle="Add your vendors and suppliers to begin logging inventory purchases and stock intakes."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, code, contact, phone, or location..."
        filterSlot={
          <div className={styles.filterRow}>
            {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`${styles.filterBtn} ${statusFilter === status ? styles.filterBtnActive : ''}`}
              >
                <span>{status === 'ALL' ? 'All Status' : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                <span className={styles.filterCountBadge}>
                  {status === 'ALL' ? suppliers.length : suppliers.filter(s => s.status === status).length}
                </span>
              </button>
            ))}

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className={styles.formSelect}
                style={{ width: 'auto', padding: '6px 12px', fontSize: '13px', borderRadius: '0px' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* 4. Add / Edit Supplier Modal */}
      {showModal && (
        <div 
          className={styles.modalOverlay}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className={styles.modalContent} style={{ borderRadius: '0px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <Truck size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.modalCloseBtn}
                style={{ borderRadius: '0px' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '0px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Supplier Logo Option */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier Logo (Optional)</label>
                <div className={styles.logoSection} style={{ borderRadius: '0px' }}>
                  <div className={styles.logoPreviewBox} style={{ borderRadius: '0px' }}>
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Supplier Logo" className={styles.logoImg} />
                    ) : (
                      <div className={styles.logoPlaceholder}>
                        <Building2 size={24} />
                      </div>
                    )}
                  </div>

                  <div className={styles.logoUploadDetails}>
                    <span className={styles.logoUploadTitle}>
                      {form.logoUrl ? 'Logo Uploaded' : 'Upload or set Logo URL'}
                    </span>
                    <span className={styles.logoUploadSubtitle}>
                      PNG, JPG, SVG, WebP supported
                    </span>
                    <div className={styles.logoUploadBtns}>
                      <input 
                        type="file" 
                        ref={logoInputRef} 
                        onChange={handleLogoUpload} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                      />
                      <button 
                        type="button" 
                        className={styles.logoBtn}
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        style={{ borderRadius: '0px' }}
                      >
                        <Upload size={13} />
                        {isUploadingLogo ? 'Uploading...' : form.logoUrl ? 'Change Logo' : 'Upload Image'}
                      </button>
                      {form.logoUrl && (
                        <button 
                          type="button" 
                          className={styles.logoRemoveBtn}
                          onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}
                          style={{ borderRadius: '0px' }}
                        >
                          <X size={12} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional direct URL input */}
                <input 
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={form.logoUrl}
                  onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                  className={styles.formInput}
                  style={{ borderRadius: '0px', marginTop: '6px', fontSize: '12px' }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier / Business Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Delta Beverage Supplies Ltd."
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className={styles.formInput}
                  style={{ borderRadius: '0px' }}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Person</label>
                  <input 
                    type="text"
                    placeholder="e.g. Rafiqul Islam"
                    value={form.contactPerson}
                    onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                    className={styles.formInput}
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Phone Number</label>
                  <input 
                    type="tel"
                    placeholder="e.g. +880 1711 000000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className={styles.formInput}
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input 
                    type="email"
                    placeholder="e.g. sales@deltabev.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={styles.formInput}
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Terms</label>
                  <select
                    value={form.paymentTerms}
                    onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                    className={styles.formSelect}
                    style={{ borderRadius: '0px' }}
                  >
                    <option value="Immediate / COD">Immediate / Cash on Delivery</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Advance 100%">100% Advance Payment</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Supplier Category</label>
                  <select
                    value={form.categoryId}
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    className={styles.formSelect}
                    style={{ borderRadius: '0px' }}
                  >
                    <option value="">— Select Category (Optional) —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tax / VAT / License #</label>
                  <input 
                    type="text"
                    placeholder="e.g. BIN-100293849"
                    value={form.taxNumber}
                    onChange={e => setForm({ ...form, taxNumber: e.target.value })}
                    className={styles.formInput}
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Business Address / Location</label>
                  <input 
                    type="text"
                    placeholder="e.g. Plot 42, Tejgaon I/A, Dhaka"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className={styles.formInput}
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Account Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className={styles.formSelect}
                    style={{ borderRadius: '0px' }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className={styles.actionBtnRow}>
                <button 
                  type="button" 
                  className={styles.btnSecondary} 
                  onClick={() => setShowModal(false)}
                  style={{ borderRadius: '0px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnPrimary} 
                  disabled={submitting}
                  style={{ borderRadius: '0px' }}
                >
                  {submitting ? 'Saving Supplier...' : editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Quick View Supplier Modal */}
      {viewingSupplier && (
        <div 
          className={styles.modalOverlay}
          onClick={e => { if (e.target === e.currentTarget) setViewingSupplier(null); }}
        >
          <div className={styles.modalContent} style={{ maxWidth: '480px', borderRadius: '0px' }}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {viewingSupplier.logoUrl ? (
                  <div 
                    style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '0px', 
                      overflow: 'hidden', 
                      border: '1px solid var(--border-main)',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      src={viewingSupplier.logoUrl} 
                      alt={viewingSupplier.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                ) : (
                  <div 
                    className={styles.avatarBadge} 
                    style={{ width: '46px', height: '46px', fontSize: '18px', background: getAvatarGradient(viewingSupplier.name), borderRadius: '0px' }}
                  >
                    {getInitials(viewingSupplier.name) || 'SP'}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {viewingSupplier.name}
                  </h3>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary)' }}>
                    {viewingSupplier.supplierCode}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setViewingSupplier(null)}
                className={styles.modalCloseBtn}
                style={{ borderRadius: '0px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 700, fontSize: '13px', color: viewingSupplier.status === 'ACTIVE' ? '#10b981' : '#f59e0b' }}>
                  {viewingSupplier.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contact Person</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.contactPerson || 'Not provided'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Phone</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.phone || '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.email || '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Address</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.address || '—'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Payment Terms</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.paymentTerms || 'Standard'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Category</span>
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
                  {viewingSupplier.category?.name || 'Uncategorized'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '0px', background: 'var(--surface-hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Linked Orders</span>
                <Link 
                  href={`/erp/inventory/purchases?search=${encodeURIComponent(viewingSupplier.name)}`}
                  style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {viewingSupplier._count?.purchaseOrders || 0} Purchase Orders <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button 
                type="button" 
                className={styles.btnSecondary} 
                onClick={() => setViewingSupplier(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={styles.btnPrimary} 
                onClick={() => {
                  const s = viewingSupplier;
                  setViewingSupplier(null);
                  openEditModal(s);
                }}
              >
                <Edit3 size={16} /> Edit Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
