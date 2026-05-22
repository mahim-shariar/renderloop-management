import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import BottomNav from './BottomNav.jsx';
import Topbar from './Topbar.jsx';
import { cn } from '@/lib/cn.js';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient gradient backdrop — pure CSS radial gradients.
          filter:blur() on a fixed layer freezes iOS Safari, so the glow
          is painted with gradients (zero compositing cost) instead. */}
      <div
        aria-hidden
        className="app-ambient pointer-events-none fixed inset-0 -z-10 bg-background"
      />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'md:pl-[6rem]' : 'md:pl-[16.5rem]'
        )}
      >
        <Topbar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-3 md:px-6 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="min-w-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
