# Production Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] TypeScript checks pass (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)

### Security
- [ ] Environment variables secured (not in code)
- [ ] Database credentials are strong
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] HTTPS enforced in production
- [ ] Sensitive data not logged
- [ ] API keys rotated if needed

### Database
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] Indexes optimized
- [ ] Admin user created
- [ ] Sample data seeded (if needed)

### Environment Variables
- [ ] `DATABASE_URL` set
- [ ] `DIRECT_URL` set
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] Redis URL configured (optional)
- [ ] Email SMTP configured (optional)
- [ ] SMS Twilio configured (optional)
- [ ] Monitoring configured (optional)

### Performance
- [ ] Redis caching enabled (recommended)
- [ ] Image optimization configured
- [ ] CDN configured (if applicable)
- [ ] Compression enabled
- [ ] Static assets optimized

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled
- [ ] Error logging configured
- [ ] Uptime monitoring set up
- [ ] Alert notifications configured

### Documentation
- [ ] README.md updated
- [ ] API documentation accessible
- [ ] Environment variables documented
- [ ] Deployment process documented

---

## 🚀 Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git status

# Push to main branch
git push origin main
```

### 2. Vercel Deployment

#### First Time Setup
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./kapilla-logistics` (if in subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

**Required**:
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Optional (Recommended)**:
```
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Optional (Email)**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

**Optional (SMS)**:
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

**Optional (Monitoring)**:
```
SENTRY_DSN=https://...
```

4. Click "Deploy"

### 3. Database Setup

#### Supabase
1. Go to [database.new](https://database.new)
2. Create new project
3. Wait for provisioning
4. Go to Settings → Database
5. Copy connection strings:
   - Transaction pooler → `DATABASE_URL`
   - Direct connection → `DIRECT_URL`
6. Add to Vercel environment variables
7. Redeploy

#### Run Migrations
```bash
# From local machine with production DATABASE_URL
npm run db:push
```

### 4. Post-Deployment Verification

#### Automated Checks
```bash
# Health check
curl https://your-domain.vercel.app/api/health

# API docs
curl https://your-domain.vercel.app/api/docs
```

#### Manual Checks
- [ ] Homepage loads
- [ ] Tracking works
- [ ] Staff login works
- [ ] Admin panel accessible
- [ ] API documentation loads
- [ ] Dark mode works
- [ ] Mobile responsive
- [ ] PWA installable

#### Performance Checks
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals pass
- [ ] Page load < 3 seconds
- [ ] API response < 500ms

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain (Optional)
1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records
4. Wait for SSL certificate
5. Update `NEXT_PUBLIC_APP_URL`

### 2. Set Up Monitoring

#### Vercel Analytics
- Automatically enabled
- View in Vercel Dashboard → Analytics

#### Uptime Monitoring
1. Sign up for [UptimeRobot](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTPS
   - URL: `https://your-domain.vercel.app/api/health`
   - Interval: 5 minutes
3. Configure alerts

#### Error Tracking (Optional)
1. Sign up for [Sentry](https://sentry.io)
2. Create new project
3. Copy DSN
4. Add `SENTRY_DSN` to Vercel
5. Redeploy

### 3. Configure Backups

#### Database Backups
- Supabase: Automatic daily backups
- Manual backup:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

#### Code Backups
- GitHub: Automatic
- Additional: Clone to backup location

### 4. Set Up CI/CD

#### GitHub Actions
Already configured in `.github/workflows/ci.yml`

Enable:
1. Go to GitHub → Settings → Actions
2. Enable workflows
3. Add secrets:
   - `DATABASE_URL`
   - `DIRECT_URL`

---

## 📊 Monitoring Dashboard

### Daily Checks
- [ ] Check error logs
- [ ] Review analytics
- [ ] Monitor uptime
- [ ] Check performance metrics

### Weekly Checks
- [ ] Review audit logs
- [ ] Check database size
- [ ] Review user feedback
- [ ] Update dependencies

### Monthly Checks
- [ ] Security audit (`npm audit`)
- [ ] Performance review
- [ ] Database optimization
- [ ] Backup verification
- [ ] Cost review

---

## 🆘 Rollback Procedure

If deployment fails:

### 1. Immediate Rollback
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "..." → "Promote to Production"

### 2. Fix and Redeploy
```bash
# Revert changes
git revert HEAD

# Push fix
git push origin main

# Or fix and commit
git commit -m "fix: resolve deployment issue"
git push origin main
```

### 3. Database Rollback
```bash
# Restore from backup
psql $DATABASE_URL < backup.sql
```

---

## 📞 Support Contacts

### Technical Issues
- **GitHub Issues**: Create an issue
- **Email**: support@kapilla-logistics.com

### Security Issues
- **Email**: security@kapilla-logistics.com
- **See**: [SECURITY.md](./SECURITY.md)

### Emergency
- **On-call**: [Your phone number]
- **Slack**: #kapilla-alerts

---

## ✅ Final Verification

Before marking deployment complete:

- [ ] All checklist items completed
- [ ] Production URL accessible
- [ ] All features working
- [ ] Monitoring active
- [ ] Team notified
- [ ] Documentation updated
- [ ] Backup verified
- [ ] Rollback plan tested

---

## 🎉 Deployment Complete!

Your Kapilla Logistics system is now live in production!

**Next Steps**:
1. Monitor for 24 hours
2. Gather user feedback
3. Plan next iteration
4. Celebrate! 🎊

---

**Deployment Date**: _________________

**Deployed By**: _________________

**Version**: _________________

**Notes**: _________________
