import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add Headers
  csvRows.push(headers.join(","));

  // Add Data
  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header] === null || row[header] === undefined ? "" : row[header];
      // Escape strings containing comma, newline, or double quotes
      if (typeof value === "string") {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export");
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPDF(
  title: string,
  columns: string[],
  data: any[],
  filename: string,
  companyName: string = "Sarah Calcium Industries"
) {
  if (!data || data.length === 0) {
    alert("No data available to export");
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Custom Header
  const dateStr = new Date().toLocaleString();
  
  // Format Data for autotable
  const body = data.map(row => columns.map(col => String(row[col] ?? "")));

  autoTable(doc, {
    head: [columns],
    body: body,
    startY: 35, // Space for header
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185], // A nice blue header
      textColor: 255,
      halign: 'center',
    },
    didDrawPage: function (data) {
      // Header
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text(companyName, pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(title, pageWidth / 2, 22, { align: 'center' });
      
      doc.setFontSize(9);
      doc.text(`Generated: ${dateStr}`, pageWidth / 2, 28, { align: 'center' });

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : doc.internal.pages.length - 1;
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  });

  doc.save(`${filename}.pdf`);
}
