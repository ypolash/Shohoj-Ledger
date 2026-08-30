"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/crm/sales-orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const ord = data.order || data;
          setOrder(ord);
        } else {
          alert("Failed to load order for invoice.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading Invoice...</div>;
  }

  if (!order) return <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'sans-serif' }}>Order not found.</div>;

  const orderNumber = order.salesOrderNumber || order.orderNo || order.id?.substring(0, 8);
  const orderDate = new Date(order.orderDate || order.createdAt).toLocaleDateString();
  const customerName = order.customer?.name || order.customer?.displayName || 'Walk-in Customer';
  
  const items = order.items || (order.lines ? order.lines.map((line: any) => ({
    id: line.id,
    description: line.remarks || line.product?.name || 'Item',
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    discount: Number(line.discountAmount) || 0,
    total: Number(line.lineTotal) || 0
  })) : []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT' }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const companyName = order.company?.name || 'Shohoj Ledger';
  const companyLogo = order.company?.logoUrl;

  const totalDue = (order.grandTotal || order.totalAmount || 0) - (order.amountPaid || 0);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;600&display=swap');
        
        @media print {
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide AppShell Layout Elements */
          aside, header, nav {
            display: none !important;
          }
          /* Reset main wrapper styles to prevent blank pages or margins */
          main, div[class*="mainWrapper"] {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            position: static !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-wrapper {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: none !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }

        body {
          margin: 0;
          background: #f3f4f6;
        }

        .invoice-wrapper {
          max-width: 21cm; /* A4 width */
          margin: 40px auto;
          background: #fff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          font-family: 'Open Sans', sans-serif;
          color: #333;
          position: relative;
          overflow: hidden;
          min-height: 29.7cm; /* A4 height */
        }

        /* Top Header Area with colored background */
        .header-bg {
          background-color: #dbebe8; /* Light mint green from example */
          padding: 40px 40px 30px 140px;
          position: relative;
          display: flex;
          justify-content: space-between;
        }

        /* The vertical INVOICE banner */
        .invoice-banner {
          position: absolute;
          left: 40px;
          top: 0;
          width: 70px;
          height: 300px;
          background-color: #333333;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .invoice-banner-text {
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 6px;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }

        .header-left {
          flex: 1;
        }

        .header-right {
          flex: 1;
          text-align: right;
          font-size: 11px;
          line-height: 1.6;
          color: #444;
        }

        .company-logo-area {
          margin-bottom: 20px;
        }

        .company-logo {
          max-height: 60px;
        }

        .company-logo-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 12px;
          text-transform: uppercase;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 80px auto;
          gap: 4px;
          font-size: 11px;
          margin-top: 10px;
          color: #444;
        }
        
        .info-label {
          font-weight: 600;
        }

        /* Middle Section: Total Due and To */
        .middle-section {
          padding: 0 40px 20px 140px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          background-color: #dbebe8;
          border-bottom: 15px solid #fff;
        }

        .total-due-box {
          background-color: #333;
          color: #fff;
          padding: 8px 15px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 12px;
          display: inline-block;
          margin-bottom: 15px;
        }

        .bill-to-area {
          font-size: 11px;
          line-height: 1.5;
        }

        .bill-to-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .client-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        /* Items Table */
        .table-container {
          padding: 20px 40px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          font-family: 'Montserrat', sans-serif;
          text-transform: uppercase;
          font-size: 10px;
          font-weight: 700;
          color: #333;
          padding: 10px;
          border-bottom: 2px solid #eee;
          text-align: left;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        td {
          padding: 12px 10px;
          font-size: 11px;
          border-bottom: 1px solid #f5f5f5;
        }

        tbody tr:nth-child(odd) {
          background-color: #f9fafa;
        }

        .item-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          font-size: 12px;
          color: #333;
          margin-bottom: 3px;
        }

        .item-desc {
          color: #777;
          font-size: 10px;
        }

        /* Footer Section */
        .footer-section {
          padding: 30px 40px 50px 40px;
          display: flex;
          justify-content: space-between;
        }

        .footer-left {
          flex: 1;
          padding-right: 40px;
        }

        .footer-right {
          width: 250px;
        }

        .footer-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .footer-text {
          font-size: 10px;
          color: #666;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .thank-you {
          font-family: 'Montserrat', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }

        .totals-table {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
        }

        .totals-table td {
          padding: 6px 0;
          border-bottom: none;
        }

        .totals-table .total-row td {
          border-top: 1px solid #ccc;
          border-bottom: 1px solid #ccc;
          padding: 10px 0;
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #333;
        }

        .signature-area {
          margin-top: 40px;
          text-align: right;
        }

        .signature-line {
          border-bottom: 1px solid #999;
          width: 150px;
          margin: 0 0 5px auto;
          display: inline-block;
        }

        .signature-name {
          font-size: 10px;
          font-weight: 600;
        }

        .signature-title {
          font-size: 9px;
          color: #666;
        }
      `}} />

      {/* Top action bar (hidden when printing) */}
      <div className="no-print" style={{ 
        background: '#111827', 
        padding: '16px 24px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        color: 'white'
      }}>
        <div>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Order
          </button>
        </div>
        <div>
          <button 
            onClick={handlePrint}
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '8px 20px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            Print Invoice
          </button>
        </div>
      </div>

      {/* The Invoice Document */}
      <div className="invoice-wrapper">
        <div className="invoice-banner">
          <div className="invoice-banner-text">INVOICE</div>
        </div>

        <div className="header-bg">
          <div className="header-left">
            <div className="company-logo-area">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="company-logo" />
              ) : (
                <div className="company-logo-placeholder" style={{ 
                  width: '100px', height: '100px', 
                  borderRadius: '50%', 
                  border: '2px solid #333', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '10px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ 
                    fontFamily: "'Montserrat', sans-serif", 
                    fontWeight: 700, 
                    fontSize: companyName.length > 12 ? '10px' : '12px',
                    textTransform: 'uppercase',
                    wordBreak: 'break-word',
                    lineHeight: '1.2'
                  }}>
                    {companyName}
                  </span>
                </div>
              )}
            </div>
            
            <div className="info-grid">
              {order.referenceNumber && (
                <>
                  <div className="info-label">Project:</div>
                  <div>{order.referenceNumber}</div>
                </>
              )}
              <div className="info-label">Invoice No#</div>
              <div>{orderNumber}</div>
              <div className="info-label">Account #</div>
              <div>{order.customer?.id ? order.customer.id.substring(0, 12).toUpperCase() : 'N/A'}</div>
              <div className="info-label">Date:</div>
              <div>{orderDate}</div>
            </div>
          </div>
          
          <div className="header-right">
            {order.company?.address && <div>{order.company.address}</div>}
            {(order.company?.city || order.company?.country) && <div>{order.company?.city ? `${order.company.city}, ` : ''}{order.company?.country || ''}</div>}
            
            {order.company?.phone && (
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>call</span>
                {order.company.phone}
              </div>
            )}
            
            {order.company?.email && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>mail</span>
                {order.company.email}
              </div>
            )}
            
            {order.company?.website && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>language</span>
                {order.company.website}
              </div>
            )}
          </div>
        </div>

        <div className="middle-section">
          <div className="header-left">
            {/* Empty space matching info grid */}
          </div>
          <div className="header-right" style={{ textAlign: 'left', flex: 1, paddingLeft: '40px' }}>
            <div className="total-due-box">
              Total Due : &nbsp; {formatCurrency(totalDue)}
            </div>
            <div className="bill-to-area">
              <div className="bill-to-title">To:</div>
              <div className="client-name">{customerName}</div>
              <div>{order.customer?.address || 'Customer Address Here'}</div>
              {order.customer?.phone && <div>{order.customer.phone}</div>}
              {order.customer?.email && <div>{order.customer.email}</div>}
            </div>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ITEM DESCRIPTION</th>
                <th className="text-right">PRICE</th>
                <th className="text-center">QTY</th>
                <th className="text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <div className="item-name">{item.description}</div>
                    {item.discount > 0 && <div className="item-desc">Includes discount of {formatCurrency(item.discount)}</div>}
                  </td>
                  <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.total)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center" style={{ padding: '30px', color: '#999' }}>No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="footer-section">
          <div className="footer-left">
            <div className="footer-title">PAYMENT INFO</div>
            <div className="footer-text">
              Status: {order.paymentStatus || 'Unpaid'}<br/>
              Method: Bank Transfer / Credit Card<br/>
              Payment Terms: Due on Receipt
            </div>

            <div className="thank-you">Thank you !</div>
            <div className="footer-title" style={{ marginTop: '15px' }}>Terms & Condition</div>
            <div className="footer-text">
              Please pay your invoice within the specified due date. Late payments may be subject to additional fees as per our company policy.
            </div>
          </div>
          <div className="footer-right">
            <table className="totals-table">
              <tbody>
                <tr>
                  <td>Sub Total</td>
                  <td className="text-right">{formatCurrency(order.subtotal || 0)}</td>
                </tr>
                {order.discountAmount > 0 && (
                  <tr>
                    <td>Discount</td>
                    <td className="text-right">-{formatCurrency(order.discountAmount)}</td>
                  </tr>
                )}
                {order.taxAmount > 0 && (
                  <tr>
                    <td>Tax</td>
                    <td className="text-right">{formatCurrency(order.taxAmount)}</td>
                  </tr>
                )}
                <tr className="total-row">
                  <td>TOTAL</td>
                  <td className="text-right">{formatCurrency(order.grandTotal || order.totalAmount || 0)}</td>
                </tr>
                {order.amountPaid > 0 && (
                  <tr>
                    <td style={{ paddingTop: '10px' }}>Amount Paid</td>
                    <td className="text-right" style={{ paddingTop: '10px' }}>{formatCurrency(order.amountPaid)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="signature-area">
              <span className="signature-line" style={{ fontFamily: "'Dancing Script', cursive", fontSize: '20px', lineHeight: '1', paddingBottom: '5px' }}>
                {companyName.split(' ')[0]} Auth
              </span>
              <div className="signature-name">{companyName}</div>
              <div className="signature-title">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
