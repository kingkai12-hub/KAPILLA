# Invoice System - Complete Implementation

## Overview
Complete invoice management system with proforma invoices that can be converted to final invoices. Includes automatic calculations, TZS currency support, and professional printing.

## Features

### 1. Proforma Invoices
- Create proforma invoices for customer quotes
- Set validity period
- Mark as accepted when customer approves
- Convert to final invoice with one click

### 2. Final Invoices
- Create final invoices directly
- Or convert from accepted proforma invoices
- Track payment status
- Professional print layout

### 3. Automatic Calculations
- **Unit Price × Quantity = Amount** (per item)
- **Subtotal** = Sum of all item amounts
- **VAT** = Subtotal × Tax Rate (default 18%)
- **Grand Total** = Subtotal + VAT - Discount
- All calculations happen in real-time as you type

### 4. TZS Currency
- All amounts in Tanzanian Shillings (TZS)
- Proper number formatting with commas
- Two decimal places for accuracy

## How to Use

### Creating a Proforma Invoice

1. **Navigate to Invoices**
   - Go to Staff Portal → Invoices
   - Click "Create Invoice"

2. **Select Invoice Type**
   - Choose "Proforma Invoice"

3. **Fill Customer Details**
   - Customer Name (required)
   - Email, Phone, Address
   - TIN (Tax Identification Number)

4. **Add Items**
   - Click "Add Item" to add more rows
   - Fill in:
     - Description (e.g., "Freight from Dar to Mbeya")
     - Quantity (e.g., 5)
     - Unit Price (e.g., 50000)
   - Amount calculates automatically (Quantity × Unit Price)

5. **Set Tax and Discount**
   - VAT Rate: Default 18% (can change)
   - Discount: Optional discount amount in TZS
   - Grand Total updates automatically

6. **Additional Details**
   - Valid Until: When proforma expires
   - Due Date: Payment due date
   - Notes: Any additional information
   - Terms: Payment terms and conditions

7. **Create**
   - Click "Create Proforma Invoice"
   - Invoice is saved with status "DRAFT"

### Accepting a Proforma Invoice

1. **Open Proforma Invoice**
   - Go to Invoices list
   - Click "View" on the proforma

2. **Accept**
   - Click "Accept" button
   - Status changes to "ACCEPTED"
   - Now ready to convert to final invoice

### Converting to Final Invoice

1. **Open Accepted Proforma**
   - Must be in "ACCEPTED" status

2. **Convert**
   - Click "Convert to Invoice" button
   - Confirm the conversion

3. **Final Invoice Created**
   - New invoice number generated (INV-XXXX)
   - All details copied from proforma
   - Status set to "SENT"
   - Original proforma remains for reference

### Creating a Final Invoice Directly

1. **Navigate to Create Invoice**
   - Click "Create Invoice"

2. **Select "Final Invoice"**
   - Choose "Final Invoice" radio button

3. **Fill Details**
   - Same process as proforma
   - No "Valid Until" field (not needed for final invoices)

4. **Create**
   - Invoice created with status "DRAFT"
   - Can mark as "SENT", "PAID", etc.

### Printing Invoices

1. **Open Invoice**
   - Click "View" on any invoice

2. **Print**
   - Click "Print" button
   - Browser print dialog opens
   - Professional layout with:
     - Company logo and details
     - Invoice number and dates
     - Customer information
     - Itemized list
     - Calculations (Subtotal, VAT, Total)
     - Notes and terms
     - Footer with contact info

## Invoice Statuses

### Proforma Invoice Statuses
- **DRAFT**: Just created, not sent yet
- **SENT**: Sent to customer for approval
- **ACCEPTED**: Customer accepted, ready to convert
- **CANCELLED**: Proforma cancelled

### Final Invoice Statuses
- **DRAFT**: Created but not sent
- **SENT**: Sent to customer
- **PAID**: Payment received
- **CANCELLED**: Invoice cancelled

## Invoice Numbers

### Proforma Invoices
- Format: `PI-YYYY####`
- Example: `PI-20260001`, `PI-20260002`
- PI = Proforma Invoice
- YYYY = Year
- #### = Sequential number (padded to 4 digits)

### Final Invoices
- Format: `INV-YYYY####`
- Example: `INV-20260001`, `INV-20260002`
- INV = Invoice
- YYYY = Year
- #### = Sequential number (padded to 4 digits)

## Calculation Examples

### Example 1: Simple Invoice
```
Item 1: Freight Service
Quantity: 1
Unit Price: 100,000 TZS
Amount: 100,000 TZS

Subtotal: 100,000 TZS
VAT (18%): 18,000 TZS
Discount: 0 TZS
GRAND TOTAL: 118,000 TZS
```

### Example 2: Multiple Items with Discount
```
Item 1: Freight Dar to Mbeya
Quantity: 2
Unit Price: 50,000 TZS
Amount: 100,000 TZS

Item 2: Packaging Service
Quantity: 5
Unit Price: 5,000 TZS
Amount: 25,000 TZS

Item 3: Insurance
Quantity: 1
Unit Price: 10,000 TZS
Amount: 10,000 TZS

Subtotal: 135,000 TZS
VAT (18%): 24,300 TZS
Discount: 5,000 TZS
GRAND TOTAL: 154,300 TZS
```

## Database Schema

### Invoice Table
```sql
- id: Unique identifier
- invoiceNumber: PI-XXXX or INV-XXXX
- type: PROFORMA or FINAL
- status: DRAFT, SENT, ACCEPTED, PAID, CANCELLED
- proformaInvoiceId: Link to proforma (for final invoices)
- customerName, customerEmail, customerPhone, customerAddress, customerTIN
- issueDate, dueDate, validUntil
- subtotal, taxRate, taxAmount, discount, total
- currency: TZS
- notes, terms
- createdAt, updatedAt
```

### InvoiceItem Table
```sql
- id: Unique identifier
- invoiceId: Link to invoice
- description: Item description
- quantity: Number of units
- unitPrice: Price per unit
- amount: quantity × unitPrice
- order: Display order
```

## API Endpoints

### GET /api/invoices
Get all invoices
- Query params: `?type=PROFORMA` or `?type=FINAL`
- Returns: Array of invoices with items

### POST /api/invoices
Create new invoice
- Body: Invoice data with items array
- Returns: Created invoice

### GET /api/invoices/[id]
Get single invoice
- Returns: Invoice with items and related data

### PATCH /api/invoices/[id]
Update invoice
- Body: Fields to update (status, etc.)
- Returns: Updated invoice

### DELETE /api/invoices/[id]
Delete invoice
- Returns: Success confirmation

### POST /api/invoices/[id]/convert
Convert proforma to final invoice
- Only works for ACCEPTED proforma invoices
- Returns: New final invoice

## File Structure

```
app/
├── api/
│   └── invoices/
│       ├── route.ts                    # List & create invoices
│       └── [id]/
│           ├── route.ts                # Get, update, delete invoice
│           └── convert/
│               └── route.ts            # Convert proforma to final
└── staff/
    └── (portal)/
        └── invoices/
            ├── page.tsx                # Invoice list
            ├── create/
            │   └── page.tsx            # Create invoice form
            └── [id]/
                └── page.tsx            # Invoice detail & print

prisma/
├── schema.prisma                       # Invoice & InvoiceItem models
└── migrations/
    └── add_invoices.sql                # Database migration
```

## Workflow Diagram

```
1. CREATE PROFORMA INVOICE
   ↓
2. SEND TO CUSTOMER (status: SENT)
   ↓
3. CUSTOMER REVIEWS
   ↓
4. ACCEPT PROFORMA (status: ACCEPTED)
   ↓
5. CONVERT TO FINAL INVOICE
   ↓
6. SEND FINAL INVOICE (status: SENT)
   ↓
7. RECEIVE PAYMENT
   ↓
8. MARK AS PAID (status: PAID)
```

## Tips & Best Practices

### 1. Use Proforma for Quotes
- Always create proforma first for customer approval
- Set realistic validity period (e.g., 30 days)
- Include detailed item descriptions

### 2. Accurate Descriptions
- Be specific: "Freight from Dar es Salaam to Mbeya (850 km)"
- Not: "Freight service"

### 3. VAT Compliance
- Default 18% VAT is standard in Tanzania
- Adjust if customer is VAT-exempt
- Keep TIN records for compliance

### 4. Payment Terms
- Standard: "Payment due within 30 days"
- For proforma: "Payment required before service"
- Be clear about payment methods

### 5. Professional Notes
Good examples:
- "Thank you for choosing Kapilla Group Ltd"
- "Please reference invoice number when making payment"
- "Contact us for any questions or concerns"

### 6. Regular Backups
- Invoices are financial records
- Keep backups of database
- Export important invoices to PDF

## Troubleshooting

### Issue: Calculations Not Updating
**Solution**: Refresh the page, calculations are automatic

### Issue: Can't Convert Proforma
**Problem**: Proforma must be ACCEPTED status
**Solution**: Click "Accept" button first

### Issue: Invoice Number Duplicate
**Problem**: Database issue
**Solution**: System auto-generates unique numbers, contact support

### Issue: Print Layout Broken
**Solution**: Use Chrome or Edge browser for best print results

## Future Enhancements

### Possible Additions
1. **Email Invoices**: Send invoices directly to customer email
2. **PDF Export**: Download invoices as PDF
3. **Payment Tracking**: Record partial payments
4. **Recurring Invoices**: Auto-generate monthly invoices
5. **Invoice Templates**: Multiple design templates
6. **Multi-Currency**: Support USD, EUR, etc.
7. **Invoice Reminders**: Auto-remind customers of due invoices
8. **Credit Notes**: Issue refunds and credits

## Status

✅ **COMPLETE** - Ready for production use

The invoice system is fully functional with:
- Proforma and final invoices
- Automatic calculations
- TZS currency support
- Professional printing
- Status tracking
- Conversion workflow

All features tested and working correctly.
