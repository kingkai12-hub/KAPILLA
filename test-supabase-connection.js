import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing Supabase PostgreSQL connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase successfully!\n');

    // Test 2: Count records in each table
    console.log('2️⃣ Checking database tables...');

    const userCount = await prisma.user.count();
    console.log(`   Users: ${userCount}`);

    const shipmentCount = await prisma.shipment.count();
    console.log(`   Shipments: ${shipmentCount}`);

    const invoiceCount = await prisma.invoice.count();
    console.log(`   Invoices: ${invoiceCount}`);

    const documentCount = await prisma.document.count();
    console.log(`   Documents: ${documentCount}`);

    const trackingCount = await prisma.vehicleTracking.count();
    console.log(`   Vehicle Tracking: ${trackingCount}`);

    console.log('\n✅ All tables accessible!\n');

    // Test 3: Query performance
    console.log('3️⃣ Testing query performance...');
    const start = Date.now();
    await prisma.shipment.findMany({ take: 10 });
    const duration = Date.now() - start;
    console.log(`   Query time: ${duration}ms`);

    if (duration < 500) {
      console.log('   ✅ Excellent performance!');
    } else if (duration < 1000) {
      console.log('   ⚠️  Acceptable performance');
    } else {
      console.log('   ❌ Slow performance - check connection pooling');
    }

    // Test 4: Check connection pool
    console.log('\n4️⃣ Connection info:');
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl.includes('pooler.supabase.com')) {
      console.log('   ✅ Using Supabase connection pooler');
    } else {
      console.log('   ⚠️  Not using connection pooler');
    }

    console.log('\n✅ All tests passed! Supabase is properly connected.\n');
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check your DATABASE_URL in .env file');
    console.error('2. Verify Supabase project is active');
    console.error('3. Check if database password is correct');
    console.error('4. Ensure your IP is allowed in Supabase settings');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
