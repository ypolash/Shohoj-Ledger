"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSalesOrderPage() {
  const router = useRouter();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Headers
  const [customerId, setCustomerId] = useState("");
  const [opportunityId, setOpportunityId] = useState(""); // We might use JSON to store this if not native on SO, but we'll put it in remarks if needed
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState("");
  const [currency, setCurrency] = useState("BDT");

  // Global Modifiers
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);

  // JSON Remarks Fields
  const [internalNotes, setInternalNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [salesPersonId, setSalesPersonId] = useState("");

  // Line Items
  const [lines, setLines] = useState<any[]>([
    { productId: "", warehouseId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/customers").then(r => r.json()),
      fetch("/api/crm/opportunities").then(r => r.json()),
      fetch("/api/inventory/products").then(r => r.json()),
      fetch("/api/inventory/warehouses").then(r => r.json())
    ]).then(([custData, oppData, prodData, whData]) => {
      setCustomers(custData.data || custData || []);
      setOpportunities(oppData.data || oppData || []);
      setProducts(prodData.data || prodData || []);
      setWarehouses(whData.data || whData || []);
      setLoading(false);
    });
  }, []);

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    const newLines = [...lines];
    newLines[index] = {
      ...newLines[index],
      productId,
      description: product?.description || "",
      unitPrice: product?.sellingPrice || 0
    };
    setLines(newLines);
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { productId: "", warehouseId: "", description: "", quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    
    lines.forEach(line => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const disc = Number(line.discountPercent) || 0;
      const tax = Number(line.taxPercent) || 0;

      const gross = qty * price;
      const lineDisc = gross * (disc / 100);
      const lineSub = gross - lineDisc;
      const lineTax = lineSub * (tax / 100);
      
      subtotal += lineSub;
      taxAmount += lineTax;
    });

    const gd = Number(globalDiscount) || 0;
    const shp = Number(shippingAmount) || 0;
    const grandTotal = subtotal + taxAmount + shp - gd;

    return { subtotal, taxAmount, grandTotal };
  }, [lines, globalDiscount, shippingAmount]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    const remarksPayload = {
      internalNotes,
      customerNotes,
      paymentTerms,
      deliveryTerms,
      shippingMethod,
      salesPersonId,
      opportunityId
    };

    const payload = {
      customerId,
      orderDate: new Date(orderDate).toISOString(),
      requestedDeliveryDate: requestedDeliveryDate ? new Date(requestedDeliveryDate).toISOString() : undefined,
      currency,
      discountAmount: Number(globalDiscount),
      shippingAmount: Number(shippingAmount),
      remarks: JSON.stringify(remarksPayload),
      lines: lines.map(l => ({
        ...l,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discountPercent: Number(l.discountPercent),
        taxPercent: Number(l.taxPercent)
      }))
    };

    try {
      const res = await fetch("/api/crm/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/crm/sales-orders/${data.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create sales order");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting sales order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">New Sales Order</h1>
        <div className="space-x-2">
          <Link href="/dashboard/crm/sales-orders" className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-lg font-bold border-b pb-2">General Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer *</label>
                <select required className="w-full border p-2 rounded focus:ring focus:border-blue-300" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Select Customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Related Opportunity</label>
                <select className="w-full border p-2 rounded focus:ring focus:border-blue-300" value={opportunityId} onChange={e => setOpportunityId(e.target.value)}>
                  <option value="">None</option>
                  {opportunities.filter(o => !customerId || o.customerId === customerId).map(o => (
                    <option key={o.id} value={o.id}>{o.opportunityNumber} - {o.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Order Date *</label>
                <input required type="date" className="w-full border p-2 rounded focus:ring focus:border-blue-300" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Req. Delivery Date</label>
                <input type="date" className="w-full border p-2 rounded focus:ring focus:border-blue-300" value={requestedDeliveryDate} onChange={e => setRequestedDeliveryDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Currency</label>
                <select className="w-full border p-2 rounded focus:ring focus:border-blue-300" value={currency} onChange={e => setCurrency(e.target.value)}>
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 uppercase text-xs">
                  <tr>
                    <th className="p-2">Product *</th>
                    <th className="p-2">Warehouse *</th>
                    <th className="p-2 w-20">Qty *</th>
                    <th className="p-2 w-24">Price *</th>
                    <th className="p-2 w-20">Disc %</th>
                    <th className="p-2 w-20">Tax %</th>
                    <th className="p-2 w-24 text-right">Total</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => {
                    const gross = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
                    const d = gross * ((Number(line.discountPercent) || 0) / 100);
                    const sub = gross - d;
                    const t = sub * ((Number(line.taxPercent) || 0) / 100);
                    const total = sub + t;

                    return (
                      <tr key={idx} className="border-b">
                        <td className="p-2">
                          <select required className="w-full border p-1 rounded text-xs" value={line.productId} onChange={e => handleProductChange(idx, e.target.value)}>
                            <option value="">Select...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select required className="w-full border p-1 rounded text-xs" value={line.warehouseId} onChange={e => updateLine(idx, 'warehouseId', e.target.value)}>
                            <option value="">Select...</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </td>
                        <td className="p-2"><input required type="number" min="1" step="any" className="w-full border p-1 rounded text-xs" value={line.quantity} onChange={e => updateLine(idx, 'quantity', e.target.value)} /></td>
                        <td className="p-2"><input required type="number" min="0" step="any" className="w-full border p-1 rounded text-xs" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', e.target.value)} /></td>
                        <td className="p-2"><input type="number" min="0" max="100" step="any" className="w-full border p-1 rounded text-xs" value={line.discountPercent} onChange={e => updateLine(idx, 'discountPercent', e.target.value)} /></td>
                        <td className="p-2"><input type="number" min="0" max="100" step="any" className="w-full border p-1 rounded text-xs" value={line.taxPercent} onChange={e => updateLine(idx, 'taxPercent', e.target.value)} /></td>
                        <td className="p-2 text-right font-medium text-xs">{total.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                        <td className="p-2 text-center">
                          {lines.length > 1 && (
                            <button type="button" onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="button" onClick={addLine} className="mt-4 text-sm text-blue-600 hover:underline">+ Add Line Item</button>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-lg font-bold border-b pb-2">Terms & Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Notes (On Print)</label>
                <textarea className="w-full border p-2 rounded h-20 text-sm" value={customerNotes} onChange={e => setCustomerNotes(e.target.value)}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Internal Notes (Hidden)</label>
                <textarea className="w-full border p-2 rounded h-20 text-sm" value={internalNotes} onChange={e => setInternalNotes(e.target.value)}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Terms</label>
                <input type="text" className="w-full border p-2 rounded text-sm" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Terms</label>
                <input type="text" className="w-full border p-2 rounded text-sm" value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Shipping Method</label>
                <input type="text" className="w-full border p-2 rounded text-sm" value={shippingMethod} onChange={e => setShippingMethod(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Totals Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded shadow sticky top-6">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Pricing Summary</h2>
            
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{currency} {totals.subtotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-gray-600">Total Tax</span>
              <span>{currency} {totals.taxAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>

            <div className="my-4 border-t pt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Global Discount Amount ({currency})</label>
                <input type="number" min="0" step="any" className="w-full border p-2 rounded text-right text-sm" value={globalDiscount} onChange={e => setGlobalDiscount(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Charge ({currency})</label>
                <input type="number" min="0" step="any" className="w-full border p-2 rounded text-right text-sm" value={shippingAmount} onChange={e => setShippingAmount(Number(e.target.value))} />
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-4">
              <span className="text-lg font-bold">Grand Total</span>
              <span className="text-xl font-bold text-blue-700">{currency} {totals.grandTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
