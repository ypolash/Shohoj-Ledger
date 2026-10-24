"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Trash2,
  Copy,
  Printer,
  FileCheck,
  RotateCcw,
  Building2,
  Package,
  FileText,
  CheckCircle2,
  UserPlus
} from "lucide-react";
import styles from "./NewPurchasePage.module.css";

interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unit: string;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  discount: number | string;
  lineTotal: number;
  remarks?: string;
}

// Convert number to words for BDT currency
function numberToWordsBDT(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Taka Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    let str = "";
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += "-" + a[n % 10].trim() + " ";
        else str += " ";
      }
    }
    return str;
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart).trim();
  return `BDT ${words} Only`;
}

export default function DedicatedNewPurchasePage() {
  const router = useRouter();

  // Data sources
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form States (Expected Delivery Date removed as requested)
  const [supplierId, setSupplierId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierRef, setSupplierRef] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30 Days");
  const [status, setStatus] = useState("APPROVED");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Goods must be delivered in sound packaging.\n2. Invoice subject to inventory quality verification.\n3. Payment disbursed as per approved payment terms."
  );
  const [overallDiscount, setOverallDiscount] = useState<number | string>(0);
  const [shippingFee, setShippingFee] = useState<number | string>(0);

  // Line items state
  const [items, setItems] = useState<PurchaseLineItem[]>([
    {
      id: "item-1",
      productId: "",
      productName: "",
      productCode: "",
      unit: "pcs",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discount: 0,
      lineTotal: 0,
      remarks: ""
    }
  ]);

  // Submission & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<"Blue" | "Emerald" | "Indigo" | "Amber" | "Slate">("Blue");
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");

  // Quick New Supplier Modal state
  const [showQuickSupplierModal, setShowQuickSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newSupAddress, setNewSupAddress] = useState("");
  const [isCreatingSup, setIsCreatingSup] = useState(false);

  // Initial Data Fetch & PO Generation
  useEffect(() => {
    generateNewPoNumber();

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [supRes, prodRes] = await Promise.all([
          fetch("/api/inventory/suppliers"),
          fetch("/api/inventory/products?limit=250")
        ]);
        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(supData.suppliers || []);
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }
      } catch (err) {
        console.error("Failed to load initial data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const generateNewPoNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPoNumber(`PO-SHO-${dateStr}-${rand}`);
  };

  // Selected supplier details
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === supplierId) || null;
  }, [suppliers, supplierId]);

  // Handle Product Selection
  const handleProductSelect = (index: number, prodId: string) => {
    const selected = products.find((p) => p.id === prodId);
    const updated = [...items];
    if (selected) {
      const price = Number(selected.purchasePrice || selected.costPrice || selected.sellingPrice || 0);
      const qty = Number(updated[index].quantity) || 1;
      const taxRate = Number(updated[index].taxRate) || 0;
      const discount = Number(updated[index].discount) || 0;
      const subtotal = qty * price;
      const taxAmount = (subtotal * taxRate) / 100;
      const total = subtotal + taxAmount - discount;

      updated[index] = {
        ...updated[index],
        productId: selected.id,
        productName: selected.name,
        productCode: selected.productCode || selected.sku || "",
        unit: selected.unit || "pcs",
        unitPrice: price,
        lineTotal: Math.max(0, total)
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: "",
        productName: "",
        productCode: "",
        unit: "pcs",
        unitPrice: 0,
        lineTotal: 0
      };
    }
    setItems(updated);
  };

  // Handle numeric field changes for items
  const handleItemFieldChange = (
    index: number,
    field: "quantity" | "unitPrice" | "taxRate" | "discount",
    value: number | string
  ) => {
    const updated = [...items];
    updated[index][field] = value;

    const qty = Number(updated[index].quantity || 0);
    const price = Number(updated[index].unitPrice || 0);
    const tax = Number(updated[index].taxRate || 0);
    const disc = Number(updated[index].discount || 0);

    const baseTotal = qty * price;
    const taxAmt = (baseTotal * tax) / 100;
    updated[index].lineTotal = Math.max(0, baseTotal + taxAmt - disc);

    setItems(updated);
  };

  const handleItemRemarksChange = (index: number, remarks: string) => {
    const updated = [...items];
    updated[index].remarks = remarks;
    setItems(updated);
  };

  // Add Item Line
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: "",
        productName: "",
        productCode: "",
        unit: "pcs",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
        lineTotal: 0,
        remarks: ""
      }
    ]);
  };

  // Duplicate Item Line
  const handleDuplicateItem = (index: number) => {
    const source = items[index];
    const cloned: PurchaseLineItem = {
      ...source,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    const updated = [...items];
    updated.splice(index + 1, 0, cloned);
    setItems(updated);
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Financial Computations
  const subtotalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  }, [items]);

  const totalItemTaxes = useMemo(() => {
    return items.reduce((sum, item) => {
      const base = Number(item.quantity || 0) * Number(item.unitPrice || 0);
      return sum + (base * Number(item.taxRate || 0)) / 100;
    }, 0);
  }, [items]);

  const totalItemDiscounts = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  }, [items]);

  const grandTotalAmount = useMemo(() => {
    const total = subtotalAmount + totalItemTaxes + Number(shippingFee || 0) - totalItemDiscounts - Number(overallDiscount || 0);
    return Math.max(0, total);
  }, [subtotalAmount, totalItemTaxes, shippingFee, totalItemDiscounts, overallDiscount]);

  // Form Reset
  const handleReset = () => {
    if (confirm("Are you sure you want to reset all form inputs?")) {
      setSupplierId("");
      generateNewPoNumber();
      setOrderDate(new Date().toISOString().slice(0, 10));
      setSupplierRef("");
      setNotes("");
      setOverallDiscount(0);
      setShippingFee(0);
      setItems([
        {
          id: "item-1",
          productId: "",
          productName: "",
          productCode: "",
          unit: "pcs",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          discount: 0,
          lineTotal: 0,
          remarks: ""
        }
      ]);
      setErrorMsg(null);
    }
  };

  // Create Quick Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;
    setIsCreatingSup(true);
    try {
      const res = await fetch("/api/inventory/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSupName.trim(),
          phone: newSupPhone.trim() || undefined,
          email: newSupEmail.trim() || undefined,
          address: newSupAddress.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.supplier) {
        setSuppliers((prev) => [data.supplier, ...prev]);
        setSupplierId(data.supplier.id);
        setShowQuickSupplierModal(false);
        setNewSupName("");
        setNewSupPhone("");
        setNewSupEmail("");
        setNewSupAddress("");
      } else {
        alert(data.error || "Failed to create supplier.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create supplier.");
    } finally {
      setIsCreatingSup(false);
    }
  };

  // Submit & Post Purchase Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!supplierId) {
      setErrorMsg("Please select a supplier company.");
      return;
    }

    const validLines = items.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validLines.length === 0) {
      setErrorMsg("Please specify at least one product with quantity greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        supplierId,
        poNumber,
        expectedDate: null,
        supplierRef: supplierRef || null,
        notes: notes || undefined,
        paymentTerms,
        discountAmount: Number(overallDiscount || 0),
        shippingAmount: Number(shippingFee || 0),
        status,
        items: validLines.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          remarks: i.remarks || undefined
        }))
      };

      const res = await fetch("/api/inventory/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create purchase order.");
      }

      setSuccessMsg("Purchase Order successfully created and recognized in Expense Ledger!");
      setTimeout(() => {
        router.push("/erp/inventory/purchases");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Document Handler
  const handlePrint = () => {
    const sheetEl = document.getElementById("print-invoice-sheet");
    if (!sheetEl) {
      window.print();
      return;
    }

    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) return;

    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Purchase Order - ${poNumber}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #print-invoice-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${sheetEl.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 300);
  };

  return (
    <div className={styles.container}>
      {/* Top Header & Workspace Actions */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <button
            type="button"
            onClick={() => router.push("/erp/inventory/purchases")}
            className={styles.backBtn}
            title="Return to Purchases list"
          >
            <ArrowLeft size={18} />
          </button>
          <div className={styles.titleInfo}>
            <h1>
              <ShoppingBag size={22} color="var(--primary)" />
              New Purchase Order
            </h1>
            <p>Draft procurements, track supplier obligations, and manage purchase records.</p>
          </div>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            onClick={handlePrint}
            className={styles.btnSecondary}
            title="Print Purchase Order"
          >
            <Printer size={16} />
            <span>Print PO</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={styles.btnSecondary}
            title="Reset form to defaults"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMsg && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "0",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "0.875rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span>⚠ {errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "0",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontSize: "0.875rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Dual Pane Workspace */}
      <form onSubmit={handleSubmit} className={styles.workspaceGrid}>
        {/* Left Column: Form Builder */}
        <div
          className={`${styles.formColumn} ${
            activeTabMobile === "preview" ? styles.hideMobile : ""
          }`}
        >
          {/* Card 1: Supplier & Order Information */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Building2 size={18} className={styles.cardTitleIcon} />
                <span>Supplier & Vendor Details</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSupplierModal(true)}
                className={styles.btnOutline}
              >
                <UserPlus size={14} />
                <span>+ New Supplier</span>
              </button>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier Company *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className={styles.formSelect}
                >
                  <option value="">— Select Supplier Vendor —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.phone ? `(${s.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>PO Tracking Number *</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    required
                    className={styles.formInput}
                    style={{ fontFamily: "monospace", fontWeight: 700 }}
                  />
                  <button
                    type="button"
                    onClick={generateNewPoNumber}
                    className={styles.btnSecondary}
                    title="Generate new PO number"
                    style={{ padding: "0 12px" }}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Supplier Information Card */}
            {selectedSupplier && (
              <div className={styles.vendorDetailBox}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--text-main)" }}>
                  <span>{selectedSupplier.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--primary)" }}>{selectedSupplier.supplierCode || "SUP-VENDOR"}</span>
                </div>
                <div className={styles.vendorDetailRow}>
                  <span>📞 {selectedSupplier.phone || "No phone registered"}</span>
                  <span>•</span>
                  <span>✉ {selectedSupplier.email || "No email registered"}</span>
                </div>
                {selectedSupplier.address && (
                  <div className={styles.vendorDetailRow}>
                    <span>📍 {selectedSupplier.address}</span>
                  </div>
                )}
              </div>
            )}

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Order Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier Ref / Bill #</label>
                <input
                  type="text"
                  placeholder="e.g. SUP-INV-9021"
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  className={styles.formInput}
                />
              </div>
            </div>

            <div className={styles.formGrid2}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="Due on Receipt">Due on Receipt (Immediate)</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                  <option value="100% Advance Payment">100% Advance Payment</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Approval Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="APPROVED">Approved & Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="RECEIVED">Received & Fulfilled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Line Items & Procurement Costing */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Package size={18} className={styles.cardTitleIcon} />
                <span>Purchased Line Items ({items.length})</span>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>Product / SKU</th>
                    <th style={{ width: "16%" }}>Qty</th>
                    <th style={{ width: "18%" }}>Unit Cost (৳)</th>
                    <th style={{ width: "16%", textAlign: "right" }}>Total (৳)</th>
                    <th style={{ width: "10%", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      {/* Product Selector + Note */}
                      <td>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          required
                          className={styles.tableInput}
                        >
                          <option value="">— Select Product —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.productCode ? `(${p.productCode})` : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Optional specifications or note..."
                          value={item.remarks || ""}
                          onChange={(e) => handleItemRemarksChange(idx, e.target.value)}
                          className={styles.tableSubInput}
                        />
                      </td>

                      {/* Quantity input with inline unit badge */}
                      <td>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemFieldChange(idx, "quantity", e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles.tableInput}
                            style={{ textAlign: "center", fontWeight: 700, paddingRight: item.unit ? "36px" : "10px" }}
                            required
                          />
                          {item.unit && (
                            <span
                              style={{
                                position: "absolute",
                                right: "8px",
                                fontSize: "0.725rem",
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                pointerEvents: "none"
                              }}
                            >
                              {item.unit}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Unit Price input with inline Taka prefix */}
                      <td>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span
                            style={{
                              position: "absolute",
                              left: "10px",
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              color: "var(--text-muted)",
                              pointerEvents: "none"
                            }}
                          >
                            ৳
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemFieldChange(idx, "unitPrice", e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles.tableInput}
                            style={{ fontFamily: "monospace", fontWeight: 700, paddingLeft: "24px" }}
                            required
                          />
                        </div>
                      </td>

                      {/* Line Total */}
                      <td>
                        <div
                          style={{
                            height: "38px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            fontFamily: "monospace",
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            color: "var(--text-main)"
                          }}
                        >
                          ৳{item.lineTotal.toLocaleString()}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td>
                        <div style={{ height: "38px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(idx)}
                            className={`${styles.actionBtn} ${styles.duplicateBtn}`}
                            title="Duplicate row"
                          >
                            <Copy size={15} />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className={styles.actionBtn}
                              title="Delete row"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Product Line Button placed directly beneath the product line items */}
            <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "4px" }}>
              <button
                type="button"
                onClick={handleAddItem}
                className={styles.btnPrimary}
                style={{
                  padding: "8px 16px",
                  fontSize: "0.825rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "0"
                }}
              >
                <Plus size={15} />
                <span>+ Add Product Line</span>
              </button>
            </div>

            {/* Subtotal & Adjustments */}
            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span>Items Subtotal:</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>৳{subtotalAmount.toLocaleString()}</span>
              </div>

              <div className={styles.formGrid2} style={{ marginTop: "4px" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Overall Discount (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    className={styles.formInput}
                    style={{ padding: "6px 10px" }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Shipping / Freight (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value === "" ? "" : Number(e.target.value))}
                    className={styles.formInput}
                    style={{ padding: "6px 10px" }}
                  />
                </div>
              </div>

              <div className={styles.summaryRowTotal}>
                <span>Total Recognized Expense:</span>
                <span style={{ fontFamily: "monospace" }}>৳{grandTotalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Notes & Terms */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <FileText size={18} className={styles.cardTitleIcon} />
                <span>Remarks & Procurement Terms</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Order Instructions / Remarks</label>
              <textarea
                rows={2}
                placeholder="Specific delivery instructions, receiver contact, or warehouse bay..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.formTextarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Standard Terms & Conditions</label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                className={styles.formTextarea}
                style={{ fontSize: "0.8rem" }}
              />
            </div>

            {/* Submit Bar */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-main)" }}>
              <button
                type="button"
                onClick={() => router.push("/erp/inventory/purchases")}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || grandTotalAmount <= 0}
                className={styles.btnPrimary}
              >
                <FileCheck size={18} />
                <span>{isSubmitting ? "Posting to Expense Ledger..." : "Confirm & Post Purchase Order"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick New Supplier Modal */}
      {showQuickSupplierModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            padding: "16px"
          }}
          onClick={(e) => e.target === e.currentTarget && setShowQuickSupplierModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              borderRadius: "0",
              background: "var(--surface-main, #1e293b)",
              border: "1px solid var(--border-main)",
              padding: "24px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                + Quick Add Supplier Vendor
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickSupplierModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Industrial Supplies Ltd"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+880 17..."
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    placeholder="vendor@company.com"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Physical Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, City, Postal Code"
                  value={newSupAddress}
                  onChange={(e) => setNewSupAddress(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowQuickSupplierModal(false)}
                  className={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSup || !newSupName.trim()}
                  className={styles.btnPrimary}
                >
                  {isCreatingSup ? "Creating..." : "Save & Select Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
