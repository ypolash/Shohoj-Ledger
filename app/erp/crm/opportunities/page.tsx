"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityTable } from "./components/OpportunityTable";
import { OpportunityFilters } from "./components/OpportunityFilters";
import { OpportunitySearch } from "./components/OpportunitySearch";
import { OpportunityToolbar } from "./components/OpportunityToolbar";
import { OpportunityEmptyState } from "./components/OpportunityEmptyState";
import { OpportunityLoading } from "./components/OpportunityLoading";
import { OpportunityCard } from "./components/OpportunityCard";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', stageId: '', ownerId: '' });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.query) qParams.append("query", filters.query);
      if (filters.stageId) qParams.append("stageId", filters.stageId);
      if (filters.ownerId) qParams.append("ownerId", filters.ownerId);

      const res = await fetch(`/api/crm/opportunities?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    try {
      const res = await fetch(`/api/crm/opportunities/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOpportunities();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Opportunities" 
        description="Manage your enterprise sales pipeline and track deals."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <OpportunitySearch onSearch={(q) => setFilters(prev => ({ ...prev, query: q }))} />
          <OpportunityToolbar currentView="list" onRefresh={fetchOpportunities} />
        </div>

        <OpportunityFilters onFilterChange={(newFilter) => setFilters(prev => ({ ...prev, ...newFilter }))} />

        {loading ? (
          <OpportunityLoading />
        ) : opportunities.length === 0 ? (
          <OpportunityEmptyState />
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {opportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />)}
          </div>
        ) : (
          <OpportunityTable opportunities={opportunities} onDelete={handleDelete} />
        )}
      </div>
    </PageContainer>
  );
}
