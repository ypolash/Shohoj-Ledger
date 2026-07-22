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
