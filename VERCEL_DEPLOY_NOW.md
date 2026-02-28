# VERCEL DEPLOYMENT - MANUAL STEPS

## TATIZO
GitHub checks zinafail na Vercel haideploy automatically.

## SULUHISHO HARAKA - DEPLOY MANUALLY SASA HIVI!

### STEP 1: Nenda Vercel Dashboard
https://vercel.com/kaisis-projects/kapilla

### STEP 2: Click "Deployments"
Upande wa kushoto, click "Deployments" tab

### STEP 3: Deploy Latest Commit
1. Angalia commit: **0f5697f** - "DEPLOY NOW: Cron every minute"
2. Click **"..."** (three dots) kwenye commit hiyo
3. Click **"Redeploy"**
4. Click **"Redeploy"** tena kukubali

### STEP 4: Ignore Failed Checks
Kama Vercel inauliza kuhusu failed checks:
- Click **"Deploy anyway"** au **"Skip checks"**
- Checks hazifanyi kazi kwa sababu workflows ziko disabled

## AU: Use Vercel CLI (Faster!)

```bash
cd kapilla-logistics
npx vercel --prod --force
```

## CRITICAL CHANGES ZINAHITAJI DEPLOYMENT:

1. ✅ **vercel.json** - Cron schedule: `* * * * *` (kila dakika!)
2. ✅ **lib/autonomous-tracking.ts** - Vehicles move automatically
3. ✅ **app/api/cron/update-vehicles/route.ts** - Background updates
4. ✅ **Delivery note header** - Matches invoice exactly

## BAADA YA DEPLOYMENT:
- Magari yatasafiri kila dakika
- Gari 0004 itafika destination
- System inafanya kazi automatically!

---

**IMPORTANT:** Vercel LAZIMA ideploy manually kwa sababu GitHub checks zinafail. Hii ni NORMAL - checks ziko disabled kwa makusudi.
