// exports/workbook: authoritative source; see docs/module-map.md.


// @legacy-unit 1855 24790
export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
// @end-legacy-unit 1855

// @legacy-unit 1856 24795
export function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
// @end-legacy-unit 1856

// @legacy-unit 1857 24807
export function downloadCsv(fileName, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
  downloadFile(fileName, csv, "text/csv;charset=utf-8");
}
// @end-legacy-unit 1857

// @legacy-unit 1858 24812
export function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
// @end-legacy-unit 1858

// @legacy-unit 1859 24823
export function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
// @end-legacy-unit 1859

// @legacy-unit 1860 24831
export function columnName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}
// @end-legacy-unit 1860

// @legacy-unit 1861 24842
export function sheetCellXml(value, rowIndex, columnIndex) {
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
  const styleId = rowIndex <= 1 ? 2 : 1;
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
  return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}
// @end-legacy-unit 1861

// @legacy-unit 1862 24849
export function measuredCellWidth(value) {
  const text = String(value ?? "");
  const longestLine = text.split(/\n/).reduce((max, line) => Math.max(max, line.length), 0);
  const wideChars = [...text].filter((char) => char.charCodeAt(0) > 255).length;
  return longestLine + Math.ceil(wideChars * 0.8) + 2;
}
// @end-legacy-unit 1862

// @legacy-unit 1863 24856
export function autoFitWidths(rows, options = {}) {
  const maxColumns = Math.max(...rows.map((row) => row.length), 1);
  const min = options.minWidth || 8;
  const max = options.maxWidth || 36;
  const preferred = options.preferred || {};
  return Array.from({ length: maxColumns }, (_, columnIndex) => {
    const measured = Math.max(...rows.map((row) => measuredCellWidth(row[columnIndex])));
    const preferredWidth = preferred[columnIndex] || 0;
    return Math.min(Math.max(measured, preferredWidth, min), max);
  });
}
// @end-legacy-unit 1863

// @legacy-unit 1864 24868
export function worksheetXml(rows, options = {}) {
  const maxColumns = Math.max(...rows.map((row) => row.length), 1);
  const dimensions = `A1:${columnName(maxColumns - 1)}${Math.max(rows.length, 1)}`;
  const widths = options.autoFit !== false ? autoFitWidths(rows, options) : (options.widths || rows[0]?.map((_, index) => index < 4 ? 18 : 16) || [16]);
  const rowHeights = options.rowHeights || [];
  const mergeRanges = options.merges || [];
  const freezeHeader = options.freezeHeader !== false;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimensions}"/>
  ${freezeHeader ? `<sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>` : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`}
  <cols>${Array.from({ length: maxColumns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${widths[index] || 16}" customWidth="1"/>`).join("")}</cols>
  <sheetData>
    ${rows.map((row, rowIndex) => {
      const height = rowHeights[rowIndex];
      const attrs = height ? ` r="${rowIndex + 1}" ht="${height}" customHeight="1"` : ` r="${rowIndex + 1}"`;
      return `<row${attrs}>${row.map((cell, columnIndex) => sheetCellXml(cell, rowIndex, columnIndex)).join("")}</row>`;
    }).join("")}
  </sheetData>
  ${mergeRanges.length ? `<mergeCells count="${mergeRanges.length}">${mergeRanges.map((range) => `<mergeCell ref="${range}"/>`).join("")}</mergeCells>` : ""}
</worksheet>`;
}
// @end-legacy-unit 1864

// @legacy-unit 1865 24895
export function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
// @end-legacy-unit 1865

// @legacy-unit 1866 24904
export function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}
// @end-legacy-unit 1866

// @legacy-unit 1867 24910
export function writeUint16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}
// @end-legacy-unit 1867

// @legacy-unit 1868 24915
export function writeUint32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}
// @end-legacy-unit 1868

// @legacy-unit 1869 24922
export function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}
// @end-legacy-unit 1869

// @legacy-unit 1870 24933
export function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const { time, date } = dosDateTime();
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, time);
    writeUint16(localHeader, 12, date);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, time);
    writeUint16(centralHeader, 14, date);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralDirectory.length);
  writeUint32(end, 16, offset);
  writeUint16(end, 20, 0);
  return concatBytes([...localParts, centralDirectory, end]);
}
// @end-legacy-unit 1870

// @legacy-unit 1871 24994
export function safeSheetName(name, index = 1) {
  return xmlEscape(String(name || `Sheet${index}`).replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || `Sheet${index}`);
}
// @end-legacy-unit 1871

// @legacy-unit 1872 24998
export function createXlsxBlob(rowsOrSheets, sheetName = "OM Purchasing Export") {
  const sheets = Array.isArray(rowsOrSheets?.[0]?.rows)
    ? rowsOrSheets
    : [{ name: sheetName, rows: rowsOrSheets, freezeHeader: true }];
  const sheetOverrides = sheets.map((_, index) => `
  <Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const workbookSheets = sheets.map((sheet, index) => `<sheet name="${safeSheetName(sheet.name, index + 1)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  const workbookRels = sheets.map((_, index) => `
  <Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const styleRelId = sheets.length + 1;
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rId${styleRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="2"><border/><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`,
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet.rows || [[]], sheet),
    })),
  ];
  return new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
// @end-legacy-unit 1872

// @legacy-unit 1873 25064
export function downloadXlsx(fileName, rowsOrSheets, sheetName) {
  downloadBlob(fileName, createXlsxBlob(rowsOrSheets, sheetName));
}
// @end-legacy-unit 1873
