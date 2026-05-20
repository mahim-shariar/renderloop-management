import { forwardRef } from 'react';
import { cn } from '@/lib/cn.js';

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

// Native <select> styled to match, with a custom chevron. Single element so
// width utility classes passed via `className` apply correctly.
const Select = forwardRef(function Select({ className, children, style, ...props }, ref) {
  return (
    <select
      ref={ref}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.6rem center',
        backgroundSize: '16px',
        ...style,
      }}
      className={cn(
        'flex h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm text-foreground',
        'transition-colors hover:border-muted-foreground/30',
        'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
