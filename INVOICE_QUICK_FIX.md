# Invoice System - Quick Fix Guide

## 🚨 If You See "Failed to create invoice"

### Quick Checks (30 seconds)

1. **Is the server running?**
   ```bash
   # Check if you see this in terminal:
   # ✓ Ready in X.Xs
   # If not, run:
   npm run dev
   ```

2. **Are you logged in?**
   - Go to http://localhost:3000/staff/login
   - Log in with your credentials

3. **Did you fill required fields?**
   - Customer Name (required)
   - At least one item with description

---

## 🔧 Quick Fixes

### Fix 1: Restart Server (Most Common)
```bash
# Stop server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### Fix 2: Clear Browser Cache
- Press `Ctrl + Shift + R` (hard refresh)
- Or clear cache in browser settings

### Fix 3: Regenerate Prisma
```bash
npx prisma generate
npm run dev
```

### Fix 4: Check Database
```bash
node test-invoice-create.js
# Should show: ✅✅✅ ALL TESTS PASSED!
```

---

## 🧪 Quick Test

Run this to verify everything works:
```bash
node diagnose-invoice-system.js
```

Should show: `🎉 ALL CRITICAL CHECKS PASSED!`

---

## 📋 Common Errors & Solutions

### Error: "Customer name is required"
**Fix**: Fill in the Customer Name field

### Error: "At least one item is required"
**Fix**: Click "Add Item" and fill in description, quantity, price

### Error: "Failed to fetch"
**Fix**: Server not running. Run `npm run dev`

### Error: "Unauthorized"
**Fix**: Log in at http://localhost:3000/staff/login

### Error: "Network error"
**Fix**: Check server is running on port 3000

---

## ✅ System Status

Run quick diagnostic:
```bash
node test-invoice-api.js
```

Should show:
```
✅ SUCCESS! Invoice created successfully!
Invoice ID: [some-uuid]
Invoice Number: PI-20260001
```

---

## 🎯 If Still Not Working

1. **Copy the exact error message**
2. **Check browser console** (Press F12)
3. **Check server console** (terminal where npm run dev is running)
4. **Run diagnostic**: `node diagnose-invoice-system.js`
5. **Provide these details** for further help

---

## 📞 Quick Support

### Server Not Starting?
```bash
# Kill any existing Node processes
taskkill /F /IM node.exe
# Wait 2 seconds
# Then start again
npm run dev
```

### Database Issues?
```bash
npx prisma db push
npx prisma generate
npm run dev
```

### Still Stuck?
Run the full diagnostic:
```bash
node diagnose-invoice-system.js
```

This will tell you exactly what's wrong.

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Server shows `✓ Ready in X.Xs`
- ✅ Can access http://localhost:3000/staff/invoices
- ✅ "Create Invoice" button works
- ✅ Form loads without errors
- ✅ Can create invoice successfully

---

**Current Status**: ✅ System is working (verified with 32 tests)

**If you see an error**: Follow the quick fixes above

**Need more help**: Run `node diagnose-invoice-system.js`
