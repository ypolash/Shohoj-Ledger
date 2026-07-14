"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type IncomeCategory = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export default function IncomeCategoriesPage() {
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/income-categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/income-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }

      setName("");
      setDescription("");
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/income-categories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCategories();
      } else {
        alert("Failed to delete category");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting category");
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Income Categories</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Manage categories for income tracking.</p>
        </div>
        <Link href="/dashboard/income" className="btn btn-secondary">
          &larr; Back to Income
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 2fr' }}>
        
        {/* Create Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Add New Category</h2>
          
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">Category Name</label>
              <input 
                required 
                className="input" 
                placeholder="e.g. Consulting, Subscription" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div>
              <label className="label">Description (Optional)</label>
              <textarea 
                className="input" 
                placeholder="Optional details..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Adding..." : "Add Category"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="glass-card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Existing Categories</h2>
          
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No categories found. Create one to get started.</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px', fontWeight: 'normal' }}>Name</th>
                  <th style={{ padding: '12px', fontWeight: 'normal' }}>Description</th>
                  <th style={{ padding: '12px', fontWeight: 'normal', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>{cat.description || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(cat.id)}
                        className="btn btn-danger"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
