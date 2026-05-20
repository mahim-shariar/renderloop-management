import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn.js';

const variants = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-accent active:scale-[0.98]',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-accent hover:border-border active:scale-[0.98]',
  ghost: 'bg-transparent text-foreground hover:bg-accent active:scale-[0.98]',
  destructive:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]',
  link: 'bg-transparent text-primary underline-offset-4 hover:underline',
};

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0',
};

const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});

export default Button;
