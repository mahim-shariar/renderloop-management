import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, List } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { useCalendarEventsQuery } from '@/features/calendar/calendarApi.js';
import { cn } from '@/lib/cn.js';

const KIND_META = {
  project_deadline: { label: 'Deadline', color: '#8b5cf6' },
  payment_due: { label: 'Payment', color: '#10b981' },
  salary_payout: { label: 'Payout', color: '#f59e0b' },
  task: { label: 'Task', color: '#3b82f6' },
};
const kindOf = (k) => KIND_META[k] || { label: 'Event', color: '#6b7280' };

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayKey(d) {
  return format(d, 'yyyy-MM-dd');
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [view, setView] = useState('month'); // 'month' | 'agenda'

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });

  const { data, isLoading } = useCalendarEventsQuery({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
  });
  const events = useMemo(() => data?.data?.events || [], [data]);

  const byDay = useMemo(() => {
    const m = new Map();
    events.forEach((e) => {
      const k = dayKey(new Date(e.date));
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(e);
    });
    return m;
  }, [events]);

  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const selectedEvents = byDay.get(dayKey(selected)) || [];

  // Agenda — events grouped by day, chronological
  const agenda = useMemo(() => {
    const groups = [];
    const map = new Map();
    [...events]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((e) => {
        const k = dayKey(new Date(e.date));
        if (!map.has(k)) {
          const g = { key: k, date: new Date(e.date), items: [] };
          map.set(k, g);
          groups.push(g);
        }
        map.get(k).items.push(e);
      });
    return groups;
  }, [events]);

  function goToday() {
    const now = new Date();
    setCursor(now);
    setSelected(now);
  }

  function openEvent(e) {
    if (e.link) navigate(e.link);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Deadlines, payments, payouts and tasks at a glance.
          </p>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-border bg-card">
          <button
            type="button"
            onClick={() => setView('month')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" /> Month
          </button>
          <button
            type="button"
            onClick={() => setView('agenda')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
              view === 'agenda'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <List className="h-3.5 w-3.5" /> Agenda
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>
        <div className="text-lg font-semibold tracking-tight text-foreground">
          {format(cursor, 'MMMM yyyy')}
        </div>
        <div className="ml-auto flex flex-wrap gap-3">
          {Object.entries(KIND_META).map(([k, m]) => (
            <span key={k} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[520px] w-full" />
      ) : view === 'agenda' ? (
        <AgendaView agenda={agenda} onOpen={openEvent} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <MonthGrid
            days={days}
            cursor={cursor}
            byDay={byDay}
            selected={selected}
            onSelectDay={setSelected}
            onOpenEvent={openEvent}
          />
          <DayPanel date={selected} events={selectedEvents} onOpen={openEvent} />
        </div>
      )}
    </div>
  );
}

/* ---------------- Month grid ---------------- */

function MonthGrid({ days, cursor, byDay, selected, onSelectDay, onOpenEvent }) {
  return (
    <Card className="overflow-hidden p-0">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const dayEvents = byDay.get(dayKey(day)) || [];
          const isSel = isSameDay(day, selected);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectDay(day)}
              className={cn(
                'flex min-h-[4.75rem] cursor-pointer flex-col gap-1 border-b border-r border-border p-1.5 text-left transition-colors last:border-r-0 md:min-h-[7rem]',
                !inMonth && 'bg-muted/20',
                isSel ? 'bg-primary/[0.07] ring-1 ring-inset ring-primary/40' : 'hover:bg-accent/50'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  today && 'bg-primary text-primary-foreground',
                  !today && inMonth && 'text-foreground',
                  !today && !inMonth && 'text-muted-foreground/60'
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Desktop — event pills */}
              <div className="hidden flex-1 space-y-1 md:block">
                {dayEvents.slice(0, 3).map((e) => {
                  const meta = kindOf(e.kind);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenEvent(e);
                      }}
                      title={e.title}
                      className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium"
                      style={{ background: `${meta.color}26`, color: meta.color }}
                    >
                      {e.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] font-medium text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>

              {/* Mobile — event dots */}
              {dayEvents.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-0.5 md:hidden">
                  {dayEvents.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: kindOf(e.kind).color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------- Selected-day panel ---------------- */

function DayPanel({ date, events, onOpen }) {
  return (
    <Card className="flex flex-col">
      <div className="border-b border-border p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {format(date, 'EEEE')}
        </div>
        <div className="text-lg font-semibold text-foreground">{format(date, 'MMMM d, yyyy')}</div>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
          </div>
        ) : (
          events.map((e) => <EventRow key={e.id} event={e} onOpen={onOpen} />)
        )}
      </div>
    </Card>
  );
}

/* ---------------- Agenda view ---------------- */

function AgendaView({ agenda, onOpen }) {
  if (agenda.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nothing on the calendar"
        description="Project deadlines, payments, payouts and tasks will appear here."
      />
    );
  }
  return (
    <div className="space-y-4">
      {agenda.map((group) => (
        <Card key={group.key} className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2.5">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg',
                isToday(group.date)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground'
              )}
            >
              <span className="text-sm font-semibold leading-none">
                {format(group.date, 'd')}
              </span>
              <span className="text-[10px] uppercase">{format(group.date, 'MMM')}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {format(group.date, 'EEEE')}
              </div>
              <div className="text-xs text-muted-foreground">
                {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
              </div>
            </div>
          </div>
          <div className="space-y-2 p-3">
            {group.items.map((e) => (
              <EventRow key={e.id} event={e} onOpen={onOpen} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Shared event row ---------------- */

function EventRow({ event, onOpen }) {
  const meta = kindOf(event.kind);
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/60 p-2.5 text-left transition-colors hover:bg-accent"
    >
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: meta.color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{event.title}</div>
        <div className="text-xs text-muted-foreground">{meta.label}</div>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: `${meta.color}26`, color: meta.color }}
      >
        {meta.label}
      </span>
    </button>
  );
}
