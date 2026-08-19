"use client";

import React, { useState, useEffect, useRef } from 'react';

interface CustomerFilesProps {
  customer: any;
}

export function CustomerFiles({ customer }: CustomerFilesProps) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    if (!customer?.id) return;
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [customer?.id]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("File is too large. Maximum size is 50MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      const { fileUrl, name, type } = await uploadRes.json();

      const docRes = await fetch(`/api/crm/customers/${customer.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          type: type,
          fileUrl: fileUrl
        })
      });

      if (!docRes.ok) throw new Error("Failed to link document");

      fetchFiles();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}/documents/${documentId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('image')) return 'image';
    if (type.includes('word') || type.includes('document')) return 'description';
    return 'insert_drive_file';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Documents & Files</h4>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
        />
        <button 
          onClick={handleUploadClick}
          disabled={uploading}
          style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: uploading ? 0.7 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{uploading ? 'hourglass_empty' : 'upload'}</span>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {files.map(file => (
          <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--surface-hover)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--danger-glow)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined">{getIcon(file.type)}</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.title}>{file.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(file.createdAt)}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <a href={file.fileUrl} target="_blank" rel="noreferrer" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              </a>
              <button onClick={() => handleDelete(file.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
              </button>
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents or files uploaded.</div>
        )}
      </div>
    </div>
  );
}
