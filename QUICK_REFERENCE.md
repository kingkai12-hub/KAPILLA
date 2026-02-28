# Quick Reference Guide

## Session Management

### Timeout Settings

- **Default Timeout**: 30 minutes of inactivity
- **Location**: `lib/session-manager.ts`
- **To Change**: Modify `SESSION_TIMEOUT` constant

### How It Works

1. User logs in → Session starts
2. User activity tracked (clicks, scrolls, typing)
3. After 30 minutes of no activity → Auto logout
4. User redirected to login page with timeout message

### Manual Logout

- Click "Sign Out" button in sidebar
- Clears all session data
- Redirects to home page
- Cannot go back to portal without re-login

## Navigation Flow

### Public User:

```
Home Page → Track Shipment → View Results
         → Request Pickup
         → Staff Login (if needed)
```

### Staff User:

```
Login → Dashboard → Various Portal Pages
      → Logout → Home Page (cannot go back without login)
```

### Shared Links:

```
/shipments/KPL-1234 → Redirects to → /?waybill=KPL-1234
```

## Performance

### Database Queries

```typescript
// Use cached queries for frequently accessed data
import { cachedQuery } from '@/lib/db-optimized';

const data = await cachedQuery(
  'shipments-list',
  () => db.shipment.findMany(),
  60000 // 1 minute cache
);
```

### API Requests

```typescript
// Deduplicate concurrent requests
import { requestDeduplicator } from '@/lib/performance-monitor';

const data = await requestDeduplicator.deduplicate('shipment-123', () =>
  fetch('/api/shipments/123')
);
```

### Debounce Search

```typescript
import { debounce } from '@/lib/performance-monitor';

const debouncedSearch = debounce((term) => {
  // Search logic
}, 300);
```

## Testing

### Load Test

```bash
# Default: 25 users, 60 seconds
node scripts/test-concurrent-users.js

# Custom
NUM_USERS=30 TEST_DURATION=120 node scripts/test-concurrent-users.js
```

### Health Checks

```bash
# System health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db
```

## Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Touch Targets

- Minimum 44x44px on mobile
- Use `min-h-[44px] min-w-[44px]` in Tailwind

### Font Sizes

- Mobile inputs: 16px minimum (prevents iOS zoom)
- Body text: 14px-16px
- Headings: Scale appropriately

## Common Tasks

### Add New Protected Route

1. Add to `app/staff/(portal)/` directory
2. Middleware automatically protects it
3. Add to navigation in `layout.tsx`

### Clear User Session

```typescript
import { clearSession } from '@/lib/session-manager';
clearSession();
```

### Invalidate Cache

```typescript
import { invalidateCache } from '@/lib/db-optimized';

// Clear all cache
invalidateCache();

// Clear specific pattern
invalidateCache('shipments');
```

### Monitor Performance

```typescript
import { performanceMonitor } from '@/lib/performance-monitor';

// Get summary
const summary = performanceMonitor.getSummary();
console.log(summary);
```

## Troubleshooting

### Session expires too quickly

- Check `SESSION_TIMEOUT` in `lib/session-manager.ts`
- Verify activity events are firing
- Check browser console for errors

### Performance issues

1. Run load test to identify bottlenecks
2. Check database query times
3. Enable Redis caching
4. Review slow operation logs

### Mobile display issues

1. Test on actual devices
2. Check viewport meta tags
3. Verify touch target sizes
4. Use browser dev tools mobile emulation

### Users can't log back in

1. Clear browser cache and cookies
2. Check database connection
3. Verify environment variables
4. Check API logs for errors

## Environment Variables

### Required

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=your-secret-key
```

### Optional (Performance)

```env
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

## Security Checklist

- ✅ Session timeout enabled
- ✅ CSRF protection active
- ✅ Security headers configured
- ✅ Rate limiting enabled
- ✅ Input validation on all forms
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection headers

## Performance Targets

### Response Times

- API: < 500ms average
- Database: < 100ms per query
- Page Load: < 2s

### Success Rates

- API: > 99%
- Database: > 99.9%
- Overall: > 99%

### Concurrent Users

- Tested: 25 users
- Target: 20+ users
- Max Recommended: 50 users (without Redis)

## Next Steps

### For Better Performance

1. Enable Redis caching
2. Add database indexes
3. Optimize slow queries
4. Use CDN for static assets

### For More Users

1. Deploy multiple instances
2. Use load balancer
3. Add database read replicas
4. Implement distributed caching

### For Better Monitoring

1. Add APM tool (New Relic, Datadog)
2. Set up error tracking (Sentry)
3. Configure alerts
4. Create dashboards
