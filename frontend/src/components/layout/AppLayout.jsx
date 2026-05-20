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
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
      >
        <div className="absolute -left-40 -top-44 h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute -bottom-52 right-[-10rem] h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/10 blur-[150px]" />
        <div className="absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-sky-500/5 blur-[150px]" />
      </div>

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
