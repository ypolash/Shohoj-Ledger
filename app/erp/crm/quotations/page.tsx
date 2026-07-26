"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { QuotationTable } from "./components/QuotationTable";
import { QuotationFilters } from "./components/QuotationFilters";
import { QuotationSearch } from "./components/QuotationSearch";
import { QuotationToolbar } from "./components/QuotationToolbar";
import { QuotationEmptyState } from "./components/QuotationEmptyState";
import { QuotationLoading } from "./components/QuotationLoading";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', status: '', dateRange: '' });

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.status) qParams.append("status", filters.status);
      
      const res = await fetch(`/api/crm/quotations?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/crm/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Quotations" 
        description="Manage proposals, price quotes, and proforma invoices."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <QuotationSearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <QuotationToolbar onRefresh={fetchQuotations} />
        </div>

        <QuotationFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <QuotationLoading />
        ) : quotations.length === 0 ? (
          <QuotationEmptyState />
        ) : (
          <QuotationTable quotations={quotations} onDelete={handleDelete} />
        )}
      </div>
    </PageContainer>
  );
}
