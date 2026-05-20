import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn.js';

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

export function DropdownContent({ className, sideOffset = 6, align = 'end', ...props }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-elevated',
          'origin-[var(--radix-dropdown-menu-content-transform-origin)]',
          'data-[state=open]:animate-pop-in',
          className
        )}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

export function DropdownItem({ className, ...props }) {
  return (
    <DropdownMenu.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-none transition-colors',
        'focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function DropdownSeparator({ className }) {
  return <DropdownMenu.Separator className={cn('my-1 h-px bg-border', className)} />;
}

export function DropdownLabel({ className, ...props }) {
  return (
    <DropdownMenu.Label
      className={cn('truncate px-3 py-1.5 text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}

export default Dropdown;
