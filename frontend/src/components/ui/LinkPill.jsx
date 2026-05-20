import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/cn.js';

const HOSTS = [
  { match: /frame\.io|f\.io/i, label: 'Frame.io', color: 'bg-blue-500/15 text-blue-300' },
  { match: /drive\.google\.com|docs\.google\.com/i, label: 'Drive', color: 'bg-yellow-500/15 text-yellow-300' },
  { match: /dropbox\.com/i, label: 'Dropbox', color: 'bg-sky-500/15 text-sky-300' },
  { match: /wetransfer\.com|we\.tl/i, label: 'WeTransfer', color: 'bg-cyan-500/15 text-cyan-300' },
  { match: /youtube\.com|youtu\.be/i, label: 'YouTube', color: 'bg-red-500/15 text-red-300' },
  { match: /vimeo\.com/i, label: 'Vimeo', color: 'bg-teal-500/15 text-teal-300' },
];

function classify(url) {
  for (const h of HOSTS) if (h.match.test(url)) return h;
  return { label: 'Link', color: 'bg-muted text-muted-foreground' };
}

export function LinkPill({ url, label, className }) {
  if (!url) return null;
  const kind = classify(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent',
        className
      )}
      title={url}
    >
      <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] leading-none', kind.color)}>
        {kind.label}
      </span>
      <span className="max-w-[180px] truncate">{label || new URL(url).hostname}</span>
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

LinkPill.Icon = LinkIcon;

export default LinkPill;
