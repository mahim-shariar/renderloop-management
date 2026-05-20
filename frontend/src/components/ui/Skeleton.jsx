import { cn } from '@/lib/cn.js';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('shimmer rounded-md bg-muted/70', className)}
      {...props}
    />
  );
}

export default Skeleton;
