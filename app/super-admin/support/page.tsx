"use client";

import React, { useState, useEffect } from 'react';
import { 
  Headphones, 
  Search, 
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
  Tag,
  X,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import styles from './support.module.css';

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
        window.location.href = '/super-admin/login';
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
      showToast('Official response dispatched to customer!', 'success');

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

  const getPriorityBadgeStyle = (p: string) => {
    switch (p) {
      case 'URGENT':
        return { background: 'rgba(239, 68, 68, 0.18)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
      case 'HIGH':
        return { background: 'rgba(249, 115, 22, 0.18)', color: '#fb923c', border: '1px solid rgba(249, 115, 22, 0.35)' };
      case 'MEDIUM':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.25)' };
    }
  };

  const getStatusBadgeStyle = (s: string) => {
    switch (s) {
      case 'OPEN':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'IN_PROGRESS':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'RESOLVED':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      default:
        return { background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8', border: '1px solid rgba(100, 116, 139, 0.25)' };
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={styles.toast}
          style={{ backgroundColor: toastMessage.type === 'success' ? '#10b981' : '#ef4444' }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Executive Mission Control Header */}
      <section className={styles.headerCard}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.liveBadgeRow}>
            <div className={styles.livePulseDot} />
            <span className={styles.liveBadgeText}>Master Helpdesk &amp; SLA Queue Active</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Headphones size={26} style={{ color: '#c084fc' }} />
            Super Admin Customer Support Desk
          </h1>
          <p className={styles.pageSubtitle}>
            Central multi-tenant helpdesk: resolve tenant inquiries, track service SLA response metrics, and maintain cross-tenant operational support.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button 
            type="button" 
            onClick={fetchTickets} 
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh Queue"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Queue'}</span>
          </button>
        </div>
      </section>

      {/* 2. KPI Metric Cards Grid */}
      <section className={styles.kpiGrid}>
        {/* Open Inquiries */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <MessageSquare size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              Queue
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Open Inquiries</span>
            <span className={styles.kpiValue} style={{ color: '#60a5fa' }}>{metrics.open}</span>
          </div>
        </div>

        {/* In Progress */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <Clock size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              Investigating
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>In Progress</span>
            <span className={styles.kpiValue} style={{ color: '#c084fc' }}>{metrics.inProgress}</span>
          </div>
        </div>

        {/* Urgent Escalations */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <AlertTriangle size={24} />
            </div>
            <span 
              className={styles.kpiBadge} 
              style={{ 
                background: metrics.urgent > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.15)', 
                color: metrics.urgent > 0 ? '#f87171' : '#94a3b8' 
              }}
            >
              {metrics.urgent > 0 ? 'Urgent Alert' : 'Normal'}
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Urgent Escalations</span>
            <span className={styles.kpiValue} style={{ color: metrics.urgent > 0 ? '#f87171' : '#ffffff' }}>
              {metrics.urgent}
            </span>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardTop}>
            <div className={styles.kpiIconBox} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CheckCircle2 size={24} />
            </div>
            <span className={styles.kpiBadge} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              Completed
            </span>
          </div>
          <div className={styles.kpiBody}>
            <span className={styles.kpiLabel}>Resolved Tickets</span>
            <span className={styles.kpiValue} style={{ color: '#34d399' }}>{metrics.resolved}</span>
          </div>
        </div>
      </section>

      {/* 3. Main Split Helpdesk Workspace */}
      <div className={`${styles.workspaceGrid} ${selectedTicket ? styles.workspaceGridSplit : ''}`}>
        {/* Left Side: Ticket Queue & Filters */}
        <section className={styles.mainCard}>
          {/* Controls Bar */}
          <div className={styles.controlsBar}>
            <div className={styles.controlsLeft}>
              {/* Search */}
              <div className={styles.searchWrapper}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search ticket # or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    onClick={() => setSearchTerm('')} 
                    className={styles.clearSearchBtn}
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className={styles.filterTabsRow}>
            <button
              type="button"
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className={`${styles.filterTabBtn} ${statusFilter === '' && priorityFilter === '' ? styles.filterTabBtnActive : ''}`}
            >
              <Headphones size={13} />
              <span>All ({tickets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('OPEN')}
              className={`${styles.filterTabBtn} ${statusFilter === 'OPEN' ? styles.filterTabBtnActive : ''}`}
            >
              <MessageSquare size={13} />
              <span>Open ({metrics.open})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`${styles.filterTabBtn} ${statusFilter === 'IN_PROGRESS' ? styles.filterTabBtnActive : ''}`}
            >
              <Clock size={13} />
              <span>In Progress ({metrics.inProgress})</span>
            </button>

            <button
              type="button"
              onClick={() => setPriorityFilter('URGENT')}
              className={`${styles.filterTabBtn} ${priorityFilter === 'URGENT' ? styles.filterTabBtnActive : ''}`}
            >
              <AlertTriangle size={13} />
              <span>Urgent ({metrics.urgent})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('RESOLVED')}
              className={`${styles.filterTabBtn} ${statusFilter === 'RESOLVED' ? styles.filterTabBtnActive : ''}`}
            >
              <CheckCircle2 size={13} />
              <span>Resolved ({metrics.resolved})</span>
            </button>
          </div>

          {/* Ticket List Stream */}
          <div className={styles.ticketList}>
            {loading ? (
              <div className={styles.emptyState}>
                <RefreshCw size={24} className={styles.spinning} style={{ color: '#a855f7' }} />
                <span>Loading support queue...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className={styles.emptyState}>
                <Headphones size={48} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: '15px', color: '#cbd5e1' }}>No support tickets found</p>
                <span style={{ fontSize: '13px' }}>There are currently no customer inquiries matching this filter.</span>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const pStyle = getPriorityBadgeStyle(t.priority);
                const sStyle = getStatusBadgeStyle(t.status);

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    className={`${styles.ticketItem} ${isSelected ? styles.ticketItemActive : ''}`}
                  >
                    <div className={styles.ticketTopRow}>
                      <div className={styles.ticketNumberGroup}>
                        <span className={styles.ticketNumber}>
                          #{t.ticketNumber || t.id.slice(-6)}
                        </span>
                        <span className={styles.priorityTag} style={pStyle}>
                          {t.priority}
                        </span>
                        <span className={styles.statusTag} style={sStyle}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>

                      <span className={styles.ticketDate}>
                        {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className={styles.ticketSubject}>
                      {t.subject}
                    </h4>

                    <p className={styles.ticketDesc}>
                      {t.description}
                    </p>

                    <div className={styles.ticketFooterRow}>
                      <div className={styles.ticketUserMeta}>
                        <span className={styles.ticketMetaItem}>
                          <User size={13} style={{ color: '#94a3b8' }} /> 
                          <span>{t.user?.name || 'Customer'}</span>
                        </span>
                        {t.company && (
                          <span className={styles.ticketMetaItem}>
                            <Building2 size={13} style={{ color: '#94a3b8' }} /> 
                            <span>{t.company.name}</span>
                          </span>
                        )}
                      </div>

                      <span className={styles.ticketMetaItem}>
                        <MessageSquare size={13} /> 
                        <span>{t._count?.messages || 1} msgs</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Side: Active Ticket Conversation & Reply Panel */}
        {selectedTicket && (
          <section className={styles.conversationCard}>
            {/* Thread Header */}
            <div className={styles.threadHeader}>
              <div className={styles.threadTopRow}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#c084fc' }}>
                      #{selectedTicket.ticketNumber || selectedTicket.id.slice(-6)}
                    </span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8', textTransform: 'uppercase' }}>
                      {selectedTicket.category || 'GENERAL'}
                    </span>
                  </div>
                  <h3 className={styles.threadTitle}>
                    {selectedTicket.subject}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className={styles.closePanelBtn}
                >
                  Close Panel
                </button>
              </div>

              {/* User & Company Meta */}
              <div className={styles.threadMetaRow}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <User size={14} style={{ color: '#60a5fa' }} /> 
                  <strong>{selectedTicket.user?.name}</strong> ({selectedTicket.user?.email})
                </span>
                {selectedTicket.company && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Building2 size={14} style={{ color: '#fbbf24' }} /> 
                    <span>{selectedTicket.company.name}</span>
                  </span>
                )}
              </div>

              {/* Status & Priority Quick Modifiers */}
              <div className={styles.threadControlsRow}>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Status:</span>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateTicket(e.target.value, undefined)}
                    className={styles.filterSelect}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Priority:</span>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdateTicket(undefined, e.target.value)}
                    className={styles.filterSelect}
                    style={{ padding: '4px 8px', fontSize: '12px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateTicket('RESOLVED')}
                  className={styles.resolveBtn}
                >
                  <CheckCircle size={14} />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>

            {/* Live Message Thread Stream */}
            <div className={styles.messageStream}>
              {loadingTicketDetail ? (
                <div className={styles.emptyState}>
                  <RefreshCw size={20} className={styles.spinning} style={{ color: '#a855f7' }} />
                  <span>Loading conversation stream...</span>
                </div>
              ) : (
                messages.map((m) => {
                  const isSuper = m.senderRole === 'SUPER_ADMIN';

                  return (
                    <div
                      key={m.id}
                      className={isSuper ? styles.messageBubbleSuper : styles.messageBubbleCustomer}
                    >
                      <div className={styles.messageHeader}>
                        <span className={isSuper ? styles.senderSuper : styles.senderCustomer}>
                          {isSuper ? <ShieldCheck size={14} /> : <User size={13} />}
                          <span>{m.senderName} {isSuper && '(Super Admin)'}</span>
                        </span>
                        <span className={styles.messageTime}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={styles.messageBody}>
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Official Response Composer */}
            <form onSubmit={handleSendReply} className={styles.replyComposer}>
              <textarea
                required
                rows={3}
                placeholder="Type your official Super Admin response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={styles.replyTextarea}
              />

              <div className={styles.replyBottomBar}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Press Send to notify user and automatically transition ticket.
                </span>

                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className={styles.replySendBtn}
                >
                  <Send size={14} />
                  <span>{sendingReply ? 'Dispatching...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
