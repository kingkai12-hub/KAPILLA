// Test invoice creation with authentication simulation
const http = require('http');

console.log('🔐 Testing Invoice Creation with Authentication\n');
console.log('This test simulates a browser request with cookies.\n');

// First, let's try without auth to see the error
function testWithoutAuth() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      type: 'PROFORMA',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      taxRate: 18,
      discount: 0,
      items: [
        { description: 'Test Item', quantity: 1, unitPrice: 10000 }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/invoices-new',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/staff/invoices/create'
      }
    };

    console.log('TEST 1: Without Authentication Cookies');
    console.log('=' .repeat(60));

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Response:', data);
        }
        
        if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('\n❌ AUTHENTICATION REQUIRED');
          console.log('This is the issue! You need to be logged in.\n');
        } else if (res.statusCode === 200) {
          console.log('\n✅ SUCCESS (No auth required)\n');
        } else {
          console.log(`\n⚠️  Unexpected status: ${res.statusCode}\n`);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Test CSRF protection
function testCSRF() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      type: 'PROFORMA',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      taxRate: 18,
      discount: 0,
      items: [
        { description: 'Test Item', quantity: 1, unitPrice: 10000 }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/invoices-new',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Origin': 'http://evil-site.com',  // Wrong origin
        'Host': 'localhost:3000'
      }
    };

    console.log('\nTEST 2: CSRF Protection Check');
    console.log('=' .repeat(60));
    console.log('Sending request with wrong origin...\n');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 403) {
          console.log('✅ CSRF protection working (403 Forbidden)\n');
        } else {
          console.log(`⚠️  Expected 403, got ${res.statusCode}\n`);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

// Test with correct origin
function testWithCorrectOrigin() {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      type: 'PROFORMA',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      taxRate: 18,
      discount: 0,
      items: [
        { description: 'Test Item', quantity: 1, unitPrice: 10000 }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/invoices-new',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Origin': 'http://localhost:3000',
        'Host': 'localhost:3000'
      }
    };

    console.log('\nTEST 3: With Correct Origin');
    console.log('=' .repeat(60));

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS! Invoice created');
            console.log(`Invoice Number: ${json.invoiceNumber}`);
          } else {
            console.log('Response:', JSON.stringify(json, null, 2));
          }
        } catch (e) {
          console.log('Response:', data);
        }
        
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function runTests() {
  await testWithoutAuth();
  await testCSRF();
  await testWithCorrectOrigin();
  
  console.log('=' .repeat(60));
  console.log('DIAGNOSIS COMPLETE\n');
  console.log('If you see "Failed to create invoice" in the browser:');
  console.log('');
  console.log('1. Check if you are logged in at /staff/login');
  console.log('2. Open browser DevTools (F12) and check:');
  console.log('   - Console tab for JavaScript errors');
  console.log('   - Network tab for the API request');
  console.log('   - Look for the response status and body');
  console.log('');
  console.log('3. Common issues:');
  console.log('   - 401: Not logged in (go to /staff/login)');
  console.log('   - 403: CSRF protection (check Origin header)');
  console.log('   - 429: Rate limit (wait a minute)');
  console.log('   - 500: Server error (check server console)');
  console.log('');
  console.log('4. To see the EXACT error:');
  console.log('   - Open /staff/invoices/create in browser');
  console.log('   - Press F12 to open DevTools');
  console.log('   - Go to Console tab');
  console.log('   - Try to create invoice');
  console.log('   - Copy the error message');
  console.log('=' .repeat(60));
}

runTests();
