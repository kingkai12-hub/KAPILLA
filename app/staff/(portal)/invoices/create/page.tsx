'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<
    Array<{
      name: string;
      phone: string;
      address: string;
      tin: string;
    }>
  >([]);

  // Invoice type - get from URL parameter or default to PROFORMA
  const [type, setType] = useState<'PROFORMA' | 'FINAL'>('PROFORMA');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'FINAL' || typeParam === 'PROFORMA') {
      setType(typeParam);
    }

    // Fetch live exchange rate
    fetchLiveExchangeRate();

    // Check if we're editing an existing invoice
    const editId = searchParams.get('edit');
    if (editId) {
      setEditingId(editId);
      setIsEditMode(true);
      loadInvoiceForEdit(editId);
    } else {
      // Load saved customers from localStorage
      const saved = localStorage.getItem('invoiceCustomers');
      if (saved) {
        setSavedCustomers(JSON.parse(saved));
      }

      // Load last used settings
      const lastSettings = localStorage.getItem('lastInvoiceSettings');
      if (lastSettings) {
        const settings = JSON.parse(lastSettings);
        setTaxRate(settings.taxRate || 0);
        setTerms(settings.terms || 'Payment due within 30 days');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch live exchange rate
  const fetchLiveExchangeRate = async () => {
    try {
      setLoadingRate(true);
      const res = await fetch('/api/exchange-rate');
      if (res.ok) {
        const data = await res.json();
        setExchangeRate(data.rate);
        setRateSource(data.source);
        setRateTimestamp(data.timestamp);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  // Set manual exchange rate
  const setManualExchangeRate = async () => {
    const rate = parseFloat(manualRate);
    if (!rate || rate <= 0) {
      alert('Please enter a valid exchange rate');
      return;
    }

    try {
      const res = await fetch('/api/exchange-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });

      if (res.ok) {
        const data = await res.json();
        setExchangeRate(data.rate);
        setRateSource('manual');
        setRateTimestamp(data.timestamp);
        setShowRateModal(false);
        setManualRate('');
        alert('Exchange rate updated successfully');
      }
    } catch (error) {
      console.error('Failed to set manual rate:', error);
      alert('Failed to update exchange rate');
    }
  };

  // Load invoice data for editing
  const loadInvoiceForEdit = async (invoiceId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const invoice = await res.json();

        // Populate form with invoice data
        setType(invoice.type);
        setCustomerName(invoice.customerName);
        setCustomerPhone(invoice.customerPhone || '');
        setCustomerAddress(invoice.customerAddress || '');
        setCustomerTIN(invoice.customerTIN || '');
        setRequisitionNumber(invoice.requisitionNumber || '');

        // Set dates
        if (invoice.validUntil) {
          setValidUntil(new Date(invoice.validUntil).toISOString().split('T')[0]);
        }

        setTaxRate(invoice.taxRate);
        setDiscount(invoice.discount);
        setCurrency(invoice.currency || 'TZS'); // Load currency
        setNotes(invoice.notes || '');
        setTerms(invoice.terms || 'Payment due within 30 days');

        // Load items
        setItems(
          invoice.items.map(
            (item: {
              id: string;
              description: string;
              quantity: number;
              unitPrice: number;
              amount: number;
            }) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })
          )
        );
      } else {
        alert('Failed to load invoice for editing');
        router.push('/staff/invoices');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Error loading invoice');
      router.push('/staff/invoices');
    } finally {
      setLoading(false);
    }
  };

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerTIN, setCustomerTIN] = useState('');
  const [requisitionNumber, setRequisitionNumber] = useState('');

  // Invoice details
  const [validUntil, setValidUntil] = useState('');
  const [taxRate, setTaxRate] = useState(0); // Default 0% (optional VAT)
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] = useState('TZS'); // Default TZS, can change to USD
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 30 days');

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState(2500); // Default fallback
  const [rateSource, setRateSource] = useState<'api' | 'manual' | 'fallback'>('fallback');
  const [rateTimestamp, setRateTimestamp] = useState<number>(Date.now());
  const [loadingRate, setLoadingRate] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [manualRate, setManualRate] = useState('');

  // Handle currency change with conversion
  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === currency) return; // No change

    const conversionRate = newCurrency === 'USD' ? 1 / exchangeRate : exchangeRate;

    // Convert all item prices
    setItems(
      items.map((item) => {
        const newUnitPrice = item.unitPrice * conversionRate;
        return {
          ...item,
          unitPrice: Math.round(newUnitPrice * 100) / 100, // Round to 2 decimals
          amount: Math.round(item.quantity * newUnitPrice * 100) / 100,
        };
      })
    );

    // Convert discount
    setDiscount(Math.round(discount * conversionRate * 100) / 100);

    // Update currency
    setCurrency(newCurrency);
  };

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  // Remove item
  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // Update item
  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Auto-calculate amount when quantity or unitPrice changes
          if (field === 'quantity' || field === 'unitPrice') {
            updated.amount = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  // Save customer details to localStorage
  const saveCustomerDetails = () => {
    if (customerName) {
      const customerData = {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        tin: customerTIN,
      };

      // Save to recent customers list
      const saved = localStorage.getItem('invoiceCustomers');
      const customers = saved ? JSON.parse(saved) : [];

      // Check if customer already exists
      const existingIndex = customers.findIndex((c: { name: string }) => c.name === customerName);
      if (existingIndex >= 0) {
        customers[existingIndex] = customerData;
      } else {
        customers.unshift(customerData);
      }

      // Keep only last 10 customers
      const recentCustomers = customers.slice(0, 10);
      localStorage.setItem('invoiceCustomers', JSON.stringify(recentCustomers));
      setSavedCustomers(recentCustomers);

      // Save last used settings
      localStorage.setItem(
        'lastInvoiceSettings',
        JSON.stringify({
          taxRate,
          terms,
        })
      );
    }
  };

  // Load customer details from saved list
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadCustomerDetails = (name: string) => {
    const saved = localStorage.getItem('invoiceCustomers');
    if (saved) {
      const customers = JSON.parse(saved);
      const customer = customers.find((c: { name: string }) => c.name === name);
      if (customer) {
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone || '');
        setCustomerAddress(customer.address || '');
        setCustomerTIN(customer.tin || '');
      }
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted', isEditMode ? 'Edit mode' : 'Create mode');

    if (!customerName) {
      alert('Customer name is required');
      return;
    }

    if (items.some((item) => !item.description)) {
      alert('All items must have a description');
      return;
    }

    // Save customer details before submitting (only in create mode)
    if (!isEditMode) {
      saveCustomerDetails();
    }

    setLoading(true);
    console.log(isEditMode ? 'Updating invoice...' : 'Creating invoice...');

    try {
      const payload = {
        type,
        customerName,
        customerEmail: null,
        customerPhone,
        customerAddress,
        customerTIN,
        requisitionNumber: requisitionNumber || null,
        validUntil,
        taxRate,
        discount,
        currency, // Add currency to payload
        notes,
        terms,
        items: items.map(({ id: _id, ...item }) => item),
      };

      console.log('Payload:', payload);

      // Use PUT for edit, POST for create
      const url = isEditMode ? `/api/invoices/${editingId}` : '/api/invoices-new';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const invoice = await res.json();
        console.log(isEditMode ? 'Invoice updated:' : 'Invoice created:', invoice);
        alert(
          `${type === 'PROFORMA' ? 'Proforma Invoice' : 'Invoice'} ${isEditMode ? 'updated' : 'created'} successfully!`
        );
        router.push(`/staff/invoices/${invoice.id}`);
      } else {
        const error = await res.json();
        console.error('Error response:', error);
        alert(`Error: ${error.error || `Failed to ${isEditMode ? 'update' : 'create'} invoice`}`);
      }
    } catch (error) {
      console.error('Catch error:', error);
      alert(
        `Failed to ${isEditMode ? 'update' : 'create'} invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isEditMode ? 'Edit Invoice' : 'Create Invoice'}
        </h1>
        <p className="text-slate-500 mt-1">
          {isEditMode
            ? 'Update invoice details and items'
            : 'Generate proforma or final invoice for customers'}
        </p>
      </div>

      {/* Exchange Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Set Manual Exchange Rate</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the USD to TZS exchange rate you want to use. This will override the automatic
              rate.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                1 USD = ? TZS
              </label>
              <input
                type="number"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g., 2500"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRateModal(false);
                  setManualRate('');
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={setManualExchangeRate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Set Rate
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Type */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Invoice Type</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="PROFORMA"
                checked={type === 'PROFORMA'}
                onChange={(e) => setType(e.target.value as 'PROFORMA')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-semibold">Proforma Invoice</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="FINAL"
                checked={type === 'FINAL'}
                onChange={(e) => setType(e.target.value as 'FINAL')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-semibold">Final Invoice</span>
            </label>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Customer Details</h2>
            {savedCustomers.length > 0 && (
              <span className="text-xs text-slate-500">
                {savedCustomers.length} saved customer{savedCustomers.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="saved-customers"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  // Auto-load customer details when selecting from list
                  const selected = savedCustomers.find((c) => c.name === e.target.value);
                  if (selected) {
                    setCustomerPhone(selected.phone || '');
                    setCustomerAddress(selected.address || '');
                    setCustomerTIN(selected.tin || '');
                  }
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type or select from saved customers"
                required
              />
              <datalist id="saved-customers">
                {savedCustomers.map((customer, index) => (
                  <option key={index} value={customer.name} />
                ))}
              </datalist>
              {savedCustomers.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">Start typing to see saved customers</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                TIN (Tax ID)
              </label>
              <input
                type="text"
                value={customerTIN}
                onChange={(e) => setCustomerTIN(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Requisition/Order No.
              </label>
              <input
                type="text"
                value={requisitionNumber}
                onChange={(e) => setRequisitionNumber(e.target.value)}
                placeholder="e.g., 001/2024"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-start p-4 bg-slate-50 rounded-lg"
              >
                <div className="col-span-12 md:col-span-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Item description"
                    required
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                    }
                    onFocus={(e) => {
                      if (parseFloat(e.target.value) === 1) {
                        e.target.select();
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Unit Price ({currency})
                  </label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                    onFocus={(e) => {
                      if (parseFloat(e.target.value) === 0) {
                        e.target.select();
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Amount ({currency})
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold">
                    {item.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Calculations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="TZS">TZS (Tanzanian Shilling)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Select USD for international clients</p>

                {/* Exchange Rate Info */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-blue-900">Exchange Rate</span>
                    <button
                      type="button"
                      onClick={() => setShowRateModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Set Manual
                    </button>
                  </div>
                  <div className="text-sm font-bold text-blue-900">
                    1 USD = {exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} TZS
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-blue-700">
                      {rateSource === 'api' && '🌐 Live rate'}
                      {rateSource === 'manual' && '✏️ Manual rate'}
                      {rateSource === 'fallback' && '⚠️ Fallback rate'}
                    </span>
                    <button
                      type="button"
                      onClick={fetchLiveExchangeRate}
                      disabled={loadingRate}
                      className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {loadingRate ? 'Updating...' : '🔄 Refresh'}
                    </button>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Updated:{' '}
                    {new Date(rateTimestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  VAT Rate (%) - Optional
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => {
                    if (parseFloat(e.target.value) === 0) {
                      e.target.select();
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <p className="text-xs text-slate-500 mt-1">Leave as 0 if VAT is not applicable</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Discount ({currency})
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => {
                    if (parseFloat(e.target.value) === 0) {
                      e.target.select();
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-mono">
                  {currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">VAT ({taxRate}%):</span>
                  <span className="font-mono">
                    {currency} {taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="font-semibold">Discount:</span>
                  <span className="font-mono">
                    - {currency} {discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>GRAND TOTAL:</span>
                  <span className="font-mono text-blue-600">
                    {currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'PROFORMA' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Additional notes or instructions"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : `${isEditMode ? 'Update' : 'Create'} ${type === 'PROFORMA' ? 'Proforma Invoice' : 'Invoice'}`}
          </button>
        </div>
      </form>
    </div>
  );
}
