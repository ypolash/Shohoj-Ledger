"use client";

import React, { useEffect, useState } from 'react';

type Member = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: string;
  financials?: {
    walletBalance: number;
    totalAdvances: number;
    totalLoans: number;
    totalEarned: number;
    availableForWithdrawal: number;
    recentTransactions: any[];
  }
};

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMember();
  }, [unwrappedParams.id]);

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/members/${unwrappedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      }
    } catch (error) {
      console.error('Failed to load member', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('ceo')) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (r.includes('developer')) return 'linear-gradient(135deg, #0ea5e9, #0284c7)';
    return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(amount);
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading member profile...</div>;
  }

  if (!member) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Member not found.</div>;
  }

  const financials = member.financials || {
    walletBalance: 0,
    totalAdvances: 0,
    totalLoans: 0,
    totalEarned: 0,
    availableForWithdrawal: 0,
    recentTransactions: []
  };

  const totalDeductions = financials.totalAdvances + financials.totalLoans;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Top Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Profile Card */}
        <div className="glass-card topo-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ 
            width: '96px', 
            height: '96px', 
            borderRadius: '50%', 
            background: getRoleColor(member.role),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
          }}>
            {getInitials(member.name)}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{member.name}</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 16px 0', fontSize: '14px' }}>{member.role}</p>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981', 
            padding: '6px 16px', 
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
            Active Member
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div className="glass-card topo-bg" style={{ padding: '32px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Total Wallet Balance</p>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', margin: 0 }}>{formatCurrency(financials.walletBalance)}</h1>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#a5b4fc' }}>account_balance_wallet</span>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', margin: '24px 0' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0' }}>Advance</p>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{formatCurrency(financials.totalAdvances)}</h2>
            </div>
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span>
              Withdraw Funds
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
        
        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>payments</span>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>Total Earned</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#fff' }}>{formatCurrency(financials.totalEarned)}</h2>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '20px' }}>account_balance</span>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>Active Loans</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{formatCurrency(financials.totalLoans)}</h2>
        </div>

        <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: '#a5b4fc', fontSize: '20px' }}>receipt_long</span>
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 'bold' }}>Total Deductions Pending</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{formatCurrency(totalDeductions)}</h2>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Recent Transactions</h2>
          <span style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 'bold' }}>Last 5 Actions</span>
        </div>

        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {financials.recentTransactions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  No recent transactions found for this member.
                </td>
              </tr>
            ) : (
              financials.recentTransactions.map((tx: any) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px 12px', color: '#94a3b8', fontSize: '14px' }}>
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 500 }}>{tx.description}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ 
                      background: tx.type === 'positive' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      color: tx.type === 'positive' ? '#10b981' : '#f59e0b', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '11px' 
                    }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', textAlign: 'right', fontSize: '14px', color: tx.type === 'positive' ? '#10b981' : '#f87171' }}>
                    {tx.type === 'positive' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
