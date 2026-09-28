"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { QuotationTable } from "./components/QuotationTable";
import { QuotationFilters } from "./components/QuotationFilters";
import { QuotationSearch } from "./components/QuotationSearch";
import { QuotationToolbar } from "./components/QuotationToolbar";
import { QuotationEmptyState } from "./components/QuotationEmptyState";
import { QuotationLoading } from "./components/QuotationLoading";

import styles from '../crm.module.css';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', status: '', dateRange: '' });

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.status) qParams.append("status", filters.status);
      
      const res = await fetch(`/api/crm/quotations?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotations(data.data || data.quotations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters.query, filters.status]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  const handleSearch = useCallback((q: string) => {
    setFilters(prev => (prev.query === q ? prev : { ...prev, query: q }));
  }, []);

  const handleFilterChange = useCallback((newFilter: { status?: string; dateRange?: string }) => {
    setFilters(prev => ({ ...prev, ...newFilter }));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/crm/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (quotations.length === 0) {
      alert("No quotations to export.");
      return;
    }
    const headers = ["Quote Number", "Customer", "Date", "Status", "Total Amount"];
    const rows = quotations.map(q => [
      `"${q.quotationNumber || q.id || ''}"`,
      `"${(q.customer?.name || q.customerName || '').replace(/"/g, '""')}"`,
      `"${new Date(q.createdAt || q.date).toLocaleDateString()}"`,
      `"${q.status || ''}"`,
      `"${q.totalAmount || q.total || 0}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quotations_${new Date().toISOString().split('T')[0]}.csv`);
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
            Quotations &amp; Proposals
            <span className={styles.titleBadge}>{quotations.length} Quotations</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <QuotationToolbar onRefresh={fetchQuotations} onExport={handleExport} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <QuotationSearch onSearch={handleSearch} />
          <QuotationFilters onFilterChange={handleFilterChange} />
        </div>

        {loading ? (
          <QuotationLoading />
        ) : quotations.length === 0 ? (
          <QuotationEmptyState />
        ) : (
          <QuotationTable quotations={quotations} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
