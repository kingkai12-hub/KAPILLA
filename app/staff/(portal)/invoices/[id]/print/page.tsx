'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import Image from 'next/image';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerTIN: string | null;
  requisitionNumber: string | null;
  issueDate: string;
  dueDate: string | null;
  validUntil: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  items: InvoiceItem[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export default function InvoicePrintPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        // Auto-print after loading
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900">Invoice not found</h2>
      </div>
    );
  }

  const isProforma = invoice.type === 'PROFORMA';
  const accentColor = isProforma ? 'text-purple-600' : 'text-blue-600';
  const borderColor = isProforma ? 'border-purple-600' : 'border-blue-600';
  const bgColor = isProforma ? 'bg-purple-50' : 'bg-blue-50';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              overflow: hidden;
            }
            body > * {
              display: none !important;
            }
            body > div:first-child {
              display: block !important;
            }
            .print-container {
              display: block !important;
              width: 194mm !important;
              max-width: 194mm !important;
              height: auto !important;
              max-height: 281mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              transform: scale(1) !important;
              overflow: visible !important;
              page-break-after: avoid !important;
            }
            * {
              box-sizing: border-box;
            }
          }
          @media screen {
            .print-container {
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        `}
      </style>

      <div className="print-container w-full">
        {/* Header with Company Info */}
        <div className="bg-white border-b-4 border-slate-900 pb-4 mb-4 px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 w-full sm:w-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-slate-300 rounded-lg p-2 flex items-center justify-center mx-auto sm:mx-0">
                <Image
                  src="/logo.png"
                  alt="Kapilla Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="text-center sm:text-left w-full sm:w-auto">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 text-slate-900">
                  KAPILLA GROUP LIMITED
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm mb-3">
                  Logistics & Transportation Services
                </p>
                <div className="space-y-1 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-left">P.O Box 71729, Sea Cliff Village, 10 Toure Drive, Msasani, Dar es Salaam, Tanzania</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>+255 65 860 4772 / +255 76 062 9563</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>info@kapillagroup.co.tz</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span>TIN: 157-935-380</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <div className={`${bgColor} rounded-lg p-3 sm:p-4 border-2 ${borderColor}`}>
                <h1
                  className={`text-xl sm:text-3xl font-bold mb-2 sm:mb-3 ${accentColor} text-center sm:text-right`}
                >
                  {isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE'}
                </h1>
                <div className="space-y-1 text-xs sm:text-sm text-slate-900">
                  <p className="flex justify-between gap-2 sm:gap-4">
                    <span className="font-semibold">Invoice #:</span>
                    <span className="font-mono text-right">{invoice.invoiceNumber}</span>
                  </p>
                  <p className="flex justify-between gap-2 sm:gap-4">
                    <span className="font-semibold">Date:</span>
                    <span className="text-right">
                      {new Date(invoice.issueDate).toLocaleDateString('en-GB')}
                    </span>
                  </p>
                  {invoice.dueDate && (
                    <p className="flex justify-between gap-2 sm:gap-4">
                      <span className="font-semibold">Due Date:</span>
                      <span className="text-right">
                        {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                  )}
                  {invoice.validUntil && (
                    <p className="flex justify-between gap-2 sm:gap-4">
                      <span className="font-semibold">Valid Until:</span>
                      <span className="text-right">
                        {new Date(invoice.validUntil).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-4 px-2 sm:px-4">
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 sm:px-4 py-2 border-b-2 border-slate-300">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                Bill To
              </h3>
            </div>
            <div className="p-3 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    Company/Customer Name
                  </p>
                  <p className="font-bold text-base sm:text-lg text-slate-900 break-words">
                    {invoice.customerName}
                  </p>
                </div>

                {invoice.customerAddress && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Address</p>
                    <p className="text-sm sm:text-base text-slate-900 break-words">
                      {invoice.customerAddress}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {invoice.customerPhone && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Phone</p>
                      <p className="text-sm sm:text-base text-slate-900">{invoice.customerPhone}</p>
                    </div>
                  )}
                  {invoice.customerTIN && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                        TIN Number
                      </p>
                      <p className="text-sm sm:text-base text-slate-900 font-mono break-all">
                        {invoice.customerTIN}
                      </p>
                    </div>
                  )}
                </div>

                {invoice.requisitionNumber && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                      Requisition/Order No.
                    </p>
                    <p className="text-sm sm:text-base text-slate-900 font-mono break-all">
                      {invoice.requisitionNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4 overflow-x-auto border-2 border-slate-300 mx-2 sm:mx-4">
          <table className="w-full border-collapse min-w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-bold text-slate-900 border-b-2 border-slate-300 text-xs sm:text-base">
                  DESCRIPTION
                </th>
                <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-bold text-slate-900 border-b-2 border-slate-300 text-xs sm:text-base whitespace-nowrap">
                  QTY
                </th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-bold text-slate-900 border-b-2 border-slate-300 text-xs sm:text-base whitespace-nowrap">
                  UNIT PRICE
                </th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-bold text-slate-900 border-b-2 border-slate-300 text-xs sm:text-base whitespace-nowrap">
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-300">
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-slate-900 border-r border-slate-200 text-xs sm:text-base break-words">
                    {item.description}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-slate-900 border-r border-slate-200 text-xs sm:text-base">
                    {item.quantity}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-slate-900 font-mono border-r border-slate-200 text-xs sm:text-base whitespace-nowrap">
                    {invoice.currency}{' '}
                    {item.unitPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-slate-900 font-mono font-semibold text-xs sm:text-base whitespace-nowrap">
                    {invoice.currency}{' '}
                    {item.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals and Payment Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 px-2 sm:px-4">
          {/* Bank Details (Final Invoice Only) */}
          {!isProforma && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 sm:p-6 border-2 border-slate-200">
              <h4 className="font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Payment Information
              </h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-slate-700">Bank Name:</p>
                  <p className="text-slate-900">CRDB Bank PLC</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Branch:</p>
                  <p className="text-slate-900">OYSTERBAY</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Account Name:</p>
                  <p className="text-slate-900">KAPILLA GROUP LIMITED</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">TZS Account:</p>
                  <p className="text-slate-900 font-mono break-all">0150868228800</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">USD Account:</p>
                  <p className="text-slate-900 font-mono break-all">0250868228800</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Swift Code:</p>
                  <p className="text-slate-900 font-mono">CORUTZTZ</p>
                </div>
                <div className="pt-2 border-t border-slate-300">
                  <p className="text-xs text-slate-600 italic">
                    Please include invoice number in payment reference
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className={`${isProforma ? 'lg:col-span-2' : ''}`}>
            <div className="bg-slate-50 rounded-lg p-4 sm:p-6 border-2 border-slate-200">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between py-2 text-slate-700 text-sm sm:text-base">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-mono text-slate-900">
                    {invoice.currency}{' '}
                    {invoice.subtotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-slate-700 text-sm sm:text-base">
                  <span className="font-semibold">VAT ({invoice.taxRate}%):</span>
                  <span className="font-mono text-slate-900">
                    {invoice.currency}{' '}
                    {invoice.taxAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between py-2 text-green-600 text-sm sm:text-base">
                    <span className="font-semibold">Discount:</span>
                    <span className="font-mono">
                      - {invoice.currency}{' '}
                      {invoice.discount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className={`flex justify-between py-3 sm:py-4 border-t-2 ${borderColor} mt-2`}>
                  <span className="font-bold text-base sm:text-xl text-slate-900">
                    TOTAL AMOUNT:
                  </span>
                  <span className={`font-mono font-bold text-lg sm:text-2xl ${accentColor}`}>
                    {invoice.currency}{' '}
                    {invoice.total.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3 sm:p-4 mx-2 sm:mx-4">
            <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <FileText className="w-4 h-4 text-amber-600" />
              Notes
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Terms */}
        {invoice.terms && (
          <div className="mb-3 bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200 mx-2 sm:mx-4">
            <h4 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">
              Terms & Conditions
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed break-words">
              {invoice.terms}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-4 pt-3 border-t-2 ${borderColor} px-2 sm:px-4`}>
          <div className="text-center">
            <p className="text-sm sm:text-base text-slate-900 font-semibold mb-2">
              Thank you for your business!
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              For any questions regarding this invoice, please contact us at{' '}
              <span className={`font-semibold ${accentColor} break-all`}>
                info@kapillagroup.co.tz
              </span>{' '}
              or <span className={`font-semibold ${accentColor}`}>+255 65 860 4772</span>
            </p>
          </div>
          <div className="mt-4 text-center text-xs text-slate-500">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1 break-words">
              KAPILLA GROUP LIMITED | P.O Box 71729, Sea Cliff Village, 10 Toure Drive, Msasani, Dar es Salaam, Tanzania | TIN: 157-935-380
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
