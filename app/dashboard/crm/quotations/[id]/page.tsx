"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QuotationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    const res = await fetch(`/api/crm/quotations/${params.id}`);
    if (res.ok) setQuotation(await res.json());
    setLoading(false);
  };

  const handleStatusChange = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this quotation?`)) return;
    const res = await fetch(`/api/crm/quotations/${params.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (res.ok) {
      fetchData();
      if (action === "DUPLICATE") {
        const data = await res.json();
        router.push(`/dashboard/crm/quotations/${data.id}/edit`);
      }
    } else {
      const err = await res.json();
      alert(err.error || "Failed to update quotation");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!quotation || quotation.error) return <div className="p-6">Quotation not found.</div>;

  let remarksData: any = {};
  try {
    remarksData = quotation.remarks ? JSON.parse(quotation.remarks) : {};
  } catch(e) {
    remarksData = { customerNotes: quotation.remarks };
  }

  const printDocument = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Action Bar - Hidden during print */}
      <div className="flex justify-between items-start bg-white p-6 rounded shadow no-print">
        <div>
          <h1 className="text-2xl font-bold">Quotation {quotation.quotationNumber}</h1>
          <p className="text-gray-500">Rev: {remarksData.revisionNumber || 1} • {quotation.customer?.name}</p>
          <div className="mt-2 flex space-x-2">
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-semibold">{quotation.status}</span>
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="space-x-2">
            <button onClick={printDocument} className="px-4 py-2 bg-gray-100 border text-gray-800 rounded text-sm hover:bg-gray-200">
              Print / PDF
            </button>
            <button onClick={() => handleStatusChange("DUPLICATE")} className="px-4 py-2 bg-gray-100 border text-gray-800 rounded text-sm hover:bg-gray-200">
              Duplicate
            </button>
            {(quotation.status === 'DRAFT' || quotation.status === 'PENDING_APPROVAL') && (
              <Link href={`/dashboard/crm/quotations/${params.id}/edit`} className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm inline-block">
                Edit Draft
              </Link>
            )}
            <Link href="/dashboard/crm/quotations" className="px-4 py-2 bg-gray-200 text-gray-800 rounded text-sm inline-block">
              Back to List
            </Link>
          </div>
          <p className="text-xl font-bold mt-4">{quotation.currency} {Number(quotation.totalAmount).toLocaleString()}</p>
        </div>
      </div>

      {/* State Machine Bar - Hidden during print */}
      <div className="bg-white p-4 rounded shadow flex space-x-4 no-print overflow-x-auto">
        {quotation.status === 'DRAFT' && (
          <button onClick={() => handleStatusChange("APPROVE")} className="px-4 py-2 bg-yellow-500 text-white rounded font-medium whitespace-nowrap">Submit for Approval</button>
        )}
        {quotation.status === 'PENDING_APPROVAL' && (
          <>
            <button onClick={() => handleStatusChange("APPROVE")} className="px-4 py-2 bg-blue-600 text-white rounded font-medium whitespace-nowrap">Approve</button>
            <button onClick={() => handleStatusChange("REJECT")} className="px-4 py-2 bg-red-600 text-white rounded font-medium whitespace-nowrap">Reject</button>
          </>
        )}
        {quotation.status === 'APPROVED' && (
          <button onClick={() => handleStatusChange("SEND")} className="px-4 py-2 bg-indigo-600 text-white rounded font-medium whitespace-nowrap">Send to Customer (Email)</button>
        )}
        {quotation.status === 'SENT' && (
          <>
            <button onClick={() => handleStatusChange("ACCEPT")} className="px-4 py-2 bg-green-600 text-white rounded font-medium whitespace-nowrap">Customer Accepted</button>
            <button onClick={() => handleStatusChange("REJECT")} className="px-4 py-2 bg-red-600 text-white rounded font-medium whitespace-nowrap">Customer Rejected</button>
            <button onClick={() => handleStatusChange("EXPIRE")} className="px-4 py-2 bg-gray-600 text-white rounded font-medium whitespace-nowrap">Mark Expired</button>
          </>
        )}
        {quotation.status === 'ACCEPTED' && (
          <button onClick={() => handleStatusChange("CONVERT")} className="px-4 py-2 bg-purple-600 text-white rounded font-medium whitespace-nowrap">Convert to Sales Order</button>
        )}
      </div>

      {/* Printable Area */}
      <div id="printable-area" className="bg-white p-10 rounded shadow min-h-[800px]">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-widest">Quotation</h1>
            <p className="text-gray-500 mt-1">Ref: {quotation.quotationNumber}</p>
            <p className="text-gray-500">Rev: {remarksData.revisionNumber || 1}</p>
          </div>
          <div className="text-right">
            {/* Future Logo Placeholder */}
            <div className="h-16 w-48 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-2 ml-auto">Company Logo</div>
            <p className="font-bold">Your Company Ltd.</p>
            <p className="text-sm text-gray-500">123 Business Road, Tech City</p>
            <p className="text-sm text-gray-500">contact@company.com</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Prepared For</h3>
            <p className="font-bold text-lg">{quotation.customer?.name}</p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Prepared By:</strong> {quotation.createdBy?.firstName} {quotation.createdBy?.lastName}<br />
              <strong>Quotation Date:</strong> {new Date(quotation.quotationDate).toLocaleDateString()}<br />
              <strong>Valid Until:</strong> {new Date(quotation.expiryDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            {/* Future QR Code Placeholder */}
            <div className="h-24 w-24 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 ml-auto mb-2 text-xs">QR Code</div>
            <p className="text-sm font-semibold text-blue-600">Scan to Verify</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-8">
          <thead className="border-b-2 border-gray-800 text-sm">
            <tr>
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center w-24">Qty</th>
              <th className="py-2 text-right w-32">Unit Price</th>
              <th className="py-2 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {quotation.lines?.map((line: any) => (
              <tr key={line.id} className="border-b border-gray-200">
                <td className="py-3">
                  <p className="font-bold">{line.product?.name}</p>
                  {line.description && <p className="text-gray-500 text-xs mt-1">{line.description}</p>}
                </td>
                <td className="py-3 text-center">{Number(line.quantity)}</td>
                <td className="py-3 text-right">{Number(line.unitPrice).toLocaleString()}</td>
                <td className="py-3 text-right font-medium">{Number(line.lineTotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-10">
          <div className="w-1/3">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{Number(quotation.subtotal).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
            {Number(quotation.discountAmount) > 0 && (
              <div className="flex justify-between py-1 text-sm text-red-600">
                <span>Discount</span>
                <span>-{Number(quotation.discountAmount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">Tax</span>
              <span>{Number(quotation.taxAmount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
            {Number(quotation.shippingAmount) > 0 && (
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>{Number(quotation.shippingAmount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-2 font-bold text-lg">
              <span>Total ({quotation.currency})</span>
              <span>{Number(quotation.totalAmount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
            </div>
          </div>
        </div>

        {/* Terms and Notes */}
        <div className="text-sm text-gray-700 space-y-4 mb-16">
          {remarksData.customerNotes && (
            <div>
              <p className="font-bold mb-1">Notes:</p>
              <p className="whitespace-pre-wrap text-gray-600">{remarksData.customerNotes}</p>
            </div>
          )}
          {remarksData.paymentTerms && (
            <div>
              <p className="font-bold mb-1">Payment Terms:</p>
              <p className="whitespace-pre-wrap text-gray-600">{remarksData.paymentTerms}</p>
            </div>
          )}
          {remarksData.deliveryTerms && (
            <div>
              <p className="font-bold mb-1">Delivery Terms:</p>
              <p className="whitespace-pre-wrap text-gray-600">{remarksData.deliveryTerms}</p>
            </div>
          )}
          {remarksData.shippingTerms && (
            <div>
              <p className="font-bold mb-1">Shipping Terms:</p>
              <p className="whitespace-pre-wrap text-gray-600">{remarksData.shippingTerms}</p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="flex justify-between pt-16">
          <div className="w-1/3 border-t border-gray-400 text-center pt-2 text-sm">
            <p className="font-bold">Prepared By</p>
            <p className="text-gray-500">{quotation.createdBy?.firstName} {quotation.createdBy?.lastName}</p>
          </div>
          <div className="w-1/3 border-t border-gray-400 text-center pt-2 text-sm">
            <p className="font-bold">Accepted By</p>
            <p className="text-gray-500">Customer Signature & Date</p>
          </div>
        </div>
      </div>

      {/* Internal Notes & History - Hidden during print */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        {remarksData.internalNotes && (
          <div className="bg-yellow-50 p-6 rounded shadow border border-yellow-200">
            <h2 className="text-lg font-bold mb-2 text-yellow-800">Internal Notes (Hidden from PDF)</h2>
            <p className="whitespace-pre-wrap text-sm text-yellow-900">{remarksData.internalNotes}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Revision & Audit History</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {quotation.history?.map((log: any) => (
              <div key={log.id} className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                <p className="text-sm font-medium">{log.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
