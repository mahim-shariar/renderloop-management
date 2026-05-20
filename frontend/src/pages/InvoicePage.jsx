import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Film } from 'lucide-react';
import Button from '@/components/ui/Button.jsx';
import { Card, CardContent } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/ui/EmptyState.jsx';
import { useBuildInvoiceFromProjectQuery } from '@/features/finance/financeApi.js';
import { formatCents } from '@/features/projects/projectConstants.js';

export default function InvoicePage() {
  const { projectId } = useParams();
  const { data, isLoading, isError, error } = useBuildInvoiceFromProjectQuery(projectId);
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: data?.data?.invoice?.invoiceNumber || 'Invoice',
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (isError) {
    return (
      <EmptyState
        icon={Film}
        title="Could not load invoice"
        description={error?.data?.message || 'Project or client missing.'}
        action={
          <Button asChild variant="outline">
            <Link to="/finance">Back to Finance</Link>
          </Button>
        }
      />
    );
  }

  const inv = data.data.invoice;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/projects/${inv.project._id}`} aria-label="Back to project">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Invoice {inv.invoiceNumber}
          </h1>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={printRef} className="invoice-page mx-auto max-w-3xl bg-white p-10 text-neutral-900">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-neutral-900 text-white">
                  <Film className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xl font-semibold">
                  {inv.agency?.name || 'RenderLoop'}
                </div>
                {inv.agency?.email && (
                  <div className="text-sm text-neutral-500">{inv.agency.email}</div>
                )}
                {inv.agency?.phone && (
                  <div className="text-sm text-neutral-500">{inv.agency.phone}</div>
                )}
                {inv.agency?.address && (
                  <div className="text-sm text-neutral-500">{inv.agency.address}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold tracking-tight">INVOICE</div>
                <div className="mt-1 text-sm text-neutral-500">{inv.invoiceNumber}</div>
                <div className="mt-1 text-sm text-neutral-500">
                  Issued {format(new Date(inv.issuedOn), 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold uppercase tracking-wide text-neutral-500 text-xs">
                  Billed to
                </div>
                <div className="mt-1 font-semibold">{inv.client.name}</div>
                {inv.client.company && <div>{inv.client.company}</div>}
                {inv.client.email && <div className="text-neutral-600">{inv.client.email}</div>}
                {inv.client.phone && <div className="text-neutral-600">{inv.client.phone}</div>}
                {inv.client.country && <div className="text-neutral-600">{inv.client.country}</div>}
              </div>
              <div className="text-right">
                <div className="font-semibold uppercase tracking-wide text-neutral-500 text-xs">
                  Project
                </div>
                <div className="mt-1 font-semibold">{inv.project.title}</div>
                {inv.project.videoType && (
                  <div className="text-neutral-600 capitalize">
                    {inv.project.videoType.replace(/_/g, ' ')}
                  </div>
                )}
                {inv.project.deliveredAt && (
                  <div className="text-neutral-600">
                    Delivered {format(new Date(inv.project.deliveredAt), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            <table className="mt-8 w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.lineItems.map((li, i) => (
                  <tr key={i} className="border-b border-neutral-200">
                    <td className="py-3">{li.description}</td>
                    <td className="py-3 text-right">{formatCents(li.amountCents, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 text-right text-sm font-medium uppercase tracking-wide text-neutral-500">
                    Total
                  </td>
                  <td className="pt-4 text-right text-xl font-semibold">
                    {formatCents(inv.totalCents, inv.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-12 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
              {inv.agency?.invoiceFooter ||
                'Payment due within 14 days of receipt. Reference invoice number on transfer.'}
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body { background: white !important; }
          .invoice-page { padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
