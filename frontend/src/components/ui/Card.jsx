import { forwardRef } from 'react';
import { cn } from '@/lib/cn.js';

export const Card = forwardRef(function Card({ className, hover = false, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        // Opaque (no backdrop-blur) — blur on every card froze iOS scrolling.
        // min-w-0 lets the card shrink inside grids/flex.
        'min-w-0 rounded-2xl border border-border bg-card text-card-foreground shadow-card transition-all duration-200',
        hover && 'hover:-translate-y-0.5 hover:shadow-elevated hover:ring-1 hover:ring-primary/20',
        className
      )}
      {...props}
    />
  );
});

export const CardHeader = forwardRef(function CardHeader({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5', className)} {...props} />;
});

export const CardTitle = forwardRef(function CardTitle({ className, ...props }, ref) {
  return (
    <h3
      ref={ref}
      className={cn('text-base font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
});

export const CardDescription = forwardRef(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});

export const CardContent = forwardRef(function CardContent({ className, ...props }, ref) {
  return <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />;
});

export const CardFooter = forwardRef(function CardFooter({ className, ...props }, ref) {
  return <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />;
});

export default Card;
