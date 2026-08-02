import React from 'react';
import styles from "@/app/erp/staff-management/page.module.css";
export function PayrollHistoryModal(props: any) { const { isHistoryModalOpen, setIsHistoryModalOpen, loadingAudits, auditLogs } = props; return <>
      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsHistoryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>Payroll Audit Timeline</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {loadingAudits ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Loading timeline...</div>
              ) : auditLogs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border)' }}></div>
                  {auditLogs.map((log, idx) => (
                    <div key={log.id} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'var(--card-bg)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>history</span>
                      </div>
                      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{log.newStatus}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                          <strong>{log.user.name}</strong> ({log.role.replace('_', ' ')}) changed status from {log.oldStatus || 'None'} to {log.newStatus}.
                        </div>
                        {log.remarks && (
                          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                            "{log.remarks}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No audit history found.</div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-secondary" onClick={() => setIsHistoryModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
</>; }
