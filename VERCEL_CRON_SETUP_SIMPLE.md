# 🎯 SIMPLE VERCEL CRON SETUP

**Problem:** You see "Get Started" guide in Cron Jobs tab, but no button to create cron job.

**Why:** Vercel needs a deployment FIRST before it creates cron jobs automatically.

---

## ✅ STEP 1: DEPLOY YOUR CODE

Your code is already on GitHub. Now deploy it to Vercel:

### Go to Vercel Dashboard:
```
https://vercel.com/dashboard
```

### Click Your Project Name

### Click "Deployments" Tab (top menu)

### You Should See Old Deployments

### Click the THREE DOTS (...) on the Latest Deployment

### Click "Redeploy"

### Wait 2-3 Minutes for Build

---

## ✅ STEP 2: CRON JOB WILL APPEAR AUTOMATICALLY

After deployment succeeds:

1. **Go to "Cron Jobs" Tab**
2. **You will see:**
   - Path: `/api/cron/update-vehicles`
   - Schedule: `* * * * *` (every minute)
   - Status: Active ✅

**NO NEED TO CREATE MANUALLY!** Vercel reads your `vercel.json` file and creates it automatically.

---

## ✅ STEP 3: ADD SECURITY (IMPORTANT)

After cron job appears:

1. **Go to Settings → Environment Variables**

2. **Click "Add New"**

3. **Add:**
   - Key: `CRON_SECRET`
   - Value: `kapilla-secret-2026` (or any random string)
   - Environment: Production

4. **Click "Save"**

5. **Redeploy Again** (to apply the new variable)

---

## 🎉 DONE!

After these 3 steps:
- ✅ Cron job will run every minute
- ✅ Vehicles will move automatically
- ✅ System works 24/7
- ✅ No need to be online

---

## 📝 SUMMARY:

1. **Deploy** → Vercel creates cron job automatically
2. **Add CRON_SECRET** → Security
3. **Test** → Create shipment and wait 1 minute

**Time needed: 5 minutes total**

---

## ❓ IF YOU DON'T SEE "REDEPLOY" BUTTON:

Try this instead:

1. **Go to Deployments Tab**
2. **Click "Deploy" Button** (top right corner)
3. **Select:**
   - Branch: `main`
   - Click "Deploy"
4. **Wait for build**

---

**The cron job configuration is already in your code (`vercel.json`). Vercel will create it automatically after deployment!**
