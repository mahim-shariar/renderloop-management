import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Film,
  UsersRound,
  Wallet,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn.js';
import { selectAuthUser } from '@/features/auth/authSlice.js';

// staffOnly entries are hidden from editors / clients.
const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Clients', icon: Users, staffOnly: true },
  { to: '/projects', label: 'Projects', icon: Film },
  { to: '/team', label: 'Team', icon: UsersRound, staffOnly: true },
  { to: '/finance', label: 'Finance', icon: Wallet, staffOnly: true },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, staffOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

// Desktop-only floating glass rail. Mobile uses <BottomNav />.
export default function Sidebar({ collapsed, onToggle }) {
  const user = useSelector(selectAuthUser);
  const isStaff = user?.role === 'admin' || user?.role === 'manager';
  const nav = NAV.filter((item) => isStaff || !item.staffOnly);

  return (
    <aside
      className={cn(
        'fixed inset-y-3 left-3 z-40 hidden flex-col rounded-2xl border border-border bg-card/70 shadow-elevated backdrop-blur-xl transition-[width] duration-300 ease-out md:flex',
        collapsed ? 'w-[4.5rem]' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center px-4">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-white shadow-glow">
            <Film className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-foreground">
                RenderLoop
              </div>
              <div className="text-[10px] text-muted-foreground">Editing studio OS</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-transform duration-150',
                    !isActive && 'group-hover:scale-110'
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
