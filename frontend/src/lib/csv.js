import Papa from 'papaparse';

/**
 * Export an array of rows to a downloaded CSV file.
 *
 * @param {string} filename  - file name (with or without .csv)
 * @param {Array}  columns   - Table column defs ({ key, header, accessor?, exportAccessor? })
 * @param {Array}  rows      - data rows
 */
export function exportTableToCsv(filename, columns, rows) {
  const cols = columns.filter((c) => c.key !== 'actions' && c.exportable !== false);
  const data = rows.map((row) => {
    const out = {};
    for (const col of cols) {
      const get = col.exportAccessor || col.accessor || ((r) => r[col.key]);
      let value = get(row);
      if (value == null) value = '';
      out[col.header || col.key] = typeof value === 'object' ? '' : value;
    }
    return out;
  });
  const csv = Papa.unparse(data);
  download(filename.endsWith('.csv') ? filename : `${filename}.csv`, csv);
}

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
