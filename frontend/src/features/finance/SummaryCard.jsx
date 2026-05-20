import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card.jsx';
import { formatCents } from '@/features/projects/projectConstants.js';
import { cn } from '@/lib/cn.js';

function pctChange(cur, prev) {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

export default function SummaryCard({ label, valueCents, currency = 'USD', compareCents, compareLabel, hint }) {
  const pct = compareCents != null ? pctChange(valueCents || 0, compareCents) : null;
  const up = pct != null && pct >= 0;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{formatCents(valueCents || 0, currency)}</CardTitle>
      </CardHeader>
      <CardContent>
        {pct != null ? (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              up ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(pct).toFixed(1)}% vs {compareLabel}
          </div>
        ) : hint ? (
          <div className="text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
