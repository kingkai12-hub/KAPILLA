// Redirect to the main invoice create page with final type
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreateInvoicePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/staff/invoices/create?type=FINAL');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
