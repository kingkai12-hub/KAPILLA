# Quick Start Guide

Get your Kapilla Logistics system up and running in 5 minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ npm installed (`npm --version`)
- ✅ Git installed (`git --version`)
- ✅ PostgreSQL database or Supabase account

## 🚀 5-Minute Setup

### Step 1: Clone & Install (2 minutes)
```bash
# Clone the repository
git clone <your-repo-url>
cd kapilla-logistics

# Install dependencies
npm install
```

### Step 2: Configure Environment (1 minute)
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
# Minimum required:
# - DATABASE_URL
# - DIRECT_URL
```

**Quick Supabase Setup**:
1. Go to [database.new](https://database.new)
2. Create a new project
3. Go to Settings → Database
4. Copy "Connection string" to DATABASE_URL
5. Copy "Direct connection" to DIRECT_URL

### Step 3: Setup Database (1 minute)
```bash
# Push database schema
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### Step 4: Start Development Server (30 seconds)
```bash
npm run dev
```

### Step 5: Open Browser (30 seconds)
Open [http://localhost:3000](http://localhost:3000)

🎉 **You're done!** Your system is running!

---

## 🧪 Verify Installation

Run these commands to ensure everything works:

```bash
# Check linting
npm run lint

# Check types
npm run type-check

# Run tests
npm run test

# Check formatting
npm run format:check
```

All should pass ✅

---

## 👤 Create Admin User

### Option 1: Using Prisma Studio
```bash
npm run db:studio
```
1. Open Prisma Studio (opens in browser)
2. Go to "User" table
3. Click "Add record"
4. Fill in:
   - email: `admin@kapilla.com`
   - password: Use bcrypt hash (see below)
   - role: `ADMIN`
   - name: `Admin User`
5. Save

### Option 2: Using SQL
```sql
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@kapilla.com',
  '$2a$10$YourHashedPasswordHere',
  'Admin User',
  'ADMIN',
  NOW(),
  NOW()
);
```

**Generate Password Hash**:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))"
```

---

## 📱 Access Points

### Public Pages
- **Homepage**: http://localhost:3000
- **Tracking**: http://localhost:3000/?waybill=KPL-2024-000001
- **API Docs**: http://localhost:3000/swagger

### Staff Portal
- **Login**: http://localhost:3000/staff
- **Dashboard**: http://localhost:3000/staff/dashboard
- **Admin Panel**: http://localhost:3000/staff/admin

### API Endpoints
- **Health Check**: http://localhost:3000/api/health
- **API Docs JSON**: http://localhost:3000/api/docs

---

## 🔧 Common Issues & Solutions

### Issue: Database Connection Error
**Solution**:
```bash
# Check your DATABASE_URL format
# Should be: postgresql://user:password@host:port/database

# Test connection
npm run db:push
```

### Issue: Port 3000 Already in Use
**Solution**:
```bash
# Use different port
PORT=3001 npm run dev
```

### Issue: Prisma Client Not Generated
**Solution**:
```bash
npx prisma generate
npm run dev
```

### Issue: Module Not Found
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript Errors
**Solution**:
```bash
# Regenerate types
npm run type-check
npx prisma generate
```

---

## 🎯 Next Steps

### For Development
1. **Read Documentation**
   - [README.md](./README.md) - Full documentation
   - [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
   - [UPGRADE_SUMMARY.md](./UPGRADE_SUMMARY.md) - What's new

2. **Explore Features**
   - Create a test shipment
   - Track a shipment
   - Upload documents
   - Try dark mode

3. **Run Tests**
   ```bash
   npm run test:watch
   npm run test:e2e:ui
   ```

### For Production
1. **Configure Services**
   - Set up Redis for caching
   - Configure email (SMTP)
   - Set up SMS (Twilio)
   - Add monitoring (Sentry)

2. **Deploy**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy!

3. **Monitor**
   - Check Vercel Analytics
   - Review error logs
   - Monitor performance

---

## 📚 Useful Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
```

### Database
```bash
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:coverage # Coverage report
```

### Code Quality
```bash
npm run lint         # Check code
npm run format       # Format code
npm run type-check   # Check types
```

---

## 🆘 Get Help

### Documentation
- [README.md](./README.md) - Complete guide
- [API Docs](http://localhost:3000/swagger) - API reference
- [SECURITY.md](./SECURITY.md) - Security info

### Support
- **Issues**: Create a GitHub issue
- **Email**: support@kapilla-logistics.com
- **Security**: security@kapilla-logistics.com

---

## ✅ Checklist

Before going to production, ensure:

- [ ] Database is configured and accessible
- [ ] Environment variables are set
- [ ] Admin user is created
- [ ] Tests are passing
- [ ] Build succeeds (`npm run build`)
- [ ] Security headers are enabled
- [ ] Rate limiting is configured
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] Domain is configured (if applicable)

---

**Happy coding! 🚀**

Need help? Check [UPGRADE_SUMMARY.md](./UPGRADE_SUMMARY.md) for detailed information about all features.
