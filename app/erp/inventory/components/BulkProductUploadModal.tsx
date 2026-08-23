import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import * as XLSX from 'xlsx';

interface BulkProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export default function BulkProductUploadModal({ isOpen, onClose, onSuccess }: BulkProductUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = [
    "Product Code*", "Name*", "Category", "Unit", 
    "Purchase Price", "Selling Price", "Min Stock", "Description", "Notes"
  ];

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      expectedHeaders,
      ["PRD-001", "Sample Product", "Electronics", "pcs", 100, 150, 5, "A great product", "Keep dry"]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products Template");
    XLSX.writeFile(wb, "Bulk_Product_Upload_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setParsedData([]);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
        
        if (data.length === 0) {
          setError("The uploaded file is empty.");
          return;
        }

        // Map column names to our expected property names
        const mappedData = data.map(row => ({
          productCode: row["Product Code*"] || row["Product Code"] || row["productCode"] || row["code"],
          name: row["Name*"] || row["Name"] || row["name"],
          categoryName: row["Category"] || row["category"],
          unit: row["Unit"] || row["unit"],
          purchasePrice: row["Purchase Price"] || row["purchasePrice"] || 0,
          sellingPrice: row["Selling Price"] || row["sellingPrice"] || 0,
          minStock: row["Min Stock"] || row["minStock"] || 0,
          description: row["Description"] || row["description"],
          notes: row["Notes"] || row["notes"]
        }));

        // Validate mapped data
        const missingRequired = mappedData.filter(item => !item.productCode || !item.name);
        if (missingRequired.length > 0) {
          setError(`Found ${missingRequired.length} rows missing required fields (Product Code or Name). Please fix and try again.`);
          return;
        }

        setParsedData(mappedData);
      } catch (err: any) {
        console.error(err);
        setError("Failed to parse the file. Please ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/inventory/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFile(null);
        setParsedData([]);
        onSuccess(data.count);
      } else {
        setError(data.error || "Failed to upload products.");
      }
    } catch (err: any) {
      setError("A network error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Product Upload" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px 0' }}>
        
        <div style={{ padding: '16px', background: 'var(--surface-hover)', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-main)' }}>Step 1: Download Template</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Start by downloading our standard Excel template. Fill in your product details carefully. <b>Product Code</b> and <b>Name</b> are required for every row.
          </p>
          <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>download</span>
            Download Template
          </button>
        </div>

        <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)' }}>Step 2: Upload File</h4>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="btn btn-secondary" 
              style={{ fontSize: '13px', padding: '6px 12px' }}
              disabled={isUploading}
            >
              Choose File
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {file ? file.name : "No file selected"}
            </span>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--danger)' }}>
              {error}
            </div>
          )}

          {!error && parsedData.length > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--success)' }}>
              Ready to import <b>{parsedData.length}</b> products!
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload} 
            disabled={parsedData.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Products'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
