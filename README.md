# Kapilla Logistics Management System

A comprehensive, modern logistics management system for tracking shipments, managing staff, and handling documents with real-time updates.

## ✨ Features

### Core Functionality
- **Public Tracking**: Real-time shipment tracking via waybill number
- **Staff Portal**: Secure dashboard for managing shipments and operations
- **Waybill Generation**: Printable waybills with QR codes
- **Proof of Delivery (POD)**: Digital signature capture for deliveries
- **Document Management**: Secure file storage and organization
- **Real-time Updates**: Live tracking with vehicle location updates
- **Dark Mode**: Full dark mode support throughout the application

### Professional Features
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Audit Logging**: Complete audit trail of all system actions
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Caching**: Redis-based caching for optimal performance
- **PWA Support**: Install as a mobile/desktop app
- **Monitoring**: Built-in analytics and performance monitoring
- **Testing**: Comprehensive unit and E2E test coverage
- **CI/CD**: Automated testing and deployment pipeline

## 🚀 Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Secure cookie-based auth with bcrypt
- **Styling**: Tailwind CSS 4
- **Real-time**: Socket.io for live updates
- **Maps**: Leaflet for vehicle tracking
- **Testing**: Vitest + Playwright
- **Monitoring**: Vercel Analytics + Winston logging
- **Caching**: Redis (optional, with in-memory fallback)

## 📋 Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (or Supabase account)
- Redis (optional, for production caching)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-org/kapilla-logistics.git
cd kapilla-logistics
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct database connection (for migrations)
- `REDIS_URL`: Redis connection (optional)
- See `.env.example` for all options

### 4. Push database schema
```bash
npm run db:push
```

### 5. Seed the database (optional)
```bash
npm run db:seed
```

### 6. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI

### Database
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add environment variables from `.env.example`
   - Deploy

3. **Set up database**
   - Create a Supabase project at [database.new](https://database.new)
   - Copy connection strings to Vercel environment variables
   - Run `npm run db:push` locally to create tables

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- **API Documentation**: Visit `/swagger` when running the app
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Security**: See [SECURITY.md](./SECURITY.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 Security Features

- Password hashing with bcrypt
- Rate limiting on sensitive endpoints
- CSRF protection
- Security headers (CSP, X-Frame-Options, etc.)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Audit logging
- Secure session management

## 🧪 Testing

The project includes comprehensive testing:

- **Unit Tests**: Test individual functions and components
- **E2E Tests**: Test complete user workflows
- **Coverage**: Aim for >80% code coverage

Run all tests before submitting PRs:
```bash
npm run lint && npm run type-check && npm run test && npm run test:e2e
```

## 📊 Monitoring

- **Analytics**: Vercel Analytics for user insights
- **Performance**: Speed Insights for Core Web Vitals
- **Logging**: Winston for structured logging
- **Audit Trail**: Complete audit log of all actions

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
- Create a GitHub issue
- Email: support@kapilla-logistics.com

## 🙏 Acknowledgments

Built with modern web technologies and best practices for enterprise-grade logistics management.

---

Made with ❤️ by the Kapilla Logistics Team
