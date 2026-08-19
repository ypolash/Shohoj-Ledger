"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from "@/components/layout/PageContainer/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader/PageHeader";

// Modular Components
import { SalesOrderStatus } from "../components/SalesOrderStatus";
import { SalesOrderItems } from "../components/SalesOrderItems";
import { QuotationTotals } from "../../quotations/components/QuotationTotals";
import { SalesOrderTimeline } from "../components/SalesOrderTimeline";
import { SalesOrderHistory } from "../components/SalesOrderHistory";
import { SalesOrderInvoices } from "../components/SalesOrderInvoices";
import { SalesOrderPayments } from "../components/SalesOrderPayments";
import { SalesOrderShipment } from "../components/SalesOrderShipment";

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/crm/sales-orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order || data);
        } else {
          if (res.status === 404) {
            router.push('/erp/crm/sales-orders');
            return;
          }
          console.error("API Error Response", res.status);
          const errData = await res.json();
          alert("Failed to load order: " + errData.error);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchOrder();
  }, [params.id, router]);

  if (loading) {
    return <PageContainer><div style={{ padding: '48px', textAlign: 'center' }}>Loading Order...</div></PageContainer>;
  }

  if (!order) return null;

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button 
            onClick={() => router.push('/erp/crm/sales-orders')}
            style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, marginBottom: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            &larr; Back to Sales Orders
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <PageHeader 
              title={order.orderNo || `Order ${order.id.substring(0,8)}`}
              description={`Customer: ${order.customer?.customerName || 'Unknown'}`}
            />
            <div style={{ marginTop: '-8px' }}>
              <SalesOrderStatus status={order.status} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{ padding: '8px 16px', background: 'var(--success-glow)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_shipping</span>
            Fulfill Order
          </button>
          <button 
            onClick={() => router.push(`/erp/crm/sales-orders/${order.id}/edit`)}
            style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* KPI Header Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Due</div>
          <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT', maximumFractionDigits: 0 }).format((order.grandTotal || order.totalAmount || 0) - (order.amountPaid || 0))}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Order Date</div>
          <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>
            {new Date(order.orderDate || order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${order.paymentStatus === 'Paid' ? 'var(--success)' : order.paymentStatus === 'Partial' ? 'var(--info)' : 'var(--warning)'}` }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Status</div>
          <div style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600, color: order.paymentStatus === 'Paid' ? 'var(--success)' : order.paymentStatus === 'Partial' ? 'var(--info)' : 'var(--warning)' }}>
            {order.paymentStatus || 'Unpaid'}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Shipment Status</div>
          <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500, color: order.status === 'DELIVERED' ? 'var(--success)' : 'var(--info)' }}>
            {order.status === 'DELIVERED' ? 'Delivered' : order.status === 'PARTIALLY_DELIVERED' ? 'Partial' : 'Pending'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {['overview', 'payments', 'invoices', 'shipments', 'timeline', 'history'].map(tab => (
          <div 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 0',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: activeTab === tab ? 600 : 500,
              textTransform: 'capitalize',
              fontSize: '14px',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SalesOrderItems items={order.items || []} readOnly={true} />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ padding: '24px', borderRadius: '12px', background: 'var(--surface-main)' }}>
                <QuotationTotals 
                  subtotal={order.subtotal || 0} 
                  totalDiscount={order.discount || 0} 
                  totalTax={order.tax || 0} 
                  grandTotal={order.grandTotal || order.totalAmount || 0} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && <SalesOrderPayments order={order} />}
        {activeTab === 'invoices' && <SalesOrderInvoices />}
        {activeTab === 'shipments' && <SalesOrderShipment />}

        {activeTab === 'timeline' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fulfillment Timeline</h4>
            <SalesOrderTimeline />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Audit Logs</h4>
            <SalesOrderHistory />
          </div>
        )}
      </div>

    </PageContainer>
  );
}
