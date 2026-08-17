import React from 'react';
import styles from "@/app/erp/income/page.module.css";
export function SettlementFormModal(props: any) { 
  const { 
    isModalOpen, setIsModalOpen, preview, handlePreview, month, year, setMonth, setYear, 
    previewing, handleCreateSettlement, formatCurrency, submitting, setPreview,
    ceoPercent, setCeoPercent, devPercent, setDevPercent, advisorPercent, setAdvisorPercent, companyPercent, setCompanyPercent
  } = props; 
  
  return (<>
      {/* Settlement Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Create Settlement</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {!preview ? (
              <>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "var(--spacing-4)" }}>
                  Select a month and year to calculate the net profit and distribution shares. This pulls only PAID/PARTIAL incomes and APPROVED expenses.
                </p>
                <form onSubmit={handlePreview} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="label">Month</label>
                      <select required className="input" value={month} onChange={(e) => setMonth(e.target.value)} style={{ appearance: 'auto' }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="label">Year</label>
                      <input required type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={previewing}>
                      {previewing ? "Calculating..." : "Generate Preview"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className={styles.form}>
                <div style={{ padding: "var(--spacing-4)", background: "var(--surface-light)", borderRadius: "var(--radius-md)", border: '1px solid var(--border)' }}>
                  <h4 style={{ marginBottom: "var(--spacing-3)" }}>Preview: {preview.period}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Income:</span>
                    <span style={{ color: 'var(--success)' }}>{formatCurrency(preview.totalIncome)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Total Expenses:</span>
                    <span style={{ color: 'var(--danger)' }}>-{formatCurrency(preview.totalExpenses)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span>Net Profit:</span>
                    <span>{formatCurrency(preview.netProfit)}</span>
                  </div>

                  <h5 style={{ marginBottom: "var(--spacing-2)", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                    <span>Distributions</span>
                    <span style={{ fontSize: "0.875rem" }}>Total: {ceoPercent + devPercent + advisorPercent + companyPercent}%</span>
                  </h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ flex: 1, color: 'var(--text-muted)' }}>Company Owner / CEO</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={ceoPercent} onChange={e => setCeoPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (ceoPercent / 100))}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ flex: 1, color: 'var(--text-muted)' }}>Developer</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={devPercent} onChange={e => setDevPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (devPercent / 100))}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ flex: 1, color: 'var(--text-muted)' }}>Advisor</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={advisorPercent} onChange={e => setAdvisorPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(Number(preview.netProfit) * (advisorPercent / 100))}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ flex: 1, color: 'var(--text-muted)' }}>Company Reserve</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="number" min="0" max="100" value={companyPercent} onChange={e => setCompanyPercent(Number(e.target.value))} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }} />
                        <span style={{ width: '20px' }}>%</span>
                        <span style={{ width: '100px', textAlign: 'right', color: 'var(--primary)' }}>{formatCurrency(Number(preview.netProfit) * (companyPercent / 100))}</span>
                      </div>
                    </div>
                  </div>
                  
                  { (ceoPercent + devPercent + advisorPercent + companyPercent) !== 100 && (
                    <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(255,0,0,0.1)', color: 'var(--danger)', borderRadius: '4px', fontSize: '12px' }}>
                      Warning: Percentages should sum up to 100%. Currently: {ceoPercent + devPercent + advisorPercent + companyPercent}%.
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: 'var(--spacing-4)' }}>
                  <button onClick={handleCreateSettlement} className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                    {submitting ? "Saving..." : "Save Settlement Record"}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setPreview(null)}>
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

</>); }
