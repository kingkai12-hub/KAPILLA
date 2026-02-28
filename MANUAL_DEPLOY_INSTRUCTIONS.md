# MANUAL DEPLOYMENT INSTRUCTIONS

## Tatizo
Vercel haioni deployment automatically baada ya push.

## Suluhisho - Deploy Manually

### Option 1: Vercel Dashboard (EASIEST)
1. Nenda: https://vercel.com/kaisis-projects/kapilla
2. Click **"Deployments"** tab
3. Click **"..."** (three dots) kwenye latest deployment
4. Click **"Redeploy"**
5. Confirm deployment

### Option 2: Vercel CLI
```bash
cd kapilla-logistics
npx vercel --prod
```

### Option 3: Check Git Integration
1. Nenda: https://vercel.com/kaisis-projects/kapilla/settings/git
2. Hakikisha:
   - ✅ Git Integration iko connected
   - ✅ Production Branch = "main"
   - ✅ Auto Deploy iko ON

### Option 4: Reconnect GitHub
1. Nenda: https://vercel.com/kaisis-projects/kapilla/settings/git
2. Click **"Disconnect"**
3. Click **"Connect Git Repository"**
4. Select: kingkai12-hub/KAPILLA
5. Branch: main

## Critical Changes That Need Deployment
- ✅ Cron schedule: `* * * * *` (every minute)
- ✅ Delivery note header matches invoice
- ✅ Autonomous tracking system ready

## After Deployment
Magari yatasafiri automatically kila dakika!
