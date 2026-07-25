"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { CustomerTable } from "./components/CustomerTable";
import { CustomerFilters } from "./components/CustomerFilters";
import { CustomerSearch } from "./components/CustomerSearch";
import { CustomerToolbar } from "./components/CustomerToolbar";
import { CustomerStatistics } from "./components/CustomerStatistics";
import { CustomerEmptyState } from "./components/CustomerEmptyState";
import { CustomerLoading } from "./components/CustomerLoading";
import { CustomerCard } from "./components/CustomerCard";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', status: '', groupId: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.status) qParams.append("status", filters.status);
      if (filters.groupId) qParams.append("groupId", filters.groupId);

      const res = await fetch(`/api/crm/customers?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to archive or delete this customer?")) return;
    try {
      const res = await fetch(`/api/crm/customers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  // Mock Stats calculation
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status !== 'Inactive').length,
    outstanding: customers.reduce((acc, curr) => acc + Number(curr.outstandingBalance || 0), 0),
    salesTotal: 450000, // Placeholder
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Customer Management" 
        description="View and manage all your enterprise customers, balances, and interactions."
      />

      <CustomerStatistics {...stats} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <CustomerSearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <CustomerToolbar onRefresh={fetchCustomers} />
        </div>

        <CustomerFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <CustomerLoading />
        ) : customers.length === 0 ? (
          <CustomerEmptyState />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {customers.map(customer => <CustomerCard key={customer.id} customer={customer} onDelete={handleDelete} />)}
          </div>
        ) : (
          <CustomerTable customers={customers} onDelete={handleDelete} />
        )}
      </div>
    </PageContainer>
  );
}
