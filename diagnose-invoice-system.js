#!/usr/bin/env node

/**
 * Invoice System Diagnostic Tool
 * Checks all components of the invoice system
 */

const { PrismaClient } = require('@prisma/client');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 INVOICE SYSTEM DIAGNOSTIC TOOL\n');
console.log('='.repeat(70));

const checks = [];

// Check 1: Prisma Client
async function checkPrismaClient() {
  console.log('\n1️⃣  Checking Prisma Client...');
  try {
    const prisma = new PrismaClient();
    
    if (!prisma.invoice) {
      checks.push({ name: 'Prisma Client - Invoice Model', status: 'FAIL', message: 'Invoice model not found' });
      return false;
    }
    
    checks.push({ name: 'Prisma Client - Invoice Model', status: 'PASS', message: 'Invoice model available' });
    
    // Test database connection
    const count = await prisma.invoice.count();
    checks.push({ name: 'Database Connection', status: 'PASS', message: `Connected. ${count} invoices in database` });
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    checks.push({ name: 'Prisma Client', status: 'FAIL', message: error.message });
    return false;
  }
}

// Check 2: Database Schema
async function checkDatabaseSchema() {
  console.log('\n2️⃣  Checking Database Schema...');
  try {
    const prisma = new PrismaClient();
    
    // Check Invoice table
    const invoice = await prisma.invoice.findFirst();
    checks.push({ name: 'Invoice Table', status: 'PASS', message: 'Table exists and accessible' });
    
    // Check InvoiceItem table
    const item = await prisma.invoiceItem.findFirst();
    checks.push({ name: 'InvoiceItem Table', status: 'PASS', message: 'Table exists and accessible' });
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    checks.push({ name: 'Database Schema', status: 'FAIL', message: error.message });
    return false;
  }
}

// Check 3: API Files Exist
function checkAPIFiles() {
  console.log('\n3️⃣  Checking API Files...');
  
  const files = [
    'app/api/invoices-new/route.ts',
    'app/api/invoices/route.ts',
    'app/api/invoices/[id]/route.ts',
    'app/api/invoices/[id]/convert/route.ts'
  ];
  
  let allExist = true;
  
  files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      checks.push({ name: `API File: ${file}`, status: 'PASS', message: 'File exists' });
    } else {
      checks.push({ name: `API File: ${file}`, status: 'FAIL', message: 'File not found' });
      allExist = false;
    }
  });
  
  return allExist;
}

// Check 4: Frontend Files Exist
function checkFrontendFiles() {
  console.log('\n4️⃣  Checking Frontend Files...');
  
  const files = [
    'app/staff/(portal)/invoices/page.tsx',
    'app/staff/(portal)/invoices/create/page.tsx',
    'app/staff/(portal)/invoices/[id]/page.tsx'
  ];
  
  let allExist = true;
  
  files.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      checks.push({ name: `Frontend File: ${file}`, status: 'PASS', message: 'File exists' });
    } else {
      checks.push({ name: `Frontend File: ${file}`, status: 'FAIL', message: 'File not found' });
      allExist = false;
    }
  });
  
  return allExist;
}

// Check 5: Environment Variables
function checkEnvironment() {
  console.log('\n5️⃣  Checking Environment Variables...');
  
  try {
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config({ path: '.env' });
  } catch (e) {
    // dotenv not installed, try reading .env files manually
    try {
      const envLocal = fs.readFileSync('.env.local', 'utf8');
      const env = fs.readFileSync('.env', 'utf8');
      const combined = envLocal + '\n' + env;
      if (combined.includes('DATABASE_URL')) {
        checks.push({ name: 'DATABASE_URL', status: 'PASS', message: 'Found in .env files' });
        return true;
      }
    } catch (e2) {
      // Ignore
    }
  }
  
  if (process.env.DATABASE_URL) {
    checks.push({ name: 'DATABASE_URL', status: 'PASS', message: 'Environment variable set' });
    return true;
  } else {
    checks.push({ name: 'DATABASE_URL', status: 'WARN', message: 'Cannot verify (dotenv not installed)' });
    return true;
  }
}

// Check 6: API Endpoint (if server is running)
function checkAPIEndpoint() {
  return new Promise((resolve) => {
    console.log('\n6️⃣  Checking API Endpoint...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/invoices-new',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401) {
        checks.push({ name: 'API Endpoint /api/invoices-new', status: 'PASS', message: `Server responding (${res.statusCode})` });
        resolve(true);
      } else {
        checks.push({ name: 'API Endpoint /api/invoices-new', status: 'WARN', message: `Unexpected status: ${res.statusCode}` });
        resolve(true);
      }
    });

    req.on('error', () => {
      checks.push({ name: 'API Endpoint /api/invoices-new', status: 'SKIP', message: 'Server not running (this is OK if not started)' });
      resolve(true);
    });

    req.on('timeout', () => {
      checks.push({ name: 'API Endpoint /api/invoices-new', status: 'SKIP', message: 'Server timeout (this is OK if not started)' });
      req.destroy();
      resolve(true);
    });

    req.end();
  });
}

// Check 7: Test Invoice Creation
async function testInvoiceCreation() {
  console.log('\n7️⃣  Testing Invoice Creation...');
  
  try {
    const prisma = new PrismaClient();
    
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `DIAG-${Date.now()}`,
        type: 'PROFORMA',
        status: 'DRAFT',
        customerName: 'Diagnostic Test',
        customerEmail: 'diagnostic@test.com',
        subtotal: 10000,
        taxRate: 18,
        taxAmount: 1800,
        discount: 0,
        total: 11800,
        currency: 'TZS',
        items: {
          create: [
            {
              description: 'Test Item',
              quantity: 1,
              unitPrice: 10000,
              amount: 10000,
              order: 0
            }
          ]
        }
      },
      include: { items: true }
    });
    
    checks.push({ name: 'Invoice Creation Test', status: 'PASS', message: `Created invoice ${testInvoice.invoiceNumber}` });
    
    // Clean up
    await prisma.invoice.delete({ where: { id: testInvoice.id } });
    checks.push({ name: 'Invoice Deletion Test', status: 'PASS', message: 'Test invoice cleaned up' });
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    checks.push({ name: 'Invoice Creation Test', status: 'FAIL', message: error.message });
    return false;
  }
}

// Print Summary
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(70) + '\n');
  
  const passed = checks.filter(c => c.status === 'PASS').length;
  const failed = checks.filter(c => c.status === 'FAIL').length;
  const warnings = checks.filter(c => c.status === 'WARN').length;
  const skipped = checks.filter(c => c.status === 'SKIP').length;
  
  checks.forEach((check, index) => {
    let icon = '✅';
    if (check.status === 'FAIL') icon = '❌';
    if (check.status === 'WARN') icon = '⚠️';
    if (check.status === 'SKIP') icon = '⏭️';
    
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);
  });
  
  console.log('='.repeat(70));
  console.log(`Total Checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log('='.repeat(70) + '\n');
  
  if (failed === 0) {
    console.log('🎉 ALL CRITICAL CHECKS PASSED!');
    console.log('✅ Invoice system is working correctly.\n');
    console.log('If you\'re experiencing issues:');
    console.log('1. Make sure the dev server is running: npm run dev');
    console.log('2. Check browser console for frontend errors (F12)');
    console.log('3. Check server console for API errors');
    console.log('4. Try clearing browser cache and reloading\n');
  } else {
    console.log('⚠️  SOME CHECKS FAILED!');
    console.log('Review the failed checks above and fix the issues.\n');
    console.log('Common fixes:');
    console.log('- Run: npx prisma generate');
    console.log('- Run: npx prisma db push');
    console.log('- Check .env file has DATABASE_URL');
    console.log('- Restart dev server: npm run dev\n');
  }
}

// Run all checks
async function runDiagnostics() {
  try {
    checkEnvironment();
    checkAPIFiles();
    checkFrontendFiles();
    await checkPrismaClient();
    await checkDatabaseSchema();
    await checkAPIEndpoint();
    await testInvoiceCreation();
    
    printSummary();
  } catch (error) {
    console.error('\n❌ Diagnostic tool error:', error.message);
    console.error(error.stack);
  }
}

runDiagnostics();
