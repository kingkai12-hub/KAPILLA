# Login Error Diagnosis

## Issue

Getting "Internal Server Error" when trying to log in.

## Possible Causes

### 1. Database Connection Issue

The most likely cause is that the database connection is failing on Vercel.

**Check:**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify `DATABASE_URL` is set correctly
- Make sure it includes `?pgbouncer=true` parameter

### 2. Missing Environment Variables

**Required variables:**

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` or similar auth secret (if used)

### 3. Prisma Client Not Generated

After deployment, Prisma client might not be generated properly.

**Solution:**

- In Vercel, go to Settings → General → Build & Development Settings
- Make sure build command includes: `npx prisma generate && next build`

## Quick Fixes

### Fix 1: Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments"
4. Click on the latest deployment
5. Check the "Functions" tab for error logs
6. Look for `[AUTH_LOGIN]` errors

### Fix 2: Redeploy

Sometimes a simple redeploy fixes the issue:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Fix 3: Check Database Connection

Test if database is accessible:

1. Go to `/api/health/db` endpoint
2. If it returns error, database connection is the issue

### Fix 4: Environment Variables

Make sure these are set in Vercel:

- `DATABASE_URL` - Your Supabase/PostgreSQL connection string
- `NODE_ENV` - Should be "production"

## Testing Locally

To test if login works locally:

```bash
# Make sure database is accessible
npm run dev

# Try logging in at http://localhost:3000/staff/login
```

## Common Error Messages

### "Prisma client not initialized"

- Run: `npx prisma generate`
- Redeploy

### "Database connection failed"

- Check DATABASE_URL in Vercel
- Verify database is running
- Check if IP is whitelisted (for Supabase)

### "User model not found"

- Prisma schema might not be synced
- Run: `npx prisma db push`
- Redeploy

## Immediate Action

1. Check Vercel deployment logs for the actual error
2. Verify DATABASE_URL environment variable
3. Try redeploying
4. If still failing, check `/api/health/db` endpoint

## Contact Support

If none of these work, the error logs from Vercel will show the exact issue.
Look for the `[AUTH_LOGIN]` log entry in the Functions tab.
