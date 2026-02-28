// Test script to verify Invoice creation works
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testInvoiceCreate() {
  console.log('Testing Invoice creation...\n');
  
  try {
    // Test 1: Check if Invoice model exists
    console.log('1. Checking if Invoice model exists...');
    if (!prisma.invoice) {
      console.error('❌ Invoice model NOT found');
      process.exit(1);
    }
    console.log('✅ Invoice model found\n');
    
    // Test 2: Try to count invoices
    console.log('2. Testing database connection...');
    const count = await prisma.invoice.count();
    console.log(`✅ Database connected. Current invoice count: ${count}\n`);
    
    // Test 3: Try to create a test invoice
    console.log('3. Creating test invoice...');
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `TEST-${Date.now()}`,
        type: 'PROFORMA',
        status: 'DRAFT',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        subtotal: 100000,
        taxRate: 18,
        taxAmount: 18000,
        discount: 0,
        total: 118000,
        currency: 'TZS',
        items: {
          create: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 100000,
              amount: 100000,
              order: 0
            }
          ]
        }
      },
      include: {
        items: true
      }
    });
    
    console.log('✅ Invoice created successfully!');
    console.log('Invoice ID:', testInvoice.id);
    console.log('Invoice Number:', testInvoice.invoiceNumber);
    console.log('Items:', testInvoice.items.length);
    console.log('\n4. Cleaning up test invoice...');
    
    // Clean up
    await prisma.invoice.delete({
      where: { id: testInvoice.id }
    });
    
    console.log('✅ Test invoice deleted\n');
    console.log('✅✅✅ ALL TESTS PASSED! Invoice system is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceCreate();
