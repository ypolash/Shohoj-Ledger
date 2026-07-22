"use client";

import React, { useState, useEffect } from 'react';

type Designation = {
  id: string;
  name: string;
  grade: string | null;
  level: string | null;
  description: string | null;
  isActive: boolean;
  _count?: { employees: number };
};

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<Designation | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    level: '',
    description: '',
    isActive: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/designations');
      if (res.ok) {
        setDesignations(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (desig?: Designation) => {
    if (desig) {
      setEditingDesig(desig);
      setFormData({
        name: desig.name,
        grade: desig.grade || '',
        level: desig.level || '',
        description: desig.description || '',
        isActive: desig.isActive
      });
    } else {
      setEditingDesig(null);
      setFormData({ name: '', grade: '', level: '', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingDesig ? `/api/designations/${editingDesig.id}` : '/api/designations';
      const method = editingDesig ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        alert(`Failed to save designation: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'An error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string, currentStatus: boolean) => {
    if (!confirm(currentStatus ? 'Archive this designation?' : 'Restore this designation?')) return;
    try {
      const desig = designations.find(d => d.id === id);
      if (!desig) return;

      await fetch(`/api/designations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...desig, isActive: !currentStatus })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', fontFamily: 'serif' }}>Designations</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#94a3b8' }}>Manage job titles, grades, and levels.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary" 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Designation
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading designations...</div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Designation</th>
                <th style={{ padding: '12px' }}>Grade</th>
                <th style={{ padding: '12px' }}>Level</th>
                <th style={{ padding: '12px' }}>Employees</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {designations.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: d.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                    {d.description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{d.description}</div>}
                  </td>
                  <td style={{ padding: '12px' }}>{d.grade || '-'}</td>
                  <td style={{ padding: '12px' }}>{d.level || '-'}</td>
                  <td style={{ padding: '12px' }}>{d._count?.employees || 0}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: d.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                      color: d.isActive ? '#10b981' : '#ef4444',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {d.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => handleOpenModal(d)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                    </button>
                    <button onClick={() => handleArchive(d.id, d.isActive)} style={{ background: 'none', border: 'none', color: d.isActive ? '#ef4444' : '#10b981', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{d.isActive ? 'archive' : 'unarchive'}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {designations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No designations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50,
          paddingTop: '8vh'
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{editingDesig ? 'Edit Designation' : 'Add Designation'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Designation Title *</label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Grade</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.grade} 
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Level</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>Description</label>
                <textarea 
                  className="input" 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ background: 'rgba(255,255,255,0.05)' }} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
