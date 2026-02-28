# Currency Selector Feature ✅

## Feature Added

Added the ability to select currency (TZS or USD) when creating or editing invoices, allowing for international/outside clients.

## Changes Made

### 1. Create Invoice Page (`app/staff/(portal)/invoices/create/page.tsx`)

**Added Currency State**:

```typescript
const [currency, setCurrency] = useState('TZS'); // Default TZS, can change to USD
```

**Added Currency Selector**:

```typescript
<select
  value={currency}
  onChange={(e) => setCurrency(e.target.value)}
  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
>
  <option value="TZS">TZS (Tanzanian Shilling)</option>
  <option value="USD">USD (US Dollar)</option>
</select>
```

**Updated All Currency Displays**:

- Changed hardcoded "TZS" to dynamic `{currency}`
- Updated subtotal, VAT, discount, and total displays
- Updated discount label to show selected currency

**Updated Form Grid**:

- Changed from 2 columns to 3 columns
- Currency selector in first column
- VAT Rate in second column
- Discount in third column

### 2. API Routes

**Invoice Creation** (`app/api/invoices-new/route.ts`):

- Already had `currency = 'TZS'` as default parameter
- Already saving currency to database
- No changes needed ✅

**Invoice Update** (`app/api/invoices/[id]/route.ts`):

- Added `currency: body.currency || 'TZS'` to update data
- Currency now updates when editing invoices

## How It Works

### Creating Invoice:

1. User opens create invoice form
2. Selects currency from dropdown (TZS or USD)
3. All amounts display in selected currency
4. Invoice is saved with selected currency
5. PDF and detail page show correct currency

### Editing Invoice:

1. User clicks "Edit Invoice"
2. Form loads with existing currency
3. User can change currency if needed
4. All amounts update to show new currency
5. Invoice updates with new currency

## Features

✅ Currency selector with TZS and USD options
✅ Default currency: TZS (Tanzanian Shilling)
✅ USD option for international clients
✅ Dynamic currency display in all totals
✅ Currency saved to database
✅ Currency loads when editing
✅ Currency shown in PDF invoices
✅ Currency shown in invoice detail page

## UI Changes

### Before:

```
[VAT Rate]  [Discount (TZS)]

Subtotal: TZS 100,000.00
Total: TZS 100,000.00
```

### After:

```
[Currency]  [VAT Rate]  [Discount (TZS/USD)]

Subtotal: TZS 100,000.00  (or USD 50.00)
Total: TZS 100,000.00     (or USD 50.00)
```

## Usage

### For Local Clients (Tanzania):

- Select "TZS (Tanzanian Shilling)"
- Enter amounts in Tanzanian Shillings
- Invoice displays TZS

### For International Clients:

- Select "USD (US Dollar)"
- Enter amounts in US Dollars
- Invoice displays USD

## Benefits

1. **International Support**: Can invoice foreign clients in USD
2. **Flexibility**: Easy to switch between currencies
3. **Clear Display**: Currency shown everywhere
4. **Professional**: Proper currency formatting
5. **Database Stored**: Currency preserved in database

## Testing

Test the feature:

```bash
1. Create new invoice
2. Select USD from currency dropdown
3. Enter item prices in USD
4. Verify totals show USD
5. Save invoice
6. View invoice detail - should show USD
7. Print PDF - should show USD
8. Edit invoice - currency selector should show USD
```

## Database

Currency is stored in the `Invoice` model:

```prisma
model Invoice {
  // ...
  currency String @default("TZS")
  // ...
}
```

## Status

✅ **COMPLETE AND READY TO USE**

International clients can now be invoiced in USD!
