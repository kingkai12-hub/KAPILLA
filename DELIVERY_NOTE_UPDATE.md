# Delivery Note Header Update

## Changes Made (2026-02-27)

The delivery note header has been updated to match the invoice header exactly:

### Header Specifications

- **Logo Size**: 40mm x 25mm (no shrinking)
- **Logo Position**: (10, 12.5)
- **Company Name**: Font size 11, bold, at position (55, 18)
- **Company Details**: Font size 8, gray color (80,80,80), starting at x=55
- **Header Background**: White with black border line at 50mm

### Files Modified

- `app/api/invoices/[id]/delivery-note/route.ts`

### Verification

After deployment, generate a delivery note PDF and compare it with an invoice PDF. The headers should be identical in:

- Logo size and positioning
- Company name font size and position
- Company details font size and color
- Overall header layout

## Deployment

Push to main branch triggers automatic Vercel deployment.
