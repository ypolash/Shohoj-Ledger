"use client";

import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader/PageHeader';
import { 
  Headphones, 
  PlusCircle, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface SupportMessage {
  id: string;
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
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

export default function TenantSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
  });

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/support/tickets');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const loadTicketConversation = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/system/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error('Failed to load ticket');
      const data = await res.json();
      setSelectedTicket(data.ticket);
      setMessages(data.ticket?.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/system/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      setShowCreateModal(false);
      setNewTicket({ subject: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
      fetchMyTickets();
    } catch (e) {
      console.error(e);
      alert('Failed to submit support request');
    } finally {
      setSubmitting(false);
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
    } catch (e) {
      console.error(e);
      alert('Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Customer Support & Helpdesk" 
        description="Need assistance with billing, modules, or account settings? Contact platform administrators directly."
      />

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '20px' }}>
        
        {/* Tickets List */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Your Inquiries</h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <PlusCircle size={16} /> Open Support Ticket
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0 }}>Loading support tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <HelpCircle size={48} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ margin: '0 0 12px 0' }}>You have no open support requests.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketConversation(t.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--surface-subtle)',
                      border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-main)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#818cf8' }}>
                        {t.ticketNumber}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 600,
                        background: t.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: t.status === 'RESOLVED' ? '#34d399' : '#818cf8',
                      }}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600 }}>{t.subject}</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation View */}
        {selectedTicket && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '640px' }}>
            <div style={{ borderBottom: '1px solid var(--border-main)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 700, fontFamily: 'monospace' }}>
                  {selectedTicket.ticketNumber}
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 700 }}>
                  {selectedTicket.subject}
                </h3>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                Close
              </button>
            </div>

            {/* Message Thread */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
              {messages.map((m) => {
                const isSuper = m.senderRole === 'SUPER_ADMIN';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isSuper ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: isSuper ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))' : 'var(--surface-subtle)',
                      border: isSuper ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-main)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '12px' }}>
                        <strong style={{ color: isSuper ? '#c084fc' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isSuper && <ShieldCheck size={13} />}
                          {m.senderName} {isSuper && '(Platform Support)'}
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
              })}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} style={{ marginTop: '16px', borderTop: '1px solid var(--border-main)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  required
                  type="text"
                  placeholder="Type a message to support..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '13px' }}
                />
                <button type="submit" className="btn btn-primary" disabled={sendingReply || !replyText.trim()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', position: 'relative', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700 }}>Open Support Ticket</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Describe your question or issue. Our platform engineering and support team will respond promptly.
            </p>

            <form onSubmit={handleCreateTicket}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Subject *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Question regarding invoice PDF generation"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="GENERAL">General Inquiries</option>
                    <option value="TECHNICAL">Technical Issue / Bug</option>
                    <option value="BILLING">Billing & Subscription</option>
                    <option value="ACCOUNT">Account Privileges</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Escalation</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about the issue or question..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--surface-subtle)', color: 'var(--text-main)', fontSize: '14px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
