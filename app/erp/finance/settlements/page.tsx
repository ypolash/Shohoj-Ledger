"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SettlementToolbar } from './components/SettlementToolbar';
import { SettlementTable } from './components/SettlementTable';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Shareholder percentages
  const [ceoPercent, setCeoPercent] = useState(100);
  const [devPercent, setDevPercent] = useState(0);
  const [advisorPercent, setAdvisorPercent] = useState(0);
  const [companyPercent, setCompanyPercent] = useState(0);

  const fetchSettlements = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/settlements');
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setSettlements(data);
      } else {
        setSettlements([]);
        setError("API returned unexpected data format.");
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleOpenModal = () => {
    setMonth((new Date().getMonth() + 1).toString());
    setYear(new Date().getFullYear().toString());
    setCeoPercent(100);
    setDevPercent(0);
    setAdvisorPercent(0);
    setCompanyPercent(0);
    setPreview(null);
    setIsModalOpen(true);
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewLoading(true);
    try {
      const previewRes = await fetch(`/api/settlements?month=${month}&year=${year}`);
      const data = await previewRes.json();
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        setPreview(data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!preview) return;
    setSubmitLoading(true);
    try {
      const payload = {
        ...preview,
        ceoShare: Number(preview.netProfit) * (ceoPercent / 100),
        developerShare: Number(preview.netProfit) * (devPercent / 100),
        advisorShare: Number(preview.netProfit) * (advisorPercent / 100),
        companyShare: Number(preview.netProfit) * (companyPercent / 100),
      };
      
      const createRes = await fetch('/api/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (createRes.ok) {
        setIsModalOpen(false);
        fetchSettlements();
      } else {
        alert("Failed to generate settlement.");
      }
    } catch (error) {
      console.error(error);
      alert("Error generating settlement");
    } finally {
      setSubmitLoading(false);
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
  
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(Number(val || 0));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      <SettlementToolbar onGenerate={handleOpenModal} />
      {error ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--destructive, red)' }}>
          <p>Error: {error}</p>
        </div>
      ) : loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <SettlementTable settlements={settlements} onExecute={handleExecute} />
      )}
      
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Generate Settlement</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            {!preview ? (
              <form onSubmit={handlePreview}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Month</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Year</label>
                  <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text-main)' }} />
                </div>
                <button type="submit" disabled={previewLoading} style={{ width: '100%', padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {previewLoading ? 'Calculating...' : 'Preview Net Profit'}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Period:</span>
                    <strong>{preview.period}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Income:</span>
                    <span style={{ color: 'var(--success)' }}>{formatCurrency(preview.totalIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Expenses:</span>
                    <span style={{ color: 'var(--danger)' }}>-{formatCurrency(preview.totalExpenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 'bold' }}>Net Profit:</span>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(preview.netProfit)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>Shareholder Distribution</h3>
                    <span style={{ fontSize: '12px', color: (ceoPercent + devPercent + advisorPercent + companyPercent) === 100 ? 'var(--success)' : 'var(--danger)' }}>
                      Total: {ceoPercent + devPercent + advisorPercent + companyPercent}%
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, color: 'var(--text-muted)' }}>Company Owner / CEO</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={ceoPercent} onChange={e => setCeoPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (ceoPercent / 100))}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, color: 'var(--text-muted)' }}>Developer</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={devPercent} onChange={e => setDevPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (devPercent / 100))}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, color: 'var(--text-muted)' }}>Advisor</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={advisorPercent} onChange={e => setAdvisorPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (advisorPercent / 100))}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ flex: 1, color: 'var(--text-muted)' }}>Company Reserve</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={companyPercent} onChange={e => setCompanyPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(Number(preview.netProfit) * (companyPercent / 100))}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCreate} disabled={submitLoading || (ceoPercent + devPercent + advisorPercent + companyPercent) !== 100} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: (submitLoading || (ceoPercent + devPercent + advisorPercent + companyPercent) !== 100) ? 0.5 : 1 }}>
                    {submitLoading ? 'Saving...' : 'Confirm & Save'}
                  </button>
                  <button onClick={() => setPreview(null)} style={{ padding: '10px 16px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
