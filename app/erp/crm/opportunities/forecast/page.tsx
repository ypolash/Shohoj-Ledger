"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { OpportunityForecast } from "../components/OpportunityForecast";
import { OpportunityToolbar } from "../components/OpportunityToolbar";
import { OpportunityLoading } from "../components/OpportunityLoading";

export default function OpportunitiesForecastPage() {
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
        title="Revenue Forecast" 
        description="Predict future revenue based on expected close dates and probability."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <OpportunityToolbar currentView="forecast" onRefresh={fetchOpportunities} />
        </div>

        {loading ? <OpportunityLoading /> : <OpportunityForecast opportunities={opportunities} />}
      </div>
    </PageContainer>
  );
}
