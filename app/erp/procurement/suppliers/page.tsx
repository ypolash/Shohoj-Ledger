"use client";

import React, { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SupplierCategory {
  id: string;
  name: string;
  description: string | null;
  _count: { suppliers: number };
}

interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  address: string | null;
  paymentTerms: string | null;
  status: string;
  outstandingBalance: number;
  category: { id: string; name: string } | null;
  _count: { purchaseOrders: number };
}

// ─── Utility ─────────────────────────────────────────────────────────────────
const statusColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "var(--success-subtle)", color: "var(--success)" },
  INACTIVE: { bg: "var(--danger-subtle)", color: "var(--danger)" },
  BLOCKED: { bg: "var(--warning-subtle)", color: "var(--warning)" },
};

const ls: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: "6px"
};
const is: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: "10px",
  border: "1px solid var(--border-main)", background: "var(--surface-input)",
  color: "var(--text-main)", fontSize: "14px", boxSizing: "border-box"
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [error, setError] = useState("");

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    name: "", email: "", phone: "", contactPerson: "",
    address: "", paymentTerms: "", categoryId: "", status: "ACTIVE"
  });
  const [catForm, setCatForm] = useState({ name: "", description: "" });

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/inventory/suppliers${activeCategory !== "ALL" ? `?categoryId=${activeCategory}` : ""}`),
        fetch("/api/supplier-categories")
      ]);
      if (sRes.ok) setSuppliers((await sRes.json()).suppliers || []);
      if (cRes.ok) setCategories((await cRes.json()).categories || []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [activeCategory]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create supplier");
      setShowAddSupplier(false);
      setSupplierForm({ name: "", email: "", phone: "", contactPerson: "", address: "", paymentTerms: "", categoryId: "", status: "ACTIVE" });
      fetchAll();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatSaving(true); setError("");
    try {
      const res = await fetch("/api/supplier-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      setCatForm({ name: "", description: "" });
      fetchAll();
    } catch (e: any) { setError(e.message); }
    finally { setCatSaving(false); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Suppliers in this category will become uncategorised.`)) return;
    try {
      await fetch(`/api/supplier-categories/${id}`, { method: "DELETE" });
      if (activeCategory === id) setActiveCategory("ALL");
      fetchAll();
    } catch (e) { alert("Failed to delete category"); }
  };

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.supplierCode || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((s, v) => s + Number(v.outstandingBalance || 0), 0);

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text-main)" }}>Vendor / Supplier Management</h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--text-muted)" }}>
            Manage product vendors and service vendors in separate categories.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => { setShowManageCategories(true); setError(""); }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>category</span>
            Manage Categories
          </button>
          <button className="btn btn-primary hover-lift" onClick={() => { setShowAddSupplier(true); setError(""); }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
        {[
          { label: "Total Vendors", value: suppliers.length, icon: "store", color: "var(--primary)" },
          { label: "Product Vendors", value: categories.find(c => c.name.toLowerCase().includes("product") || c.name.toLowerCase().includes("goods"))?._count.suppliers ?? "—", icon: "inventory_2", color: "var(--success)" },
          { label: "Service Vendors", value: categories.find(c => c.name.toLowerCase().includes("service") || c.name.toLowerCase().includes("contractor"))?._count.suppliers ?? "—", icon: "engineering", color: "var(--accent)" },
          { label: "Outstanding", value: `৳${Number(totalOutstanding).toLocaleString()}`, icon: "payments", color: "var(--warning)" },
        ].map((k, i) => (
          <div key={i} className="glass-panel" style={{ padding: "18px", borderRadius: "14px", border: "1px solid var(--border-main)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: k.color }}>{k.icon}</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-main)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveCategory("ALL")}
          style={{
            padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--border-main)",
            background: activeCategory === "ALL" ? "var(--primary)" : "var(--surface-card)",
            color: activeCategory === "ALL" ? "#fff" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s"
          }}>
          All ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveCategory("UNCATEGORISED")}
          style={{
            padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--border-main)",
            background: activeCategory === "UNCATEGORISED" ? "var(--text-muted)" : "var(--surface-card)",
            color: activeCategory === "UNCATEGORISED" ? "#fff" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s"
          }}>
          Uncategorised ({suppliers.filter(s => !s.category).length})
        </button>
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "8px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--border-main)",
              background: activeCategory === cat.id ? "var(--primary)" : "var(--surface-card)",
              color: activeCategory === cat.id ? "#fff" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.15s"
            }}>
            {cat.name} ({cat._count.suppliers})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", maxWidth: "420px" }}>
        <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: "var(--text-muted)" }}>search</span>
        <input type="text" placeholder="Search by name, email, or code..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...is, paddingLeft: "40px" }} />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "var(--surface-hover)", borderBottom: "1px solid var(--border-main)" }}>
                {["Vendor", "Category", "Contact", "Payment Terms", "POs", "Status", "Balance"].map(h => (
                  <th key={h} style={{ padding: "14px 16px", color: "var(--text-muted)", fontWeight: 600, fontSize: "12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-main)" }}>
                    <td colSpan={7} style={{ padding: "16px" }}>
                      <div style={{ height: "16px", background: "var(--surface-hover)", borderRadius: "6px", opacity: 0.6 }} />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "48px", display: "block", opacity: 0.3, marginBottom: "12px" }}>store_off</span>
                    No vendors found. Add your first vendor using the button above.
                  </td>
                </tr>
              ) : filtered.map(v => {
                const sc = statusColors[v.status] || statusColors.ACTIVE;
                return (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border-main)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
                          background: "var(--primary-subtle)", color: "var(--primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "13px"
                        }}>{getInitials(v.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{v.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.supplierCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {v.category ? (
                        <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: "var(--accent-subtle)", color: "var(--accent)", whiteSpace: "nowrap" }}>
                          {v.category.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Uncategorised</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontSize: "13px", color: "var(--text-main)" }}>{v.contactPerson || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{v.email || v.phone || ""}</div>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--text-secondary)", fontSize: "13px" }}>{v.paymentTerms || "—"}</td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--primary)" }}>{v._count.purchaseOrders}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, background: sc.bg, color: sc.color }}>{v.status}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: Number(v.outstandingBalance) > 0 ? "var(--danger)" : "var(--text-main)" }}>
                      ৳{Number(v.outstandingBalance).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Supplier Modal ── */}
      {showAddSupplier && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddSupplier(false); }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "560px", borderRadius: "20px", padding: "32px", margin: "16px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: "20px", color: "var(--text-main)" }}>Add New Vendor</h2>
            {error && <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px", background: "var(--danger-subtle)", color: "var(--danger)", fontSize: "13px" }}>⚠ {error}</div>}
            <form onSubmit={handleAddSupplier} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={ls}>Vendor / Supplier Name *</label>
                  <input type="text" value={supplierForm.name} onChange={e => setSupplierForm(f => ({ ...f, name: e.target.value }))} required style={is} placeholder="e.g. ABC Trading Co." />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={ls}>Vendor Type / Category</label>
                  <select value={supplierForm.categoryId} onChange={e => setSupplierForm(f => ({ ...f, categoryId: e.target.value }))} style={is}>
                    <option value="">— Uncategorised —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Use "Manage Categories" to add Product Vendor / Service Vendor types.
                  </span>
                </div>
                <div>
                  <label style={ls}>Contact Person</label>
                  <input type="text" value={supplierForm.contactPerson} onChange={e => setSupplierForm(f => ({ ...f, contactPerson: e.target.value }))} style={is} placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label style={ls}>Email</label>
                  <input type="email" value={supplierForm.email} onChange={e => setSupplierForm(f => ({ ...f, email: e.target.value }))} style={is} placeholder="vendor@example.com" />
                </div>
                <div>
                  <label style={ls}>Phone</label>
                  <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm(f => ({ ...f, phone: e.target.value }))} style={is} placeholder="+880..." />
                </div>
                <div>
                  <label style={ls}>Payment Terms</label>
                  <select value={supplierForm.paymentTerms} onChange={e => setSupplierForm(f => ({ ...f, paymentTerms: e.target.value }))} style={is}>
                    <option value="">Select...</option>
                    <option value="Net 7">Net 7</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Advance Payment">Advance Payment</option>
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={ls}>Address</label>
                  <input type="text" value={supplierForm.address} onChange={e => setSupplierForm(f => ({ ...f, address: e.target.value }))} style={is} placeholder="Street, City, Country" />
                </div>
                <div>
                  <label style={ls}>Status</label>
                  <select value={supplierForm.status} onChange={e => setSupplierForm(f => ({ ...f, status: e.target.value }))} style={is}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSupplier(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Vendor"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Categories Modal ── */}
      {showManageCategories && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowManageCategories(false); }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", borderRadius: "20px", padding: "32px", margin: "16px", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "var(--text-main)" }}>Vendor Categories</h2>
            <p style={{ margin: "0 0 24px", fontSize: "13px", color: "var(--text-muted)" }}>
              Create separate categories for product-based vendors (goods suppliers) and service-based vendors (contractors/consultants).
            </p>

            {error && <div style={{ marginBottom: "16px", padding: "12px", borderRadius: "8px", background: "var(--danger-subtle)", color: "var(--danger)", fontSize: "13px" }}>⚠ {error}</div>}

            {/* Existing Categories */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {categories.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", background: "var(--surface-hover)", borderRadius: "10px", fontSize: "13px" }}>
                  No categories yet. Create your first one below.
                </div>
              ) : categories.map(cat => (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px", background: "var(--surface-hover)", border: "1px solid var(--border-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--accent)" }}>label</span>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "14px" }}>{cat.name}</div>
                      {cat.description && <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cat.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{cat._count.suppliers} vendors</span>
                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: "4px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Category Form */}
            <div style={{ borderTop: "1px solid var(--border-main)", paddingTop: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "var(--text-main)" }}>Create New Category</h3>
              <form onSubmit={handleAddCategory} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={ls}>Category Name *</label>
                  <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} required style={is} placeholder='e.g. "Product Vendor" or "Service Vendor"' />
                </div>
                <div>
                  <label style={ls}>Description (Optional)</label>
                  <input type="text" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} style={is} placeholder="e.g. Suppliers of physical goods and raw materials" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["Product Vendor", "Service Vendor"].map(preset => (
                      <button key={preset} type="button" onClick={() => setCatForm({ name: preset, description: preset === "Product Vendor" ? "Suppliers of physical goods, raw materials, and inventory items." : "Suppliers of services, consulting, maintenance, and professional work." })}
                        style={{ padding: "6px 12px", borderRadius: "8px", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={catSaving || !catForm.name}>
                    {catSaving ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
