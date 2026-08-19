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
      if (res.ok) fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Sales Orders" 
        description="Manage confirmed customer orders, track payments and shipments."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <SalesOrderSearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <SalesOrderToolbar onRefresh={fetchOrders} />
        </div>

        <SalesOrderFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <SalesOrderLoading />
        ) : orders.length === 0 ? (
          <SalesOrderEmptyState />
        ) : (
          <SalesOrderTable orders={orders} onDelete={handleDelete} />
        )}
      </div>
    </PageContainer>
  );
}
