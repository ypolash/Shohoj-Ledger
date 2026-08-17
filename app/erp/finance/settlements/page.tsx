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
  const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
  
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

  // UI State for dynamic shareholder rows
  const [activeRoles, setActiveRoles] = useState<string[]>(['ceo']);
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  // Load defaults on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('settlement_defaults');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setCeoPercent(parsed.ceoPercent ?? 100);
          setDevPercent(parsed.devPercent ?? 0);
          setAdvisorPercent(parsed.advisorPercent ?? 0);
          setCompanyPercent(parsed.companyPercent ?? 0);
          
          const roles = ['ceo'];
          if ((parsed.devPercent ?? 0) > 0) roles.push('dev');
          if ((parsed.advisorPercent ?? 0) > 0) roles.push('advisor');
          if ((parsed.companyPercent ?? 0) > 0) roles.push('company');
          setActiveRoles(roles);
        }
      }
    } catch(e) {}
  }, []);

  const handleOpenShareholderModal = () => {
    try {
      const stored = localStorage.getItem('settlement_defaults');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCeoPercent(parsed.ceoPercent ?? 100);
        setDevPercent(parsed.devPercent ?? 0);
        setAdvisorPercent(parsed.advisorPercent ?? 0);
        setCompanyPercent(parsed.companyPercent ?? 0);

        const roles = ['ceo'];
        if ((parsed.devPercent ?? 0) > 0) roles.push('dev');
        if ((parsed.advisorPercent ?? 0) > 0) roles.push('advisor');
        if ((parsed.companyPercent ?? 0) > 0) roles.push('company');
        setActiveRoles(roles);
      } else {
        setCeoPercent(100);
        setDevPercent(0);
        setAdvisorPercent(0);
        setCompanyPercent(0);
        setActiveRoles(['ceo']);
      }
    } catch(e) {}
    setShowAddMenu(false);
    setIsShareholderModalOpen(true);
  };

  const handleSaveShareholders = () => {
    const payload = { ceoPercent, devPercent, advisorPercent, companyPercent };
    localStorage.setItem('settlement_defaults', JSON.stringify(payload));
    setIsShareholderModalOpen(false);
  };

  const handleOpenModal = () => {
    setMonth((new Date().getMonth() + 1).toString());
    setYear(new Date().getFullYear().toString());
    
    // Read from local storage to initialize Generate modal
    try {
      const stored = localStorage.getItem('settlement_defaults');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCeoPercent(parsed.ceoPercent ?? 100);
        setDevPercent(parsed.devPercent ?? 0);
        setAdvisorPercent(parsed.advisorPercent ?? 0);
        setCompanyPercent(parsed.companyPercent ?? 0);

        const roles = ['ceo'];
        if ((parsed.devPercent ?? 0) > 0) roles.push('dev');
        if ((parsed.advisorPercent ?? 0) > 0) roles.push('advisor');
        if ((parsed.companyPercent ?? 0) > 0) roles.push('company');
        setActiveRoles(roles);
      } else {
        setCeoPercent(100);
        setDevPercent(0);
        setAdvisorPercent(0);
        setCompanyPercent(0);
        setActiveRoles(['ceo']);
      }
    } catch(e) {}

    setShowAddMenu(false);
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

  const addRole = (role: string) => {
    setActiveRoles([...activeRoles, role]);
    setShowAddMenu(false);
  };

  const removeRole = (role: string) => {
    setActiveRoles(activeRoles.filter(r => r !== role));
    if (role === 'dev') setDevPercent(0);
    if (role === 'advisor') setAdvisorPercent(0);
    if (role === 'company') setCompanyPercent(0);
  };

  const availableRoles = [
    { id: 'dev', label: 'Developer' },
    { id: 'advisor', label: 'Advisor' },
    { id: 'company', label: 'Company Reserve' }
  ].filter(r => !activeRoles.includes(r.id));

  const totalPercent = ceoPercent + devPercent + advisorPercent + companyPercent;

  const renderShareholderRows = (showAmounts = false) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        {activeRoles.includes('ceo') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ color: 'var(--text-muted)', flex: 1 }}>Company Owner / CEO</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="0" max="100" value={ceoPercent} onChange={e => setCeoPercent(Number(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)' }} />
              <span>%</span>
              {showAmounts && preview && (
                <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (ceoPercent / 100))}</span>
              )}
              <div style={{ width: '28px' }}></div> {/* Spacer for alignment with remove buttons */}
            </div>
          </div>
        )}
        
        {activeRoles.includes('dev') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ color: 'var(--text-muted)', flex: 1 }}>Developer</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="0" max="100" value={devPercent} onChange={e => setDevPercent(Number(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)' }} />
              <span>%</span>
              {showAmounts && preview && (
                <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (devPercent / 100))}</span>
              )}
              <button onClick={() => removeRole('dev')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          </div>
        )}

        {activeRoles.includes('advisor') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ color: 'var(--text-muted)', flex: 1 }}>Advisor</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="0" max="100" value={advisorPercent} onChange={e => setAdvisorPercent(Number(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)' }} />
              <span>%</span>
              {showAmounts && preview && (
                <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (advisorPercent / 100))}</span>
              )}
              <button onClick={() => removeRole('advisor')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          </div>
        )}

        {activeRoles.includes('company') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ color: 'var(--text-muted)', flex: 1 }}>Company Reserve</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" min="0" max="100" value={companyPercent} onChange={e => setCompanyPercent(Number(e.target.value))} style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface-hover)' }} />
              <span>%</span>
              {showAmounts && preview && (
                <span style={{ width: '100px', textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(Number(preview.netProfit) * (companyPercent / 100))}</span>
              )}
              <button onClick={() => removeRole('company')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          </div>
        )}

        {availableRoles.length > 0 && (
          <div style={{ marginTop: '8px', position: 'relative' }}>
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)} 
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: '4px 0' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
              Add Shareholder
            </button>
            
            {showAddMenu && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
                {availableRoles.map(role => (
                  <button 
                    key={role.id} 
                    onClick={() => addRole(role.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '4px' }}
                    className="hover-bg-surface-hover"
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      <SettlementToolbar onGenerate={handleOpenModal} onEditShareholders={handleOpenShareholderModal} />
      {error ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--destructive, red)' }}>
          <p>Error: {error}</p>
        </div>
      ) : loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <SettlementTable settlements={settlements} onExecute={handleExecute} />
      )}
      
      {/* Configuration Modal for Shareholder Defaults */}
      {isShareholderModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Global Default Distributions</h2>
              <button onClick={() => setIsShareholderModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Set the default percentages to be used when generating new settlements.
            </p>
            
            {renderShareholderRows(false)}

            { totalPercent !== 100 && (
              <div style={{ marginBottom: '16px', padding: '8px', background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', borderRadius: '4px', fontSize: '13px' }}>
                Warning: Percentages must sum to 100%. Currently: {totalPercent}%.
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSaveShareholders} disabled={totalPercent !== 100} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: (totalPercent !== 100) ? 0.5 : 1 }}>
                Save Defaults
              </button>
              <button onClick={() => setIsShareholderModalOpen(false)} style={{ padding: '10px 16px', background: 'var(--surface-hover)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Settlement Modal */}
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
                    <span style={{ fontSize: '12px', color: totalPercent === 100 ? 'var(--success)' : 'var(--danger)' }}>
                      Total: {totalPercent}%
                    </span>
                  </div>
                  
                  {renderShareholderRows(true)}
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleCreate} disabled={submitLoading || totalPercent !== 100} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', opacity: (submitLoading || totalPercent !== 100) ? 0.5 : 1 }}>
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
