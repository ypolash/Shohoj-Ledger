"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SettlementToolbar } from './components/SettlementToolbar';
import { SettlementTable } from './components/SettlementTable';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = useCallback(async () => {
    try {
      const res = await fetch('/api/settlements');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSettlements(data);
      } else {
        setSettlements([]);
        console.error("API returned non-array:", data);
      }
    } catch (error) {
      console.error("Failed to fetch settlements", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleGenerate = async () => {
    const monthStr = window.prompt("Enter month number (1-12):", (new Date().getMonth() + 1).toString());
    const yearStr = window.prompt("Enter year:", new Date().getFullYear().toString());
    
    if (!monthStr || !yearStr) return;
    
    try {
      // 1. Get Preview
      const previewRes = await fetch(`/api/settlements?month=${monthStr}&year=${yearStr}`);
      const preview = await previewRes.json();
      
      if (preview.error) {
        alert("Error: " + preview.error);
        return;
      }
      
      const confirmMsg = `Preview for ${preview.period}:\nNet Profit: ${preview.netProfit}\nCEO: ${preview.ceoShare}\nDev: ${preview.developerShare}\nCompany: ${preview.companyShare}\n\nProceed to generate?`;
      
      if (window.confirm(confirmMsg)) {
        // 2. Create
        const createRes = await fetch('/api/settlements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(preview)
        });
        
        if (createRes.ok) {
          fetchSettlements();
        } else {
          alert("Failed to generate settlement.");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExecute = async (id: string) => {
    if (!window.confirm("Execute this settlement? This will transfer the company share to reserves.")) return;
    try {
      const res = await fetch('/api/settlements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'EXECUTE' })
      });
      if (res.ok) {
        fetchSettlements();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <SettlementToolbar onGenerate={handleGenerate} />
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <SettlementTable settlements={settlements} onExecute={handleExecute} />
      )}
    </div>
  );
}
