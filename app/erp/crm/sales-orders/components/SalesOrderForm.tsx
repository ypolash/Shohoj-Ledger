"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuotationTotals } from "../../quotations/components/QuotationTotals";
import { ProductQuickSearch } from "./ProductQuickSearch";
import { CustomerSelectionSection } from "./CustomerSelectionSection";
import { SalesOrderItemsTable, OrderItem } from "./SalesOrderItemsTable";

interface SalesOrderFormProps {
  initialData?: any;
  isEdit?: boolean;
}

/**
 * SalesOrderForm (Redesign 2.0)
 * Single-page 3-section architecture:
 * 1. Customer Information (Existing vs Temporary)
 * 2. Bordered Product Selection Box with live inventory autocomplete
 * 3. Product Items Table (Quantity, Unit Price, Total)
 * Top-Right Header: Order Date & Expected Delivery Date
 * Bottom Section: Customer Reference / Discount selector & Summary Totals
 */
export function SalesOrderForm({ initialData = {} as any, isEdit = false }: SalesOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");

  // Customer Mode: 'existing' or 'temporary'
  const [customerMode, setCustomerMode] = useState<"existing" | "temporary">(
    initialData.temporaryCustomer ? "temporary" : "existing"
  );

  // Form State
  const [formData, setFormData] = useState({
    customerId: initialData.customerId || "",
    tempName: initialData.temporaryCustomer?.name || "",
    tempPhone: initialData.temporaryCustomer?.phone || "",
    tempEmail: initialData.temporaryCustomer?.email || "",
    tempAddress: initialData.temporaryCustomer?.address || "",
    orderDate: initialData.orderDate
      ? new Date(initialData.orderDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    expectedDelivery: initialData.expectedDelivery
      ? new Date(initialData.expectedDelivery).toISOString().split("T")[0]
      : "",
    status: initialData.status || "APPROVED",
    notes: initialData.remarks || initialData.notes || ""
  });

  const defaultItems: OrderItem[] = initialData.lines
    ? initialData.lines.map((line: any) => ({
        id: line.id || Math.random().toString(),
        productId: line.productId || "",
        description: line.remarks || line.product?.name || "Product Item",
        quantity: Number(line.quantity || 1),
        unitPrice: Number(line.unitPrice || 0),
        discount: Number(line.discountAmount || 0),
        total: Number(line.lineTotal || (Number(line.quantity) * Number(line.unitPrice)))
      }))
    : [];

  const [items, setItems] = useState<OrderItem[]>(defaultItems);
  const [taxRate, setTaxRate] = useState(15);
  const [globalDiscount, setGlobalDiscount] = useState(Number(initialData.discountAmount) || 0);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/crm/customers?take=100");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/inventory/products?limit=200");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    const fetchReferences = async () => {
      try {
        const res = await fetch("/api/crm/customer-references");
        if (res.ok) {
          const data = await res.json();
          setReferences(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch references:", err);
      }
    };

    fetchCustomers();
    fetchProducts();
    fetchReferences();
  }, []);

  const handleReferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const refId = e.target.value;
    setSelectedReferenceId(refId);

    const refObj = references.find((r) => r.id === refId);
    if (refObj) {
      const refDiscount = Number(refObj.discountAmount || 0);
      setGlobalDiscount(refDiscount);

      const noteTag = `[Reference: ${refObj.referenceText}]`;
      if (!formData.notes.includes(noteTag)) {
        setFormData((prev) => ({
          ...prev,
          notes: prev.notes ? `${prev.notes} ${noteTag}` : noteTag
        }));
      }
    }
  };

  const handleProductSelect = (selectedProd: any) => {
    const price = Number(selectedProd.sellingPrice || selectedProd.price || 0);
    const existingIndex = items.findIndex((i) => i.productId === selectedProd.id);

    if (existingIndex >= 0) {
      const updated = [...items];
      const newQty = Number(updated[existingIndex].quantity || 0) + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * Number(updated[existingIndex].unitPrice || price);
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          productId: selectedProd.id,
          description: selectedProd.name + (selectedProd.sku ? ` (${selectedProd.sku})` : ""),
          quantity: 1,
          unitPrice: price,
          discount: 0,
          total: price
        }
      ]);
    }
  };

  const handleItemChange = (index: number, field: "quantity" | "unitPrice" | "discount", val: number) => {
    const updated = [...items];
    updated[index][field] = val;
    const qty = Number(updated[index].quantity || 0);
    const price = Number(updated[index].unitPrice || 0);
    const disc = Number(updated[index].discount || 0);
    updated[index].total = Math.max(0, qty * price - disc);
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculation Engine
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const itemDiscounts = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const totalDiscount = itemDiscounts + globalDiscount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const totalTax = (taxableAmount * taxRate) / 100;
  const grandTotal = taxableAmount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (customerMode === "existing" && !formData.customerId) {
        alert("Please select a customer.");
        setLoading(false);
        return;
      }

      if (customerMode === "temporary" && !formData.tempName.trim()) {
        alert("Please enter the temporary customer's name.");
        setLoading(false);
        return;
      }

      if (items.length === 0) {
        alert("Please add at least one product to the order.");
        setLoading(false);
        return;
      }

      const url = isEdit ? `/api/crm/sales-orders/${initialData.id}` : "/api/crm/sales-orders";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        customerId: customerMode === "existing" ? formData.customerId : undefined,
        temporaryCustomer:
          customerMode === "temporary"
            ? {
                name: formData.tempName,
                phone: formData.tempPhone,
                email: formData.tempEmail,
                address: formData.tempAddress
              }
            : undefined,
        orderDate: formData.orderDate,
        requestedDeliveryDate: formData.expectedDelivery || undefined,
        status: formData.status,
        notes: formData.notes,
        discountAmount: globalDiscount,
        taxRate: taxRate,
        lines: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountAmount: Number(item.discount || 0),
          remarks: item.description
        }))
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Sales Order ${isEdit ? "updated" : "created"} successfully!`);
        router.push(isEdit ? `/erp/crm/sales-orders/${initialData.id}` : "/erp/crm/sales-orders");
      } else {
        const error = await res.json();
        alert(`Failed to save order: ${error.error || "Server error"}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "32px", borderRadius: "16px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {/* Top Header: Title & Top-Right Dates */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--border-main)",
            paddingBottom: "20px",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-main)", fontWeight: 700 }}>
              {isEdit ? "Edit Sales Order" : "New Sales Order"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              Complete the 3-section order flow below to confirm customer commitments.
            </p>
          </div>

          {/* Top-Right Dates Corner */}
          <div
            style={{
              display: "flex",
              gap: "14px",
              background: "var(--surface-hover)",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border-main)"
            }}
          >
            <div>
              <label style={labelStyle}>Order Date *</label>
              <input
                type="date"
                required
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                style={{ ...inputStyle, padding: "7px 10px" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Expected Delivery Date</label>
              <input
                type="date"
                value={formData.expectedDelivery}
                onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                style={{ ...inputStyle, padding: "7px 10px" }}
              />
            </div>
          </div>
        </div>

        {/* Section 1: Customer Information */}
        <CustomerSelectionSection
          customerMode={customerMode}
          setCustomerMode={setCustomerMode}
          customerId={formData.customerId}
          setCustomerId={(id) => setFormData({ ...formData, customerId: id })}
          customers={customers}
          tempName={formData.tempName}
          setTempName={(name) => setFormData({ ...formData, tempName: name })}
          tempPhone={formData.tempPhone}
          setTempPhone={(phone) => setFormData({ ...formData, tempPhone: phone })}
          tempEmail={formData.tempEmail}
          setTempEmail={(email) => setFormData({ ...formData, tempEmail: email })}
          tempAddress={formData.tempAddress}
          setTempAddress={(addr) => setFormData({ ...formData, tempAddress: addr })}
        />

        {/* Section 2: Bordered Product Selection Box */}
        <ProductQuickSearch products={products} onSelectProduct={handleProductSelect} />

        {/* Section 3: Product Items Table View */}
        <SalesOrderItemsTable
          items={items}
          onItemChange={handleItemChange}
          onRemoveItem={removeItem}
        />

        {/* Bottom Section: Customer Reference / Discount & Order Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Customer Reference / Special Discount</label>
              <select value={selectedReferenceId} onChange={handleReferenceChange} style={inputStyle}>
                <option value="">Select Saved Reference (Auto-Applies Discount)...</option>
                {references.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.referenceText} {Number(r.discountAmount) > 0 ? `(- BDT ${Number(r.discountAmount).toLocaleString()})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Private Notes & Fulfillment Remarks</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special delivery notes or terms..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-main)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Global Discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tax / VAT Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            <QuotationTotals subtotal={subtotal} totalDiscount={totalDiscount} totalTax={totalTax} grandTotal={grandTotal} />
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--border-main)", paddingTop: "16px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
            style={{ padding: "10px 20px" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: "10px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Saving..." : isEdit ? "Update Order" : "Confirm & Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary, #94a3b8)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-main, rgba(255,255,255,0.12))",
  background: "var(--surface-input, rgba(15, 23, 42, 0.6))",
  color: "var(--text-main, #f8fafc)",
  fontSize: "13px",
  boxSizing: "border-box",
  outline: "none"
};
