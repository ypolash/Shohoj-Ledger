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
import { SalesOrderPayments } from "../components/SalesOrderPayments";
import { SalesOrderShipment } from "../components/SalesOrderShipment";

import { useUI } from "@/lib/contexts/UIContext";

import styles from './SalesOrderDetail.module.css';

export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setPageTitleOverride } = useUI();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/crm/sales-orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          const ord = data.order || data;
          setOrder(ord);
          if (ord) {
            const title = ord.salesOrderNumber || ord.orderNo || `Order ${ord.id ? ord.id.substring(0, 8) : ''}`;
            setPageTitleOverride(title);
          }
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
    return () => setPageTitleOverride(null);
  }, [params.id, router, setPageTitleOverride]);

  const handleShipmentStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/crm/sales-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await (await fetch(`/api/crm/sales-orders/${params.id}`)).json();
        setOrder(data.order || data);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update shipment status");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error updating status");
    }
  };

  const handleStatusAction = async (action: string) => {
    try {
      const res = await fetch(`/api/crm/sales-orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const data = await (await fetch(`/api/crm/sales-orders/${params.id}`)).json();
        setOrder(data.order || data);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600 }}>
          Loading Sales Order...
        </div>
      </PageContainer>
    );
  }

  if (!order) return null;

  const amountDue = (order.grandTotal || order.totalAmount || 0) - (order.amountPaid || 0);

  const getShipmentColor = (st: string) => {
    switch (st) {
      case 'DELIVERED': return '#10b981';
      case 'PARTIALLY_DELIVERED': return '#a855f7';
      case 'APPROVED': return '#06b6d4';
      case 'OPEN': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'view_agenda' },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'shipments', label: 'Shipments', icon: 'local_shipping' },
    { id: 'timeline', label: 'Timeline', icon: 'timeline' },
    { id: 'history', label: 'History', icon: 'history' }
  ];

  return (
    <PageContainer>
      <div className={styles.pageWrapper}>
        
        {/* Top Header Block */}
        <div className={styles.headerBlock}>
          <div className={styles.topRow}>
            <button 
              onClick={() => router.push('/erp/crm/sales-orders')}
              className={styles.backBtn}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
              Back to Sales Orders
            </button>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.orderIdentity}>
              <div className={styles.orderTitleGroup}>
                <h1 className={styles.orderNumber}>
                  {order.salesOrderNumber || order.orderNo || `Order ${order.id.substring(0,8)}`}
                </h1>
                <SalesOrderStatus status={order.status} />
              </div>
              <p className={styles.orderCustomer}>
                Customer: <span className={styles.customerHighlight}>{order.customer?.name || order.customer?.customerName || 'Unknown'}</span>
                {order.referenceNumber && <span>• Ref: <strong>{order.referenceNumber}</strong></span>}
              </p>
            </div>

            {/* Actions Bar */}
            <div className={styles.actionGroup}>
              {order.status === 'DRAFT' && (
                <button 
                  onClick={() => handleStatusAction('APPROVE')}
                  className={`${styles.actionBtn} ${styles.btnApprove}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  Approve Order
                </button>
              )}
              
              {order.status === 'APPROVED' && (
                <button 
                  onClick={() => handleStatusAction('RESERVE')}
                  className={`${styles.actionBtn} ${styles.btnReserve}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
                  Reserve Stock
                </button>
              )}
              
              {(order.status === 'OPEN' || order.status === 'PARTIALLY_DELIVERED') && (
                <button 
                  onClick={() => handleStatusAction('CLOSE')}
                  className={`${styles.actionBtn} ${styles.btnFulfill}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_shipping</span>
                  Fulfill Order
                </button>
              )}

              <button 
                onClick={() => router.push(`/erp/crm/sales-orders/${order.id}/invoice`)}
                className={`${styles.actionBtn} ${styles.btnInvoice}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span>
                Generate Invoice
              </button>

              <button 
                onClick={() => router.push(`/erp/crm/sales-orders/${order.id}/edit`)}
                className={`${styles.actionBtn} ${styles.btnEdit}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className={styles.kpiGrid}>
          {/* Card 1: Amount Due */}
          <div className={styles.kpiCard} style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className={styles.kpiLabel}>
              <span>Amount Due</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6' }}>account_balance_wallet</span>
            </div>
            <div className={styles.kpiValue}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency || 'BDT', maximumFractionDigits: 0 }).format(amountDue)}
            </div>
          </div>

          {/* Card 2: Order Date */}
          <div className={styles.kpiCard} style={{ borderLeft: '4px solid #06b6d4' }}>
            <div className={styles.kpiLabel}>
              <span>Order Date</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#06b6d4' }}>calendar_today</span>
            </div>
            <div className={styles.kpiValue} style={{ fontSize: '16px' }}>
              {new Date(order.orderDate || order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </div>
          </div>

          {/* Card 3: Payment Status */}
          <div className={styles.kpiCard} style={{ 
            borderLeft: `4px solid ${order.paymentStatus === 'Paid' ? '#10b981' : order.paymentStatus === 'Partial' ? '#06b6d4' : '#f59e0b'}` 
          }}>
            <div className={styles.kpiLabel}>
              <span>Payment Status</span>
              <span className="material-symbols-outlined" style={{ 
                fontSize: '16px', 
                color: order.paymentStatus === 'Paid' ? '#10b981' : order.paymentStatus === 'Partial' ? '#06b6d4' : '#f59e0b' 
              }}>paid</span>
            </div>
            <div className={styles.kpiValue} style={{ 
              fontSize: '16px', 
              color: order.paymentStatus === 'Paid' ? '#10b981' : order.paymentStatus === 'Partial' ? '#06b6d4' : '#f59e0b' 
            }}>
              {order.paymentStatus || 'Unpaid'}
            </div>
          </div>

          {/* Card 4: Shipment Status */}
          <div className={styles.kpiCard} style={{ borderLeft: `4px solid ${getShipmentColor(order.status)}` }}>
            <div className={styles.kpiLabel}>
              <span>Shipment Status</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: getShipmentColor(order.status) }}>local_shipping</span>
            </div>
            <div>
              <select 
                value={order.status || 'DRAFT'}
                onChange={(e) => handleShipmentStatusChange(e.target.value)}
                className={styles.shipmentSelect}
                style={{
                  color: getShipmentColor(order.status)
                }}
              >
                <option value="DRAFT" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Pending</option>
                <option value="OPEN" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Open / Processing</option>
                <option value="APPROVED" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Approved for Delivery</option>
                <option value="PARTIALLY_DELIVERED" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Partially Delivered</option>
                <option value="DELIVERED" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Delivered</option>
                <option value="CANCELLED" style={{ background: 'var(--surface-main)', color: 'var(--text-main)' }}>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation (0px Radius, Emerald Green Active) */}
        <div className={styles.tabsContainer}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabItem} ${activeTab === tab.id ? styles.tabActive : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewLayout}>
              <SalesOrderItems items={
                order.items || (order.lines ? order.lines.map((line: any) => ({
                  id: line.id,
                  description: line.remarks || line.product?.name || '',
                  quantity: Number(line.quantity),
                  unitPrice: Number(line.unitPrice),
                  discount: Number(line.discountAmount) || 0,
                  total: Number(line.lineTotal) || 0
                })) : [])
              } readOnly={true} />
              
              <div className={styles.totalsWrapper}>
                <div className={styles.totalsCard}>
                  <QuotationTotals 
                    subtotal={order.subtotal || 0} 
                    totalDiscount={order.discountAmount || 0} 
                    totalTax={order.taxAmount || 0} 
                    grandTotal={order.grandTotal || order.totalAmount || 0} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className={styles.contentCard}>
              <SalesOrderPayments order={order} onRefresh={() => { fetch(`/api/crm/sales-orders/${params.id}`).then(res => res.json()).then(data => { setOrder(data.order || data); }); }} />
            </div>
          )}

          {activeTab === 'shipments' && (
            <div className={styles.contentCard}>
              <SalesOrderShipment order={order} onRefresh={() => { fetch(`/api/crm/sales-orders/${params.id}`).then(res => res.json()).then(data => { setOrder(data.order || data); }); }} />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>timeline</span>
                Fulfillment Timeline
              </div>
              <SalesOrderTimeline />
            </div>
          )}

          {activeTab === 'history' && (
            <div className={styles.contentCard}>
              <div className={styles.contentCardHeader}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>history</span>
                Audit Logs
              </div>
              <SalesOrderHistory history={order.history} />
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
}
