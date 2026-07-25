"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityPipeline } from "../components/OpportunityPipeline";
import { OpportunityToolbar } from "../components/OpportunityToolbar";
import { OpportunityLoading } from "../components/OpportunityLoading";

export default function OpportunitiesPipelinePage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/opportunities');
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
  }, []);

  return (
    <PageContainer>
      <PageHeader 
        title="Pipeline Funnel" 
        description="Analyze your sales funnel and deal distributions."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <OpportunityToolbar currentView="pipeline" onRefresh={fetchOpportunities} />
        </div>

        {loading ? <OpportunityLoading /> : <OpportunityPipeline opportunities={opportunities} />}
      </div>
    </PageContainer>
  );
}
