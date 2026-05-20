import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Search, Film, Users, Loader2 } from 'lucide-react';
import Input from '@/components/ui/Input.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useListProjectsQuery } from '@/features/projects/projectsApi.js';
import { useListClientsQuery } from '@/features/clients/clientsApi.js';
import StatusBadge from '@/features/projects/StatusBadge.jsx';
import { cn } from '@/lib/cn.js';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const isStaff = user?.role === 'admin' || user?.role === 'manager';

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const active = open && query.trim().length >= 2;

  const { data: projData, isFetching: projLoading } = useListProjectsQuery(
    { search: query.trim(), limit: 6 },
    { skip: !active }
  );
  const { data: clientData, isFetching: clientLoading } = useListClientsQuery(
    { search: query.trim(), limit: 6 },
    { skip: !active || !isStaff }
  );

  const projects = active ? projData?.data?.items || [] : [];
  const clients = active && isStaff ? clientData?.data?.items || [] : [];
  const loading = projLoading || clientLoading;
  const empty = active && !loading && projects.length === 0 && clients.length === 0;

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function go(path) {
    setOpen(false);
    setQuery('');
    navigate(path);
  }

  return (
    <div ref={wrapRef} className="relative max-w-md flex-1">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search projects, clients…"
        className="pl-8"
        aria-label="Global search"
      />

      {active && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          {loading && (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {empty && (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              No matches for “{query.trim()}”.
            </div>
          )}
          {!loading && projects.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Projects
              </div>
              {projects.map((p) => (
                <button
                  type="button"
                  key={p._id}
                  onClick={() => go(`/projects/${p._id}`)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent'
                  )}
                >
                  <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{p.title}</span>
                  <StatusBadge status={p.status} />
                </button>
              ))}
            </div>
          )}
          {!loading && clients.length > 0 && (
            <div className="border-t border-border py-1">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Clients
              </div>
              {clients.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => go(`/clients/${c._id}`)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{c.name}</span>
                  {c.company && (
                    <span className="shrink-0 text-xs text-muted-foreground">{c.company}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
