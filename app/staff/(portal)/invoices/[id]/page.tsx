'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  CheckCircle,
  FileText,
  ArrowRight,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Edit2,
  X,
  Check,
} from 'lucide-react';
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
  finalInvoices?: Invoice[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingRequisition, setEditingRequisition] = useState(false);
  const [requisitionNumber, setRequisitionNumber] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setRequisitionNumber(data.requisitionNumber || '');
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Open PDF in new window
    window.open(`/api/invoices/${params.id}/pdf`, '_blank');
  };

  const handleAccept = async () => {
    if (!confirm('Mark this proforma invoice as accepted?')) return;

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      if (res.ok) {
        alert('Proforma invoice accepted!');
        fetchInvoice();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleConvert = async () => {
    if (!confirm('Convert this proforma invoice to a final invoice?')) return;

    try {
      const res = await fetch(`/api/invoices/${params.id}/convert`, {
        method: 'POST',
      });

      if (res.ok) {
        const finalInvoice = await res.json();
        alert('Converted to final invoice successfully!');
        router.push(`/staff/invoices/${finalInvoice.id}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to convert');
      }
    } catch {
      alert('Failed to convert invoice');
    }
  };

  const handleDelete = async () => {
    console.log('Delete button clicked - deleting immediately...');

    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', res.status);
      if (res.ok) {
        alert('Invoice deleted successfully');
        router.push('/staff/invoices');
      } else {
        const error = await res.json();
        console.error('Delete error response:', error);
        alert(`Failed to delete invoice: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete invoice. Please check your connection and try again.');
    }
  };

  const handleUpdateRequisition = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requisitionNumber: requisitionNumber || null }),
      });

      if (res.ok) {
        await fetchInvoice();
        setEditingRequisition(false);
        alert('Requisition number updated successfully!');
      } else {
        alert('Failed to update requisition number');
      }
    } catch {
      alert('Failed to update requisition number');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
  const accentColor = 'text-blue-600'; // dark blue for both
  const borderColor = 'border-blue-600'; // dark blue for both
  const bgColor = 'bg-blue-50'; // light blue for both

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-2 sm:p-4">
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
            .no-break {
              break-inside: avoid-page;
              page-break-inside: avoid;
            }
            .print-hidden {
              display: none !important;
            }
            .print-container {
              width: 194mm !important;
              max-width: 194mm !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: 8mm !important;
              box-shadow: none !important;
              transform: scale(1) !important;
              overflow: visible !important;
              page-break-after: avoid !important;
            }
            * {
              box-sizing: border-box;
            }
          }
        `}
      </style>

      <div className="space-y-2 sm:space-y-6 w-full max-w-5xl">
        {/* Action Buttons - Hidden when printing */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 print-hidden">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900">{invoice.type} Invoice</h1>
            <p className="text-xs sm:text-sm text-slate-500">{invoice.invoiceNumber}</p>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-3">
            <button
              onClick={() => router.push(`/staff/invoices/create?edit=${params.id}`)}
              className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-amber-600 text-white rounded text-xs sm:text-base hover:bg-amber-700 font-semibold transition-colors"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Edit Invoice</span>
              <span className="sm:hidden">Edit</span>
            </button>
            {invoice.type === 'PROFORMA' && invoice.status === 'DRAFT' && (
              <button
                onClick={handleAccept}
                className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-base hover:bg-green-700 font-semibold transition-colors"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Accept</span>
                <span className="sm:hidden">OK</span>
              </button>
            )}
            {invoice.type === 'PROFORMA' &&
              invoice.status === 'ACCEPTED' &&
              !invoice.finalInvoices?.length && (
                <button
                  onClick={handleConvert}
                  className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-base hover:bg-blue-700 font-semibold transition-colors"
                >
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Convert to Invoice</span>
                  <span className="sm:hidden">Convert</span>
                </button>
              )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-slate-900 text-white rounded text-xs sm:text-base hover:bg-slate-800 font-semibold transition-colors"
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Print Invoice</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={() =>
                window.open(`/api/invoices/${params.id}/pdf?type=delivery-note`, '_blank')
              }
              className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-base hover:bg-blue-700 font-semibold transition-colors"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delivery Note</span>
              <span className="sm:hidden">DN</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-base hover:bg-red-700 font-semibold transition-colors"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete</span>
              <span className="sm:hidden">Del</span>
            </button>
          </div>
        </div>

        {/* Invoice Document - Printable */}
        <div className="print-container bg-white shadow-lg sm:shadow-2xl rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 no-break">
          {/* Header with Company Info */}
          <div className="bg-white border-b-2 sm:border-b-4 border-slate-900 p-2 sm:p-8 print:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
              <div className="flex items-start gap-2 sm:gap-6 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-24 sm:h-24 border border-slate-300 sm:border-2 rounded p-1 sm:p-2 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Kapilla Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm sm:text-3xl font-bold mb-0 sm:mb-2 text-slate-900">
                    KAPILLA GROUP LIMITED
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm mb-1 sm:mb-3 hidden sm:block">
                    Logistics & Transportation Services
                  </p>
                  <div className="space-y-0 sm:space-y-1 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MapPin className="w-2 h-2 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">P.O. BOX 71729, DSM</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Phone className="w-2 h-2 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">+255 65 860 4772</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 hidden sm:flex">
                      <Mail className="w-4 h-4" />
                      <span>express@kapillagroup.co.tz</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 hidden sm:flex">
                      <Building2 className="w-4 h-4" />
                      <span>TIN: 157-935-380</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <div className={`${bgColor} rounded p-2 sm:p-4 border sm:border-2 ${borderColor}`}>
                  <h1 className={`text-sm sm:text-3xl font-bold mb-1 sm:mb-3 ${accentColor}`}>
                    {isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE'}
                  </h1>
                  <div className="space-y-0 sm:space-y-1 text-xs sm:text-sm text-slate-900">
                    <p className="flex justify-between gap-2 sm:gap-4">
                      <span className="font-semibold">Invoice #:</span>
                      <span className="font-mono text-xs sm:text-sm">{invoice.invoiceNumber}</span>
                    </p>
                    <p className="flex justify-between gap-2 sm:gap-4">
                      <span className="font-semibold">Date:</span>
                      <span className="text-xs sm:text-sm">
                        {new Date(invoice.issueDate).toLocaleDateString('en-GB')}
                      </span>
                    </p>
                    {invoice.dueDate && (
                      <p className="flex justify-between gap-2 sm:gap-4">
                        <span className="font-semibold">Due Date:</span>
                        <span className="text-xs sm:text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                        </span>
                      </p>
                    )}
                    {invoice.validUntil && (
                      <p className="flex justify-between gap-2 sm:gap-4 hidden sm:flex">
                        <span className="font-semibold">Valid Until:</span>
                        <span>{new Date(invoice.validUntil).toLocaleDateString('en-GB')}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 sm:p-10 print:p-6">
            {/* Bill To Section */}
            <div className="mb-2 sm:mb-8">
              <div className="border sm:border-2 border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-100 px-2 py-1 sm:px-4 sm:py-2 border-b sm:border-b-2 border-slate-300">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Bill To
                  </h3>
                </div>
                <div className="p-2 sm:p-6">
                  <div className="space-y-1 sm:space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0 sm:mb-1">
                        Customer
                      </p>
                      <p className="font-bold text-sm sm:text-lg text-slate-900">
                        {invoice.customerName}
                      </p>
                    </div>

                    {invoice.customerAddress && (
                      <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                          Address
                        </p>
                        <p className="text-slate-900">{invoice.customerAddress}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {invoice.customerPhone && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-0 sm:mb-1">
                            Phone
                          </p>
                          <p className="text-xs sm:text-sm text-slate-900">
                            {invoice.customerPhone}
                          </p>
                        </div>
                      )}
                      {invoice.customerTIN && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-0 sm:mb-1">
                            TIN
                          </p>
                          <p className="text-xs sm:text-sm text-slate-900 font-mono">
                            {invoice.customerTIN}
                          </p>
                        </div>
                      )}
                    </div>

                    {invoice.requisitionNumber || editingRequisition ? (
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-slate-500 uppercase">
                            Requisition/Order No.
                          </p>
                          {!editingRequisition && (
                            <button
                              onClick={() => setEditingRequisition(true)}
                              className="print:hidden p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Edit requisition number"
                            >
                              <Edit2 className="w-3 h-3 text-slate-600" />
                            </button>
                          )}
                        </div>
                        {editingRequisition ? (
                          <div className="flex items-center gap-2 print:hidden">
                            <input
                              type="text"
                              value={requisitionNumber}
                              onChange={(e) => setRequisitionNumber(e.target.value)}
                              placeholder="e.g., REQ001/2024"
                              className="px-3 py-1 border border-slate-300 rounded text-sm font-mono flex-1"
                              autoFocus
                            />
                            <button
                              onClick={handleUpdateRequisition}
                              className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRequisition(false);
                                setRequisitionNumber(invoice.requisitionNumber || '');
                              }}
                              className="p-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-900 font-mono">
                            {invoice.requisitionNumber || 'Not set'}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-2 sm:mb-8 overflow-x-auto border sm:border-2 border-slate-300">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left py-1 px-1 sm:py-3 sm:px-4 font-bold text-slate-900 border-b sm:border-b-2 border-slate-300">
                      DESCRIPTION
                    </th>
                    <th className="text-center py-1 px-1 sm:py-3 sm:px-4 font-bold text-slate-900 border-b sm:border-b-2 border-slate-300">
                      QTY
                    </th>
                    <th className="text-right py-1 px-1 sm:py-3 sm:px-4 font-bold text-slate-900 border-b sm:border-b-2 border-slate-300 hidden sm:table-cell">
                      UNIT PRICE
                    </th>
                    <th className="text-right py-1 px-1 sm:py-3 sm:px-4 font-bold text-slate-900 border-b sm:border-b-2 border-slate-300">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-300">
                      <td className="py-1 px-1 sm:py-3 sm:px-4 text-slate-900 border-r border-slate-200 text-xs sm:text-sm">
                        {item.description}
                      </td>
                      <td className="py-1 px-1 sm:py-3 sm:px-4 text-center text-slate-900 border-r border-slate-200">
                        {item.quantity}
                      </td>
                      <td className="py-1 px-1 sm:py-3 sm:px-4 text-right text-slate-900 font-mono border-r border-slate-200 hidden sm:table-cell">
                        {invoice.currency}{' '}
                        {item.unitPrice.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-1 px-1 sm:py-3 sm:px-4 text-right text-slate-900 font-mono font-semibold">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-8 mb-2 sm:mb-8">
              {/* Bank Details (Final Invoice Only) */}
              {!isProforma && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded p-2 sm:p-6 border sm:border-2 border-slate-200 hidden sm:block">
                  <h4 className="font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Payment Information
                  </h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
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
                      <p className="text-slate-900 font-mono">0150868228800</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">USD Account:</p>
                      <p className="text-slate-900 font-mono">0250868228800</p>
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
              <div className={`${isProforma ? 'col-span-1 lg:col-span-2' : ''}`}>
                <div className="bg-slate-50 rounded p-2 sm:p-6 border sm:border-2 border-slate-200">
                  <div className="space-y-1 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 sm:py-2 text-slate-700">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-mono text-slate-900">
                        {invoice.currency}{' '}
                        {invoice.subtotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {invoice.taxRate > 0 && (
                      <div className="flex justify-between py-1 sm:py-2 text-slate-700">
                        <span className="font-semibold">VAT ({invoice.taxRate}%):</span>
                        <span className="font-mono text-slate-900">
                          {invoice.currency}{' '}
                          {invoice.taxAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                    {invoice.discount > 0 && (
                      <div className="flex justify-between py-1 sm:py-2 text-green-600">
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
                    <div
                      className={`flex justify-between py-2 sm:py-4 border-t sm:border-t-2 ${borderColor} mt-1 sm:mt-2`}
                    >
                      <span className="font-bold text-sm sm:text-xl text-slate-900">TOTAL:</span>
                      <span className={`font-mono font-bold text-base sm:text-2xl ${accentColor}`}>
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
              <div className="mb-2 sm:mb-6 bg-amber-50 border-l-2 sm:border-l-4 border-amber-400 rounded-r p-2 sm:p-4 hidden sm:block">
                <h4 className="font-bold text-slate-900 mb-1 sm:mb-2 flex items-center gap-2 text-xs sm:text-sm">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                  Notes
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms && (
              <div className="mb-2 sm:mb-6 bg-slate-50 rounded p-2 sm:p-4 border border-slate-200 hidden sm:block">
                <h4 className="font-bold text-slate-900 mb-1 sm:mb-2 text-xs sm:text-sm">
                  Terms & Conditions
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {invoice.terms}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className={`mt-2 sm:mt-8 pt-2 sm:pt-6 border-t sm:border-t-2 ${borderColor}`}>
              <div className="text-center">
                <p className="text-slate-900 font-semibold mb-1 sm:mb-2 text-xs sm:text-base">
                  Thank you for your business!
                </p>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                  For any questions regarding this invoice, please contact us at{' '}
                  <span className={`font-semibold ${accentColor}`}>kapillagroup@gmail.com</span> or{' '}
                  <span className={`font-semibold ${accentColor}`}>+255 65 860 4772</span>
                </p>
              </div>
              <div className="mt-2 sm:mt-6 text-center text-xs text-slate-500">
                <p className="hidden sm:block">
                  This is a computer-generated document. No signature is required.
                </p>
                <p className="mt-0 sm:mt-1 text-xs">KAPILLA GROUP LIMITED | DSM, TZ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
