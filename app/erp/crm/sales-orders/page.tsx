"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesOrderTable } from "./components/SalesOrderTable";
import { SalesOrderFilters } from "./components/SalesOrderFilters";
import { SalesOrderSearch } from "./components/SalesOrderSearch";
import { SalesOrderToolbar } from "./components/SalesOrderToolbar";
import { SalesOrderEmptyState } from "./components/SalesOrderEmptyState";
import { SalesOrderLoading } from "./components/SalesOrderLoading";

import styles from '../crm.module.css';

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', status: '', paymentStatus: '', shipmentStatus: '' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.status) qParams.append("status", filters.status);
      if (filters.paymentStatus) qParams.append("paymentStatus", filters.paymentStatus);
      if (filters.shipmentStatus) qParams.append("shipmentStatus", filters.shipmentStatus);
      
      const res = await fetch(`/api/crm/sales-orders?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales order?")) return;
    try {
      const res = await fetch(`/api/crm/sales-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOrders();
      } else {
        const error = await res.json();
        alert(`Failed to delete order: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      alert("No sales orders to export.");
      return;
    }
    const headers = ["Order Number", "Customer", "Date", "Status", "Payment", "Shipment", "Total Amount"];
    const rows = orders.map(o => [
      `"${o.orderNumber || o.id || ''}"`,
      `"${(o.customer?.name || o.customerName || '').replace(/"/g, '""')}"`,
      `"${new Date(o.createdAt || o.orderDate).toLocaleDateString()}"`,
      `"${o.status || ''}"`,
      `"${o.paymentStatus || ''}"`,
      `"${o.shipmentStatus || ''}"`,
      `"${o.totalAmount || o.total || 0}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* 1. Executive Minimalist Header */}
      <header className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>
            Sales Orders
            <span className={styles.titleBadge}>{orders.length} Orders</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <SalesOrderToolbar onRefresh={fetchOrders} onExport={handleExport} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <SalesOrderSearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <SalesOrderFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />
        </div>

        {loading ? (
          <SalesOrderLoading />
        ) : orders.length === 0 ? (
          <SalesOrderEmptyState />
        ) : (
          <SalesOrderTable orders={orders} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
