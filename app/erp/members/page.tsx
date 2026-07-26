"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Member = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  status: string;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to load members', error);
    } finally {
      setIsLoading(false);
    }
  };


  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Pre-defined avatars colors based on role
  const getRoleColor = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('ceo')) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (r.includes('developer')) return 'linear-gradient(135deg, #0ea5e9, #0284c7)';
    return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Members</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Manage core team members and their profiles.</p>
        </div>

      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading members...</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '24px' 
        }}>
          {members.map((member) => (
            <Link href={`/erp/members/${member.id}`} key={member.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card topo-bg" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', height: '100%' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: getRoleColor(member.role),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#fff',
                  marginBottom: '16px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}>
                  {getInitials(member.name)}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{member.name}</h3>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px', 
                  background: 'rgba(255,255,255,0.05)', 
                  borderRadius: '99px',
                  fontSize: '12px',
                  color: '#a5b4fc',
                  marginBottom: '16px'
                }}>
                  {member.role}
                </span>
                
                <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', display: 'flex', justifyContent: 'space-around', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#94a3b8', marginBottom: '4px' }}>mail</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{member.email ? 'Linked' : 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#94a3b8', marginBottom: '4px' }}>call</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{member.phone ? 'Linked' : 'None'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: member.status === 'ACTIVE' ? '#10b981' : '#f59e0b', marginBottom: '4px' }}>verified_user</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{member.status}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}


    </div>
  );
}
