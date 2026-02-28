# System Flow Diagrams

## Session Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LOGIN                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Session Manager Starts                                      │
│  - Creates session with 30min timeout                        │
│  - Starts activity tracking                                  │
│  - Sets up event listeners                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  User Activity Loop                                          │
│  ┌──────────────────────────────────────────────┐           │
│  │  User Action (click, type, scroll, touch)    │           │
│  │              ↓                                │           │
│  │  Reset 30-minute timer                       │           │
│  │              ↓                                │           │
│  │  Continue session                            │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Timeout Scenarios                                           │
│                                                              │
│  ┌────────────────────┐      ┌────────────────────┐        │
│  │ 30min No Activity  │      │  Manual Logout     │        │
│  └────────┬───────────┘      └────────┬───────────┘        │
│           │                           │                     │
│           └───────────┬───────────────┘                     │
│                       ▼                                     │
│           ┌───────────────────────┐                        │
│           │  Clear Session Data   │                        │
│           │  - localStorage       │                        │
│           │  - sessionStorage     │                        │
│           │  - Cookies            │                        │
│           └───────────┬───────────┘                        │
│                       ▼                                     │
│           ┌───────────────────────┐                        │
│           │  Redirect to Home     │                        │
│           └───────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Navigation Protection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  USER LOGGED IN                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Staff Portal Access                                         │
│  - Dashboard                                                 │
│  - Shipments                                                 │
│  - Invoices                                                  │
│  - etc.                                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  User Clicks Logout                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Logout Process                                              │
│  1. Stop session manager                                     │
│  2. Clear all session data                                   │
│  3. Call logout API                                          │
│  4. Redirect to home page                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  User on Home Page                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  User Tries to Go Back                                       │
│  (Browser back button)                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware Check                                            │
│  - No auth cookie? ──────────┐                              │
│  - No user ID? ──────────────┤                              │
│                               ▼                              │
│                    ┌──────────────────────┐                 │
│                    │  Redirect to Login   │                 │
│                    │  Cannot access       │                 │
│                    │  portal without auth │                 │
│                    └──────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Shared Link Redirection Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Receives Shared Link                                   │
│  Example: /shipments/KPL-1234                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  User Clicks Link                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware Intercepts                                       │
│  - Detects /shipments/* route                                │
│  - Extracts waybill number (KPL-1234)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Redirect to Home Page                                       │
│  - URL: /?waybill=KPL-1234                                   │
│  - Preserves waybill as query parameter                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Home Page Loads                                             │
│  - Detects waybill query parameter                           │
│  - Automatically triggers search                             │
│  - Shows tracking results                                    │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimization Flow

```
┌─────────────────────────────────────────────────────────────┐
│  API Request Received                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Rate Limiting Check                                         │
│  - Check IP address                                          │
│  - Verify request count                                      │
│  - Within limits? ────Yes───┐                               │
│  - Exceeded? ────No─────────┤                               │
│                              ▼                               │
│                   ┌──────────────────┐                      │
│                   │  Return 429      │                      │
│                   │  Too Many Reqs   │                      │
│                   └──────────────────┘                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Request Deduplication                                       │
│  - Check if identical request in progress                    │
│  - Yes? Return existing promise                              │
│  - No? Continue to next step                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Cache Check                                                 │
│  - Check Redis/Memory cache                                  │
│  - Cache hit? ────Yes───┐                                   │
│  - Cache miss? ──No─────┤                                   │
│                          ▼                                   │
│              ┌───────────────────┐                          │
│              │  Return Cached    │                          │
│              │  Data (Fast!)     │                          │
│              └───────────────────┘                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Query                                              │
│  - Use connection pool                                       │
│  - Execute optimized query                                   │
│  - Measure performance                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Cache Result                                                │
│  - Store in cache with TTL                                   │
│  - Return to client                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Performance Monitoring                                      │
│  - Record response time                                      │
│  - Log slow operations (>1000ms)                             │
│  - Update metrics                                            │
└─────────────────────────────────────────────────────────────┘
```

## Concurrent User Handling

```
┌─────────────────────────────────────────────────────────────┐
│  20+ Users Making Requests Simultaneously                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Load Balancer (if deployed)                                 │
│  - Distributes requests across instances                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js Server Instance                                     │
│  ┌──────────────────────────────────────────────┐           │
│  │  Middleware Layer                            │           │
│  │  - Rate limiting per IP                      │           │
│  │  - Authentication check                      │           │
│  │  - Security headers                          │           │
│  └──────────────┬───────────────────────────────┘           │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────┐           │
│  │  API Route Handler                           │           │
│  │  - Request deduplication                     │           │
│  │  - Cache check                               │           │
│  │  - Performance monitoring                    │           │
│  └──────────────┬───────────────────────────────┘           │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Connection Pool                                    │
│  ┌──────────────────────────────────────────────┐           │
│  │  Connection 1  ──┐                           │           │
│  │  Connection 2  ──┤                           │           │
│  │  Connection 3  ──┤  Shared Pool              │           │
│  │  Connection 4  ──┤  (Optimized for           │           │
│  │  Connection 5  ──┤   concurrent access)      │           │
│  │  ...           ──┘                           │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                         │
│  - Optimized queries                                         │
│  - Proper indexes                                            │
│  - Connection pooling                                        │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Design Adaptation

```
┌─────────────────────────────────────────────────────────────┐
│  User Device Detection                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Mobile  │ │  Tablet  │ │ Desktop  │
│  <768px  │ │ 768-1024 │ │  >1024px │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Touch UI │ │ Hybrid   │ │ Full UI  │
│ 44x44px  │ │ Mixed    │ │ Mouse    │
│ targets  │ │ targets  │ │ optimized│
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Responsive Layout                                           │
│  - Flexible grid                                             │
│  - Adaptive navigation                                       │
│  - Optimized images                                          │
│  - Touch-friendly controls                                   │
└─────────────────────────────────────────────────────────────┘
```

## System Health Monitoring

```
┌─────────────────────────────────────────────────────────────┐
│  Continuous Monitoring                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Database │ │   API    │ │  Cache   │
│  Health  │ │  Health  │ │  Health  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Check    │ │ Response │ │ Hit Rate │
│ Connect  │ │ Times    │ │ Monitor  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Performance Metrics                                         │
│  - Average response time                                     │
│  - Success rate                                              │
│  - Error rate                                                │
│  - Slow operations                                           │
│  - Cache efficiency                                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Alerts & Logging                                            │
│  - Slow operations logged                                    │
│  - Errors tracked                                            │
│  - Performance degradation detected                          │
└─────────────────────────────────────────────────────────────┘
```

## Legend

```
┌─────────┐
│  Box    │  = Process or Component
└─────────┘

    │
    ▼         = Flow Direction

────Yes───┐   = Conditional Branch
────No────┤

┌──────────────────────┐
│  Multiple Processes  │  = Parallel Operations
└──────────────────────┘
```

## Key Takeaways

1. **Session Management**: Automatic timeout with activity tracking
2. **Navigation Protection**: Middleware enforces authentication
3. **Shared Links**: Always redirect to home page
4. **Performance**: Multi-layer optimization (cache, pool, dedupe)
5. **Concurrent Users**: Connection pooling and rate limiting
6. **Responsive Design**: Adaptive UI for all devices
7. **Monitoring**: Continuous health checks and metrics

All flows work together to create a secure, fast, and user-friendly system that handles 20+ concurrent users efficiently.
