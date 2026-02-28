/**
 * Concurrent User Load Testing Script
 * Tests system performance with 20+ concurrent users
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const NUM_USERS = parseInt(process.env.NUM_USERS || '25', 10);
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60', 10); // seconds

// Test scenarios
const scenarios = [
  {
    name: 'Login',
    weight: 0.1,
    async execute(userId) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${userId}@kapilla.com`,
          password: 'test123',
        }),
      });
      return res.status;
    },
  },
  {
    name: 'Search Shipment',
    weight: 0.3,
    async execute() {
      const waybill = `KPL-${Math.floor(Math.random() * 10000)}`;
      const res = await fetch(`${BASE_URL}/api/shipments/${waybill}`);
      return res.status;
    },
  },
  {
    name: 'List Shipments',
    weight: 0.2,
    async execute() {
      const res = await fetch(`${BASE_URL}/api/shipments?page=1&limit=20`);
      return res.status;
    },
  },
  {
    name: 'Get Dashboard Stats',
    weight: 0.2,
    async execute() {
      const res = await fetch(`${BASE_URL}/api/dashboard/stats`);
      return res.status;
    },
  },
  {
    name: 'Health Check',
    weight: 0.2,
    async execute() {
      const res = await fetch(`${BASE_URL}/api/health`);
      return res.status;
    },
  },
];

// Results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  byScenario: {},
};

// Initialize scenario results
scenarios.forEach((s) => {
  results.byScenario[s.name] = {
    requests: 0,
    successes: 0,
    failures: 0,
    avgResponseTime: 0,
    responseTimes: [],
  };
});

/**
 * Select random scenario based on weights
 */
function selectScenario() {
  const random = Math.random();
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }

  return scenarios[0];
}

/**
 * Simulate a single user
 */
async function simulateUser(userId) {
  const startTime = Date.now();
  const endTime = startTime + TEST_DURATION * 1000;

  console.log(`User ${userId} started`);

  while (Date.now() < endTime) {
    const scenario = selectScenario();
    const requestStart = Date.now();

    try {
      const status = await scenario.execute(userId);
      const responseTime = Date.now() - requestStart;

      results.totalRequests++;
      results.responseTimes.push(responseTime);
      results.byScenario[scenario.name].requests++;
      results.byScenario[scenario.name].responseTimes.push(responseTime);

      if (status >= 200 && status < 300) {
        results.successfulRequests++;
        results.byScenario[scenario.name].successes++;
      } else {
        results.failedRequests++;
        results.byScenario[scenario.name].failures++;
      }
    } catch (error) {
      results.totalRequests++;
      results.failedRequests++;
      results.byScenario[scenario.name].requests++;
      results.byScenario[scenario.name].failures++;
      results.errors.push({
        scenario: scenario.name,
        error: error.message,
        userId,
      });
    }

    // Random delay between requests (0.5-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500));
  }

  console.log(`User ${userId} finished`);
}

/**
 * Calculate statistics
 */
function calculateStats() {
  // Overall stats
  const avgResponseTime =
    results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const sortedTimes = [...results.responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

  // Per-scenario stats
  for (const name in results.byScenario) {
    const scenario = results.byScenario[name];
    if (scenario.responseTimes.length > 0) {
      scenario.avgResponseTime =
        scenario.responseTimes.reduce((a, b) => a + b, 0) / scenario.responseTimes.length;
    }
  }

  return {
    avgResponseTime,
    p50,
    p95,
    p99,
  };
}

/**
 * Print results
 */
function printResults() {
  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\nTest Configuration:`);
  console.log(`  Concurrent Users: ${NUM_USERS}`);
  console.log(`  Duration: ${TEST_DURATION}s`);
  console.log(`  Base URL: ${BASE_URL}`);

  const stats = calculateStats();

  console.log(`\nOverall Performance:`);
  console.log(`  Total Requests: ${results.totalRequests}`);
  console.log(
    `  Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)`
  );
  console.log(
    `  Failed: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(2)}%)`
  );
  console.log(`  Requests/sec: ${(results.totalRequests / TEST_DURATION).toFixed(2)}`);

  console.log(`\nResponse Times:`);
  console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
  console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`  P99: ${stats.p99.toFixed(2)}ms`);

  console.log(`\nBy Scenario:`);
  for (const name in results.byScenario) {
    const scenario = results.byScenario[name];
    console.log(`  ${name}:`);
    console.log(`    Requests: ${scenario.requests}`);
    console.log(
      `    Success Rate: ${((scenario.successes / scenario.requests) * 100).toFixed(2)}%`
    );
    console.log(`    Avg Response Time: ${scenario.avgResponseTime.toFixed(2)}ms`);
  }

  if (results.errors.length > 0) {
    console.log(`\nErrors (showing first 10):`);
    results.errors.slice(0, 10).forEach((err, i) => {
      console.log(`  ${i + 1}. [${err.scenario}] User ${err.userId}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Performance assessment
  const successRate = (results.successfulRequests / results.totalRequests) * 100;
  console.log('\nPerformance Assessment:');

  if (successRate >= 99 && stats.p95 < 1000) {
    console.log('  ✅ EXCELLENT - System handles concurrent load very well');
  } else if (successRate >= 95 && stats.p95 < 2000) {
    console.log('  ✓ GOOD - System performs well under load');
  } else if (successRate >= 90 && stats.p95 < 3000) {
    console.log('  ⚠ ACCEPTABLE - Some performance degradation under load');
  } else {
    console.log('  ❌ NEEDS IMPROVEMENT - Significant performance issues detected');
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main test execution
 */
async function runLoadTest() {
  console.log(
    `Starting load test with ${NUM_USERS} concurrent users for ${TEST_DURATION} seconds...`
  );
  console.log(`Target: ${BASE_URL}\n`);

  const startTime = Date.now();

  // Start all users concurrently
  const userPromises = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  // Wait for all users to complete
  await Promise.all(userPromises);

  const totalTime = (Date.now() - startTime) / 1000;
  console.log(`\nTest completed in ${totalTime.toFixed(2)}s`);

  printResults();
}

// Run the test
runLoadTest().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
