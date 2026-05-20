import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import Input from './Input.jsx';
import Button from './Button.jsx';
import { cn } from '@/lib/cn.js';
import { exportTableToCsv } from '@/lib/csv.js';

/**
 * Responsive table — a real <table> on desktop, stacked cards on mobile.
 *
 * Props:
 *   columns:    [{ key, header, render?, sortable?, accessor?, exportAccessor? }]
 *   data:       array of rows
 *   pageSize:   number (default 10)
 *   searchKeys: array of row keys to search across (default: all string fields)
 *   empty:      ReactNode shown when filtered data is empty
 *   exportName: when set, shows an "Export CSV" button using this file name
 */
function cellValue(col, row) {
  if (col.render) return col.render(row);
  if (col.accessor) return col.accessor(row);
  return row[col.key];
}

export function Table({
  columns,
  data = [],
  pageSize = 10,
  searchKeys,
  empty,
  className,
  exportName,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  const searched = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) => {
      const keys = searchKeys || Object.keys(row);
      return keys.some((k) => {
        const v = row[k];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return searched;
    const col = columns.find((c) => c.key === sort.key);
    const accessor = col?.accessor || ((r) => r[sort.key]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...searched].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [searched, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function toggleSort(key) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  }

  // Columns split for the mobile card layout.
  const actionCol = columns.find((c) => !c.header);
  const dataCols = columns.filter((c) => c.header);

  const emptyNode = empty || (
    <div className="text-center text-sm text-muted-foreground">No rows.</div>
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="text-xs text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? 'row' : 'rows'}
          </div>
          {exportName && sorted.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTableToCsv(exportName, columns, sorted)}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop / tablet — real table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-3 text-left font-medium',
                      col.headerClassName
                    )}
                  >
                    {col.header && col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {col.header}
                        {sort.key === col.key &&
                          (sort.dir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12">
                    {emptyNode}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={row.id || row._id || i}
                    className="transition-colors hover:bg-muted/30"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'whitespace-nowrap px-4 py-3 text-foreground',
                          col.cellClassName
                        )}
                      >
                        {cellValue(col, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile — stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {pageRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8">
            {emptyNode}
          </div>
        ) : (
          pageRows.map((row, i) => (
            <div
              key={row.id || row._id || i}
              className="rounded-xl border border-border bg-card p-3.5 shadow-card"
            >
              <div className="divide-y divide-border/70">
                {dataCols.map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
                  >
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {col.header}
                    </span>
                    <span className="min-w-0 text-right text-sm text-foreground">
                      {cellValue(col, row)}
                    </span>
                  </div>
                ))}
              </div>
              {actionCol && (
                <div className="mt-2 flex justify-end border-t border-border pt-2">
                  {cellValue(actionCol, row)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Page {safePage} of {totalPages}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
