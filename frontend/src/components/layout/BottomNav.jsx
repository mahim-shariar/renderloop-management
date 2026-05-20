import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Film,
  CheckSquare,
  Calendar,
  Menu,
  Users,
  UsersRound,
  Wallet,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn.js';
import { selectAuthUser } from '@/features/auth/authSlice.js';

// 4 primary tabs shown directly on the bar; the rest live behind "More".
const PRIMARY = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: Film },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
];

const ALL = [
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

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const user = useSelector(selectAuthUser);
  const isStaff = user?.role === 'admin' || user?.role === 'manager';
  const allItems = ALL.filter((i) => isStaff || !i.staffOnly);

  const tabClass = ({ isActive }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors',
      isActive ? 'text-primary' : 'text-muted-foreground'
    );

  return (
    <>
      {/* Bottom bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
        {PRIMARY.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary/10'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium text-muted-foreground"
        >
          <span className="flex h-7 w-12 items-center justify-center rounded-full">
            <Menu className="h-4 w-4" />
          </span>
          More
        </button>
      </nav>

      {/* "More" sheet */}
      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-card p-4 pb-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {allItems.map((item) => {
                  const active =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
