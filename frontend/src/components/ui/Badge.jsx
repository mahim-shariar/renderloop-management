import { cn } from '@/lib/cn.js';

const variants = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/25',
  outline: 'border border-border text-foreground',
  success: 'bg-success/15 text-success ring-1 ring-inset ring-success/25',
  warning: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/25',
  destructive: 'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25',
  muted: 'bg-muted text-muted-foreground',
};

export function Badge({ className, variant = 'default', children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
