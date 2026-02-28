// Test script to verify Invoice model is accessible
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInvoiceModel() {
  console.log('Testing Invoice model...');
  
  try {
    // Check if Invoice model exists
    if (!prisma.invoice) {
      console.error('❌ Invoice model NOT found in Prisma client');
      console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
      process.exit(1);
    }
    
    console.log('✅ Invoice model found in Prisma client');
    
    // Try to count invoices
    const count = await prisma.invoice.count();
    console.log(`✅ Invoice count query successful: ${count} invoices`);
    
    // Try to find invoices
    const invoices = await prisma.invoice.findMany({ take: 1 });
    console.log(`✅ Invoice findMany query successful: ${invoices.length} invoices returned`);
    
    console.log('\n✅ All tests passed! Invoice model is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing Invoice model:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceModel();
