# Invoice Edit Feature ✅

## Feature Added

Added the ability to edit existing invoices by loading them back into the create form instead of creating new ones.

## Changes Made

### 1. Invoice Detail Page (`app/staff/(portal)/invoices/[id]/page.tsx`)

**Added Edit Button**:

```typescript
<button
  onClick={() => router.push(`/staff/invoices/create?edit=${params.id}`)}
  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
>
  <Edit2 className="w-4 h-4" />
  Edit Invoice
</button>
```

### 2. Create Invoice Page (`app/staff/(portal)/invoices/create/page.tsx`)

**Added Edit Mode Support**:

- Detects `?edit=<invoice-id>` query parameter
- Loads existing invoice data into form
- Changes button text to "Update" instead of "Create"
- Uses PUT method instead of POST for updates

**Key Changes**:

```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const [isEditMode, setIsEditMode] = useState(false);

// Load invoice for editing
const loadInvoiceForEdit = async (invoiceId: string) => {
  const res = await fetch(`/api/invoices/${invoiceId}`);
  const invoice = await res.json();
  // Populate all form fields...
};

// Submit handler
const url = isEditMode ? `/api/invoices/${editingId}` : '/api/invoices-new';
const method = isEditMode ? 'PUT' : 'POST';
```

### 3. API Route (`app/api/invoices/[id]/route.ts`)

**Added PUT Method**:

```typescript
export async function PUT(req: Request, context) {
  // Delete existing items
  await db.invoiceItem.deleteMany({ where: { invoiceId } });

  // Update invoice with new data
  const updated = await db.invoice.update({
    where: { id },
    data: {
      // All invoice fields
      items: {
        create: body.items.map(...)
      }
    }
  });

  return NextResponse.json(updated);
}
```

## How It Works

### Edit Flow:

1. User views invoice detail page
2. Clicks "Edit Invoice" button
3. Redirected to `/staff/invoices/create?edit=<invoice-id>`
4. Form loads with existing invoice data
5. User makes changes
6. Clicks "Update Invoice" button
7. PUT request updates the invoice
8. Redirected back to invoice detail page

## Features

✅ Load existing invoice data into form
✅ Edit all invoice fields (customer, items, dates, etc.)
✅ Update items (add, remove, modify)
✅ Recalculate totals automatically
✅ Preserve invoice number and ID
✅ Show "Edit" vs "Create" in UI
✅ Use PUT method for updates
✅ Delete old items and create new ones

## Usage

### From Invoice Detail Page:

```
1. Navigate to any invoice: /staff/invoices/[id]
2. Click "Edit Invoice" button (amber/orange)
3. Make changes in the form
4. Click "Update Invoice"
5. Invoice is updated and you're redirected back
```

### Direct URL:

```
/staff/invoices/create?edit=<invoice-id>
```

## Benefits

1. **No Duplicate Invoices**: Edit existing instead of creating new
2. **Preserve History**: Invoice number and ID stay the same
3. **Easy Corrections**: Fix mistakes without deleting
4. **Full Control**: Edit all fields and items
5. **User Friendly**: Familiar create form interface

## Testing

Test the feature:

```bash
1. Create an invoice
2. View the invoice detail page
3. Click "Edit Invoice"
4. Modify some fields
5. Click "Update Invoice"
6. Verify changes are saved
```

## Status

✅ **COMPLETE AND READY TO USE**
