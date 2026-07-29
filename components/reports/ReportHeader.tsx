import React from 'react';

interface ReportHeaderProps {
  title: string;
  companyName?: string;
  companyLogoUrl?: string; // Optional logo path
}

export function ReportHeader({ 
  title, 
  companyName = "Sarah Calcium Industries",
  companyLogoUrl
}: ReportHeaderProps) {
  const dateStr = new Date().toLocaleString();

  return (
    <div className="print-only-header" style={{ display: 'none', marginBottom: '20px', textAlign: 'center' }}>
      {/* 
        This section is specifically styled for browser print. 
        It is hidden on screen and shown only during window.print() 
      */}
      {companyLogoUrl && (
        <img 
          src={companyLogoUrl} 
          alt={`${companyName} Logo`} 
          style={{ height: '60px', objectFit: 'contain', marginBottom: '10px' }} 
        />
      )}
      <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>{companyName}</h1>
      <h2 style={{ margin: '5px 0', fontSize: '18px', color: '#555' }}>{title}</h2>
      <p style={{ margin: 0, fontSize: '12px', color: '#777' }}>Generated: {dateStr}</p>
      <hr style={{ marginTop: '15px', border: 'none', borderTop: '2px solid #2980b9' }} />
    </div>
  );
}
