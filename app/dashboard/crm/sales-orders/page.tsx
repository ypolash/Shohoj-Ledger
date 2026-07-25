"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SalesOrdersPage() {
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/crm/customers")
      .then(r => r.json())
      .then(data => setCustomers(data.data || data || []));
  }, []);

  useEffect(() => {
    fetchData();
  }, [query, status, customerId, fromDate, toDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (status) params.append("status", status);
      if (customerId) params.append("customerId", customerId);
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const [listRes, dashRes] = await Promise.all([
        fetch(`/api/crm/sales-orders?${params.toString()}`),
        fetch("/api/crm/sales-orders/dashboard")
      ]);
      
      if (listRes.ok) {
        const listData = await listRes.json();
        setSalesOrders(listData.data || []);
      }
      if (dashRes.ok) {
        setDashboard(await dashRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    if (action === "DELETE") {
      if (!confirm("Are you sure you want to delete this sales order?")) return;
      await fetch(`/api/crm/sales-orders/${id}`, { method: "DELETE" });
    } else {
      if (!confirm(`Are you sure you want to execute action ${action}?`)) return;
      await fetch(`/api/crm/sales-orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
    }
    fetchData();
  };

  const statusColors: any = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-blue-100 text-blue-800",
    OPEN: "bg-indigo-100 text-indigo-800",
    PARTIALLY_DELIVERED: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    CLOSED: "bg-purple-100 text-purple-800",
    CANCELLED: "bg-red-100 text-red-800"
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Orders</h1>
        <Link href="/dashboard/crm/sales-orders/new" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + New Sales Order
        </Link>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Total Orders</p>
            <p className="text-lg font-bold">{dashboard.totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Draft</p>
            <p className="text-lg font-bold text-gray-600">{dashboard.draftCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Pending</p>
            <p className="text-lg font-bold text-yellow-600">{dashboard.pendingCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Approved</p>
            <p className="text-lg font-bold text-blue-600">{dashboard.approvedCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Reserved (Open)</p>
            <p className="text-lg font-bold text-indigo-600">{dashboard.openCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Delivered</p>
            <p className="text-lg font-bold text-green-600">{dashboard.deliveredCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Cancelled</p>
            <p className="text-lg font-bold text-red-600">{dashboard.cancelledCount}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-xs text-gray-500 uppercase">Revenue</p>
            <p className="text-lg font-bold text-green-700">${Number(dashboard.revenue).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input 
          type="text" 
          placeholder="Search Number..." 
          className="border p-2 rounded" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <select className="border p-2 rounded" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border p-2 rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className="border p-2 rounded" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" className="border p-2 rounded" value={toDate} onChange={e => setToDate(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 bg-gray-50">
              <tr>
                <th className="px-6 py-4">SO No</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.map((so) => (
                <tr key={so.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">
                    <Link href={`/dashboard/crm/sales-orders/${so.id}`}>{so.salesOrderNumber}</Link>
                  </td>
                  <td className="px-6 py-4">{new Date(so.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{so.customer?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[so.status] || 'bg-gray-100'}`}>
                      {so.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">{so.currency} {Number(so.totalAmount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link href={`/dashboard/crm/sales-orders/${so.id}`} className="text-blue-600 hover:underline">View</Link>
                    {(so.status === 'DRAFT' || so.status === 'PENDING_APPROVAL') && (
                      <Link href={`/dashboard/crm/sales-orders/${so.id}/edit`} className="text-gray-600 hover:underline">Edit</Link>
                    )}
                    {so.status === 'DRAFT' && (
                      <button onClick={() => handleAction(so.id, 'DELETE')} className="text-red-600 hover:underline">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {salesOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No sales orders found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
