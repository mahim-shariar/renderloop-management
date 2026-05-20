import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn.js';

export function Modal({ open, onOpenChange, title, description, children, footer, className }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/55 backdrop-blur-sm',
            'data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-card p-6 shadow-elevated',
            'data-[state=open]:animate-content-in data-[state=closed]:animate-content-out',
            'focus:outline-none',
            className
          )}
        >
          {(title || description) && (
            <div className="mb-4 space-y-1 pr-8">
              {title && (
                <Dialog.Title className="text-base font-semibold leading-none tracking-tight text-card-foreground">
                  {title}
                </Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
          )}
          <div>{children}</div>
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
          <Dialog.Close
            className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
