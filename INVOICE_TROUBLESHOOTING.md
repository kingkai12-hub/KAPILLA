# Invoice System Troubleshooting

## Error: "Failed to create invoice"

This error occurs when the database tables haven't been created yet.

### Solution (Already Fixed!)

The database tables have been created successfully. The system is now ready to use.

### What Was Done

1. ✅ Stopped all Node.js processes
2. ✅ Pushed schema to database (`npx prisma db push`)
3. ✅ Generated Prisma client (`npx prisma generate`)

### Verify Setup

Run this command to check if tables exist:

```bash
npx prisma studio
```

You should see:
- Invoice table
- InvoiceItem table

### Test the System

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Access Invoices**
   - Go to http://localhost:3000/staff/invoices
   - Click "Create Invoice"

3. **Create Test Invoice**
   - Customer Name: "Test Customer"
   - Add item: "Test Service", Qty: 1, Price: 10000
   - Click "Create Proforma Invoice"
   - Should work now!

## Common Errors & Solutions

### Error: "Table Invoice does not exist"

**Cause**: Database tables not created

**Solution**:
```bash
npx prisma db push
```

### Error: "Cannot find module '@prisma/client'"

**Cause**: Prisma client not generated

**Solution**:
```bash
# Stop dev server first
taskkill /F /IM node.exe

# Generate client
npx prisma generate

# Restart dev server
npm run dev
```

### Error: "EPERM: operation not permitted"

**Cause**: File is locked by running process

**Solution**:
```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Wait 2 seconds
# Then run the command again
npx prisma generate
```

### Error: "Database connection failed"

**Cause**: DATABASE_URL not configured

**Solution**:
1. Check `.env` file exists
2. Verify DATABASE_URL is set
3. Test connection: `npx prisma db pull`

### Invoice Page Shows "Loading..." Forever

**Cause**: API route error

**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. Verify database connection
4. Restart dev server

### Calculations Not Working

**Cause**: JavaScript error in form

**Solution**:
1. Open browser console (F12)
2. Check for errors
3. Refresh the page
4. Clear browser cache

### Print Layout Broken

**Cause**: CSS not loading or browser compatibility

**Solution**:
1. Use Chrome or Edge browser
2. Clear browser cache
3. Try print preview (Ctrl+P)

### Invoice Number Not Generating

**Cause**: Database sequence issue

**Solution**:
- System auto-generates unique numbers
- If duplicate, contact support
- Check database for existing invoices

## Verification Checklist

After setup, verify these work:

- [ ] Can access /staff/invoices page
- [ ] Can click "Create Invoice"
- [ ] Can fill customer details
- [ ] Can add items
- [ ] Calculations update automatically
- [ ] Can create proforma invoice
- [ ] Can view invoice
- [ ] Can print invoice
- [ ] Can accept proforma
- [ ] Can convert to final invoice

## Database Schema Verification

Run this SQL to check tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Invoice', 'InvoiceItem');
```

Should return:
- Invoice
- InvoiceItem

## API Endpoints Test

Test API endpoints work:

```bash
# List invoices (should return empty array initially)
curl http://localhost:3000/api/invoices

# Should return: []
```

## Browser Console Errors

Common console errors and fixes:

### "Failed to fetch"
- Check dev server is running
- Verify URL is correct
- Check network tab for details

### "Unauthorized"
- Make sure you're logged in
- Check session is valid
- Try logging out and back in

### "500 Internal Server Error"
- Check server console for errors
- Verify database connection
- Check Prisma client is generated

## Still Having Issues?

If problems persist:

1. **Check Server Console**
   - Look for error messages
   - Check database connection
   - Verify Prisma client loaded

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Restart Everything**
   ```bash
   # Stop dev server
   Ctrl+C
   
   # Stop all Node processes
   taskkill /F /IM node.exe
   
   # Regenerate Prisma client
   npx prisma generate
   
   # Restart dev server
   npm run dev
   ```

4. **Clear Cache**
   - Clear browser cache
   - Delete `.next` folder
   - Restart dev server

## Success Indicators

System is working when:

✅ Can access /staff/invoices
✅ "Create Invoice" button works
✅ Form loads without errors
✅ Calculations update in real-time
✅ Can create invoice successfully
✅ Invoice appears in list
✅ Can view and print invoice

## Status

✅ **FIXED** - Database tables created, Prisma client generated

The invoice system is now ready to use. Just restart your development server and try creating an invoice!
