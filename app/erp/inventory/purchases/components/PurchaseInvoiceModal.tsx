"use client";

import React, { useState } from "react";
import { Printer, X, FileText, ExternalLink } from "lucide-react";
import styles from "./PurchaseInvoiceModal.module.css";

interface PurchaseInvoiceModalProps {
  purchase: any | null;
  isOpen: boolean;
  onClose: () => void;
}

function numberToWordsBDT(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "Zero Taka Only";
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    let str = "";
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += "-" + a[n % 10].trim() + " ";
        else str += " ";
      }
    }
    return str;
  }

  const integerPart = Math.floor(num);
  const words = inWords(integerPart).trim();
  return `BDT ${words} Only`;
}

export default function PurchaseInvoiceModal({ purchase, isOpen, onClose }: PurchaseInvoiceModalProps) {
  const [activeTheme, setActiveTheme] = useState<"Blue" | "Emerald" | "Indigo" | "Amber" | "Slate">("Blue");

  if (!isOpen || !purchase) return null;

  const poNumber = purchase.purchaseOrderNumber || purchase.id?.substring(0, 8);
  const orderDate = purchase.orderDate || purchase.createdAt;
  const supplier = purchase.supplier || {};
  const company = purchase.company || { name: "SHOHOJ LEDGER ERP" };

  const subtotal = Number(
    purchase.subtotal ||
      purchase.lines?.reduce((s: number, l: any) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0) ||
      purchase.totalAmount ||
      0
  );
  const discount = Number(purchase.discountAmount || 0);
  const shipping = Number(purchase.shippingAmount || 0);
  const totalAmount = Number(purchase.totalAmount || (subtotal - discount + shipping) || 0);

  const lines = purchase.lines || [];

  // Bulletproof isolated document print handler
  const handlePrint = () => {
    const sheetEl = document.getElementById("print-invoice-sheet");
    if (!sheetEl) {
      window.print();
      return;
    }

    // Create a temporary hidden iframe to isolate the exact invoice sheet from background UI
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) return;

    // Collect loaded stylesheet links & styles
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join("\n");

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Purchase Order - ${poNumber}</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #print-invoice-sheet {
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body>
          ${sheetEl.outerHTML}
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1500);
    }, 300);
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modalCard}>
        {/* Modal Toolbar (not printed) */}
        <div className={styles.modalToolbar}>
          <div className={styles.titleArea}>
            <div className={styles.titleIcon}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className={styles.titleText}>Official Purchase Invoice</h2>
              <div className={styles.poCode}>{poNumber}</div>
            </div>
          </div>

          <div className={styles.toolbarActions}>
            {/* Theme Selector */}
            <div className={styles.themeSelector} title="Change Invoice Accent Theme">
              <span className={styles.themeLabel}>Theme:</span>
              <div
                className={`${styles.themeDot} ${activeTheme === "Blue" ? styles.themeDotActive : ""}`}
                style={{ background: "#2563eb" }}
                onClick={() => setActiveTheme("Blue")}
                title="Corporate Blue"
              />
              <div
                className={`${styles.themeDot} ${activeTheme === "Emerald" ? styles.themeDotActive : ""}`}
                style={{ background: "#059669" }}
                onClick={() => setActiveTheme("Emerald")}
                title="Modern Emerald"
              />
              <div
                className={`${styles.themeDot} ${activeTheme === "Indigo" ? styles.themeDotActive : ""}`}
                style={{ background: "#6366f1" }}
                onClick={() => setActiveTheme("Indigo")}
                title="Indigo Velvet"
              />
              <div
                className={`${styles.themeDot} ${activeTheme === "Amber" ? styles.themeDotActive : ""}`}
                style={{ background: "#d97706" }}
                onClick={() => setActiveTheme("Amber")}
                title="Executive Amber"
              />
            </div>

            <button
              onClick={handlePrint}
              className={styles.btnPrint}
              title="Print standard A4 invoice"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className={styles.btnClose}
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Invoice Canvas (Pure White A4 Document) */}
        <div
          id="print-invoice-sheet"
          className={`${styles.invoiceSheet} ${
            activeTheme === "Emerald"
              ? styles.themeEmerald
              : activeTheme === "Indigo"
              ? styles.themeIndigo
              : activeTheme === "Amber"
              ? styles.themeAmber
              : activeTheme === "Slate"
              ? styles.themeSlate
              : styles.themeBlue
          }`}
        >
          {/* Document Header */}
          <div className={styles.docHeader}>
            <div className={styles.docCompanyLogoArea}>
              <div className={styles.docLogoIcon}>SL</div>
              <div>
                <div className={styles.docCompanyName}>{company.name || "SHOHOJ LEDGER ERP"}</div>
                <div className={styles.docCompanyMeta}>
                  Enterprise Procurement & Supply Chain, Dhaka<br />
                  BIN: 009283719-0101
                </div>
              </div>
            </div>

            <div className={styles.docTypeArea}>
              <div className={styles.docTypeTitle}>PURCHASE ORDER</div>
              <div className={styles.docPoNumber}>{poNumber}</div>
              <div className={styles.docStatusBadge}>
                <span>●</span> {purchase.status || "APPROVED"}
              </div>
            </div>
          </div>

          {/* Vendor & Order Specs Grid */}
          <div className={styles.docInfoGrid}>
            {/* Vendor / Supplier */}
            <div className={styles.docInfoBox}>
              <div className={styles.docInfoBoxTitle}>VENDOR / SUPPLIER</div>
              <div className={styles.docVendorName}>{supplier.name || "General Supplier"}</div>
              {supplier.contactPerson && (
                <div className={styles.docMetaRow}>
                  <span>Attn:</span>
                  <strong>{supplier.contactPerson}</strong>
                </div>
              )}
              {supplier.phone && (
                <div className={styles.docMetaRow}>
                  <span>Phone:</span>
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className={styles.docMetaRow}>
                  <span>Email:</span>
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className={styles.docMetaRow}>
                  <span>Address:</span>
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>

            {/* Order Specs */}
            <div className={styles.docInfoBox}>
              <div className={styles.docInfoBoxTitle}>ORDER SPECIFICATIONS</div>
              <div className={styles.docMetaRow}>
                <span>PO Date:</span>
                <strong>{new Date(orderDate).toLocaleDateString()}</strong>
              </div>
              {purchase.remarks && (
                <div className={styles.docMetaRow}>
                  <span>Reference / Notes:</span>
                  <strong>{purchase.remarks}</strong>
                </div>
              )}
              <div className={styles.docMetaRow}>
                <span>Payment Terms:</span>
                <strong>{purchase.paymentTerms || "Net 30 Days"}</strong>
              </div>
              <div className={styles.docMetaRow}>
                <span>Destination:</span>
                <strong>Main Warehouse</strong>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className={styles.docTable}>
            <thead>
              <tr>
                <th style={{ width: "8%" }} className={styles.textCenter}>#</th>
                <th style={{ width: "44%" }}>Item Description</th>
                <th style={{ width: "14%" }} className={styles.textCenter}>Qty</th>
                <th style={{ width: "16%" }} className={styles.textRight}>Unit Price (৳)</th>
                <th style={{ width: "18%" }} className={styles.textRight}>Line Total (৳)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any, i: number) => {
                const pName = line.product?.name || line.remarks || "Item Product";
                const pCode = line.product?.productCode || line.product?.sku || "";
                const pUnit = line.product?.unit || "pcs";
                const lTotal = Number(line.lineTotal || Number(line.quantity) * Number(line.unitPrice));

                return (
                  <tr key={line.id || i}>
                    <td className={styles.textCenter} style={{ color: "#94a3b8", fontWeight: 600 }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td>
                      <div className={styles.docItemTitle}>{pName}</div>
                      {pCode && <div className={styles.docItemCode}>Code: {pCode}</div>}
                    </td>
                    <td className={styles.textCenter}>
                      <strong>{Number(line.quantity)}</strong> {pUnit}
                    </td>
                    <td className={styles.textRight} style={{ fontFamily: "monospace" }}>
                      ৳{Number(line.unitPrice).toLocaleString()}
                    </td>
                    <td className={styles.textRight} style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      ৳{lTotal.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* In Words & Financial Breakdown */}
          <div className={styles.docBottomGrid}>
            <div>
              <div className={styles.inWordsBox}>
                <div className={styles.inWordsLabel}>Total Amount in Words:</div>
                <div className={styles.inWordsText}>{numberToWordsBDT(totalAmount)}</div>
              </div>

              <div style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.5, marginTop: "6px" }}>
                <strong style={{ color: "#0f172a" }}>Terms & Conditions:</strong><br />
                1. Goods received subject to quality inspection upon delivery.<br />
                2. Payment disbursed as per approved procurement terms.
              </div>
            </div>

            <div>
              <table className={styles.docTotalsTable}>
                <tbody>
                  <tr>
                    <td>Subtotal:</td>
                    <td className={styles.textRight} style={{ fontFamily: "monospace", fontWeight: 600 }}>
                      ৳{subtotal.toLocaleString()}
                    </td>
                  </tr>
                  {discount > 0 && (
                    <tr>
                      <td style={{ color: "#ef4444" }}>Discount:</td>
                      <td className={styles.textRight} style={{ fontFamily: "monospace", color: "#ef4444", fontWeight: 700 }}>
                        -৳{discount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {shipping > 0 && (
                    <tr>
                      <td>Shipping / Freight:</td>
                      <td className={styles.textRight} style={{ fontFamily: "monospace" }}>
                        +৳{shipping.toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr className={styles.docGrandTotalRow}>
                    <td>TOTAL DUE:</td>
                    <td className={styles.textRight} style={{ fontFamily: "monospace" }}>
                      ৳{totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div>
            <div className={styles.docSignatures}>
              <div className={styles.signBlock}>
                <div className={styles.signLine}>Procurement Mgr</div>
                <div className={styles.signLabel}>Prepared By</div>
                <div className={styles.signSub}>Shohoj Ledger Purchasing</div>
              </div>

              <div className={styles.signBlock}>
                <div className={styles.signLine} style={{ color: "var(--inv-accent, #2563eb)" }}>
                  Verified & Stamp
                </div>
                <div className={styles.signLabel}>Authorized Signatory</div>
                <div className={styles.signSub}>Financial Controller</div>
              </div>
            </div>

            <div className={styles.docFooterNote}>
              Generated electronically by Shohoj Ledger ERP. Recognized as an official procurement commitment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
