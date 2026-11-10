import AccessRestricted from '@/components/AccessRestricted';
import { hasInvoiceAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function InvoiceLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasInvoiceAccess())) {
    return (
      <AccessRestricted message="You do not have permission to view invoices. Contact an administrator to request access." />
    );
  }
  return <>{children}</>;
}
