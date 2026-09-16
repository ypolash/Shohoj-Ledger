"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { 
  Headphones, 
  Search, 
  Filter, 
  RefreshCw, 
  Send, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2,
  XCircle,
  Building2, 
  User, 
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Tag,
  ArrowLeft
} from 'lucide-react';

interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'BILLING' | 'TECHNICAL' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'GENERAL';
  userId: string;
  companyId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    messages: number;
  };
  messages?: SupportMessage[];
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Ticket Conversation
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const res = await fetch(`/api/system/support/tickets?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const loadTicketDetail = async (ticketId: string) => {
    setLoadingTicketDetail(true);
    try {
      const res = await fetch(`/api/system/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Failed to load ticket details');
      const data = await res.json();
      setSelectedTicket(data.ticket);
      setMessages(data.ticket?.messages || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/system/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      const data = await res.json();

      setMessages(prev => [...prev, data.message]);
      setReplyText('');
      showToast('Reply dispatched to customer!', 'success');

      // Refresh list to update status if auto-transitioned
      fetchTickets();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicket = async (status?: string, priority?: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/system/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status || selectedTicket.status,
          priority: priority || selectedTicket.priority,
        }),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      const data = await res.json();

      setSelectedTicket(data.ticket);
      showToast('Ticket updated successfully', 'success');
      fetchTickets();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'HIGH':
        return { bg: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.4)' };
      case 'MEDIUM':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' };
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'OPEN':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
      case 'IN_PROGRESS':
        return { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' };
      case 'RESOLVED':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' };
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Super Admin Customer Support Desk" 
        description="Central helpdesk for customer support queries across all tenant organizations. Respond to inquiries, track SLA, and resolve issues."
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          padding: '12px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fff',
          backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{toastMessage.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Open Inquiries</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#60a5fa' }}>{metrics.open}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>In Progress</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#c084fc' }}>{metrics.inProgress}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Urgent Escalations</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{metrics.urgent}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Resolved Tickets</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>{metrics.resolved}</div>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '20px', transition: 'all 0.2s ease-in-out' }}>
        
        {/* Left / List View */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main)',
                  background: 'var(--surface-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '13px' }}
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              className="btn btn-secondary"
              onClick={fetchTickets}
              title="Refresh tickets"
              style={{ padding: '8px 12px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tickets List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '680px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0 }}>Loading support tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <Headphones size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No support tickets found.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const pStyle = getPriorityBadge(t.priority);
                const sStyle = getStatusBadge(t.status);

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--surface-subtle)',
                      border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-main)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#818cf8' }}>
                          {t.ticketNumber}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: pStyle.bg,
                          color: pStyle.color,
                          border: pStyle.border,
                        }}>
                          {t.priority}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: sStyle.bg,
                          color: sStyle.color,
                        }}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {t.subject}
                    </h4>

                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {t.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {t.user?.name || 'Customer'}
                        </span>
                        {t.company && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} /> {t.company.name}
                          </span>
                        )}
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} /> {t._count?.messages || 1}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right / Ticket Conversation Panel */}
        {selectedTicket && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '780px' }}>
            {/* Thread Header */}
            <div style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#818cf8' }}>
                      {selectedTicket.ticketNumber}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {selectedTicket.subject}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                >
                  Close Panel
                </button>
              </div>

              {/* Tenant & User details */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> <strong>{selectedTicket.user?.name}</strong> ({selectedTicket.user?.email})
                </span>
                {selectedTicket.company && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={14} /> {selectedTicket.company.name}
                  </span>
                )}
              </div>

              {/* Status and Priority controls */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(e.target.value, undefined)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '12px' }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Priority:</span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket(undefined, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '12px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <button
                  onClick={() => handleUpdateTicket('RESOLVED')}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', marginLeft: 'auto' }}
                >
                  <CheckCircle size={13} style={{ marginRight: '4px' }} /> Mark Resolved
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
              {loadingTicketDetail ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0 }}>Loading messages...</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isSuper = m.senderRole === 'SUPER_ADMIN';

                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isSuper ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '85%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: isSuper ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))' : 'var(--surface-subtle)',
                        border: isSuper ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-main)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: '12px' }}>
                          <strong style={{ color: isSuper ? '#c084fc' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isSuper && <ShieldCheck size={13} />}
                            {m.senderName} {isSuper && '(Super Admin)'}
                          </strong>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                          {m.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} style={{ marginTop: '16px', borderTop: '1px solid var(--border-main)', paddingTop: '16px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  required
                  rows={3}
                  placeholder="Type your official Super Admin response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--surface-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Press Send to notify the user and advance ticket to In Progress.
                </span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sendingReply || !replyText.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{sendingReply ? 'Dispatching...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
