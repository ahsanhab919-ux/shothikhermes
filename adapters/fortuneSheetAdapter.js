export function extractHeaders(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return [];
  const seen = new Set();
  const headers = [];
  rows.forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key !== "id" && key !== "_index" && !seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    });
  });
  return headers;
}

function formatHeader(key) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

export function rowsToFortuneSheet(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return { sheetData: [{ name: "Sheet1", celldata: [], row: 1, column: 1 }], headers: [], rowIdMap: {} };
  }

  const headers = extractHeaders(rows);
  const celldata = [];
  const rowIdMap = {};

  headers.forEach((header, c) => {
    celldata.push({
      r: 0,
      c,
      v: {
        v: formatHeader(header),
        m: formatHeader(header),
        ct: { fa: "General", t: "g" },
        bl: 1,
        fc: "#374151",
      },
    });
  });

  rows.forEach((row, rowIdx) => {
    const gridRow = rowIdx + 1;
    rowIdMap[gridRow] = row.id !== undefined ? row.id : `row-${rowIdx}`;

    headers.forEach((header, c) => {
      const raw = row[header];
      if (raw === undefined || raw === null || raw === "") return;

      const isNum = typeof raw === "number" || (typeof raw === "string" && !isNaN(Number(raw)) && raw.trim() !== "");
      const v = isNum ? Number(raw) : String(raw);

      celldata.push({
        r: gridRow,
        c,
        v: {
          v,
          m: String(raw),
          ct: { fa: "General", t: isNum ? "n" : "g" },
        },
      });
    });
  });

  const totalRows = rows.length + 1;
  const totalCols = headers.length;

  const columnWidths = headers.map((header) => {
    let maxLen = formatHeader(header).length;
    rows.forEach((row) => {
      const val = row[header];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return Math.max(80, Math.min(300, maxLen * 9 + 20));
  });

  const config = {
    columnlen: {},
    rowlen: { 0: 36 },
  };
  columnWidths.forEach((w, i) => {
    config.columnlen[i] = w;
  });

  return {
    sheetData: [
      {
        name: "Sheet1",
        celldata,
        row: Math.max(totalRows + 20, 50),
        column: Math.max(totalCols + 5, 26),
        config,
      },
    ],
    headers,
    rowIdMap,
  };
}

function celldataTo2D(celldata) {
  if (!celldata || !Array.isArray(celldata) || celldata.length === 0) return [];
  let maxR = 0;
  let maxC = 0;
  celldata.forEach((cell) => {
    if (cell.r > maxR) maxR = cell.r;
    if (cell.c > maxC) maxC = cell.c;
  });

  const grid = [];
  for (let r = 0; r <= maxR; r++) {
    grid.push(new Array(maxC + 1).fill(null));
  }

  celldata.forEach((cell) => {
    grid[cell.r][cell.c] = cell.v || null;
  });

  return grid;
}

function get2DGrid(sheet) {
  if (sheet.data && Array.isArray(sheet.data) && sheet.data.length > 0) {
    return sheet.data;
  }
  if (sheet.celldata && Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
    return celldataTo2D(sheet.celldata);
  }
  return [];
}

function getCellValue(cell) {
  if (!cell) return "";
  if (typeof cell === "object") {
    return cell.v !== undefined && cell.v !== null ? cell.v : (cell.m !== undefined ? cell.m : "");
  }
  return cell;
}

export function fortuneSheetToRows(sheetData, originalHeaders, rowIdMap) {
  if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
    return [];
  }

  const sheet = sheetData[0];
  if (!sheet) return [];

  const grid = get2DGrid(sheet);
  if (grid.length === 0) return [];

  const numCols = originalHeaders ? originalHeaders.length : 0;

  let detectedCols = numCols;
  if (detectedCols === 0 && grid[0]) {
    detectedCols = Array.isArray(grid[0]) ? grid[0].length : 0;
    for (let c = detectedCols - 1; c >= 0; c--) {
      const val = getCellValue(grid[0][c]);
      if (val !== "" && val !== null && val !== undefined) {
        detectedCols = c + 1;
        break;
      }
    }
  }

  let keyHeaders;
  if (originalHeaders && originalHeaders.length > 0) {
    keyHeaders = [...originalHeaders];
  } else {
    keyHeaders = [];
    if (grid[0]) {
      for (let c = 0; c < detectedCols; c++) {
        const val = getCellValue(grid[0][c]);
        const headerStr = String(val || `column_${c}`);
        keyHeaders.push(headerStr.toLowerCase().replace(/\s+/g, "_"));
      }
    }
  }

  const rows = [];
  for (let r = 1; r < grid.length; r++) {
    const rowData = grid[r];
    if (!rowData || !Array.isArray(rowData)) continue;

    let hasContent = false;
    for (let c = 0; c < keyHeaders.length; c++) {
      const val = getCellValue(rowData[c]);
      if (val !== "" && val !== null && val !== undefined) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) continue;

    const rowObj = {};
    keyHeaders.forEach((key, c) => {
      const val = getCellValue(rowData[c]);
      rowObj[key] = val !== null && val !== undefined ? val : "";
    });
    rowObj.id = (rowIdMap && rowIdMap[r]) ? rowIdMap[r] : `row-${r - 1}`;
    rows.push(rowObj);
  }

  return rows;
}

export function rowsToExportData(rows, originalHeaders) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

  const headers = originalHeaders || extractHeaders(rows);
  const displayHeaders = headers.map(formatHeader);

  const dataRows = rows.map((row) =>
    headers.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return "";
      return val;
    })
  );

  return { headers: displayHeaders, dataRows, rawHeaders: headers };
}

export function exportToCSV(rows, originalHeaders, filename) {
  const exportData = rowsToExportData(rows, originalHeaders);
  if (!exportData) return false;

  const { headers, dataRows } = exportData;
  const csvHeaders = headers.map((h) => `"${h}"`).join(",");
  const csvRows = dataRows.map((row) =>
    row.map((val) => {
      if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
      return `"${val}"`;
    }).join(",")
  );

  const csvContent = [csvHeaders, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename || `sheet-data-${new Date().toISOString().split("T")[0]}.csv`);
  return true;
}

export async function exportToXLSX(rows, originalHeaders, filename) {
  const exportData = rowsToExportData(rows, originalHeaders);
  if (!exportData) return false;

  const XLSX = await import("xlsx");
  const { headers, dataRows } = exportData;
  const wsData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...dataRows.map((row) => String(row[i] || "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet Data");
  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, filename || `sheet-data-${new Date().toISOString().split("T")[0]}.xlsx`);
  return true;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
