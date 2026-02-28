# Fix Login Error - Quick Steps

## The Problem

You're getting "Internal Server Error" when trying to log in on the deployed site.

## Quick Diagnosis

### Step 1: Check if Database is Connected

Open this URL in your browser (replace with your actual domain):

```
https://your-site.vercel.app/api/health/db
```

If you see `"canConnect": false`, the database isn't connecting.

### Step 2: Check Vercel Logs

1. Go to https://vercel.com
2. Click on your project (kapilla-logistics)
3. Click "Deployments"
4. Click on the latest deployment
5. Click "Functions" tab
6. Look for errors related to `/api/auth/login`

## Most Likely Fix: Environment Variables

### Go to Vercel Dashboard:

1. Open https://vercel.com
2. Select your project
3. Go to Settings → Environment Variables
4. Check if `DATABASE_URL` exists
5. If it exists, make sure it has `?pgbouncer=true` at the end

### Correct DATABASE_URL format:

```
postgresql://user:password@host:port/database?pgbouncer=true
```

## If DATABASE_URL is Missing or Wrong:

1. Get your database URL from Supabase:
   - Go to Supabase Dashboard
   - Click on your project
   - Go to Settings → Database
   - Copy "Connection string" (Transaction mode)
   - Add `?pgbouncer=true` at the end

2. Add it to Vercel:
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Click "Add New"
   - Name: `DATABASE_URL`
   - Value: Your connection string with `?pgbouncer=true`
   - Select all environments (Production, Preview, Development)
   - Click "Save"

3. Redeploy:
   ```bash
   git commit --allow-empty -m "Trigger redeploy after env update"
   git push origin main
   ```

## Alternative: Redeploy from Vercel

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click the three dots (...) on the latest deployment
5. Click "Redeploy"
6. Select "Use existing Build Cache" = NO
7. Click "Redeploy"

## Test After Fix

1. Wait for deployment to complete (2-3 minutes)
2. Try logging in again
3. If still failing, check `/api/health/db` endpoint

## Still Not Working?

Check the Vercel function logs:

1. Vercel Dashboard → Deployments → Latest → Functions
2. Find `/api/auth/login`
3. Look at the error message
4. Share the error message for more specific help

## Common Issues:

### "Prisma Client not initialized"

**Fix:** Redeploy with fresh build (no cache)

### "Connection timeout"

**Fix:** Check if Supabase database is running and accessible

### "Invalid credentials"

**Fix:** This means login is working! Just wrong username/password

### "Too many login attempts"

**Fix:** Wait 15 minutes and try again (rate limiting)
