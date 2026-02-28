// Test various invoice creation scenarios
const http = require('http');

function testInvoice(testName, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/invoices-new',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${testName}`);
    console.log('='.repeat(60));
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          
          if (res.statusCode === 200) {
            console.log(`✅ PASS - Status: ${res.statusCode}`);
            console.log(`   Invoice: ${json.invoiceNumber}`);
            console.log(`   Total: ${json.total} ${json.currency}`);
            resolve({ success: true, data: json });
          } else {
            console.log(`❌ FAIL - Status: ${res.statusCode}`);
            console.log(`   Error: ${json.error}`);
            if (json.details) console.log(`   Details: ${json.details}`);
            resolve({ success: false, error: json });
          }
        } catch (e) {
          console.log(`❌ FAIL - Invalid JSON response`);
          console.log(`   Response: ${responseData}`);
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ FAIL - Request error: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 INVOICE API TEST SUITE');
  console.log('Testing various invoice creation scenarios...\n');

  const tests = [
    // Test 1: Basic proforma invoice
    {
      name: 'Basic Proforma Invoice',
      payload: {
        type: 'PROFORMA',
        customerName: 'Test Customer 1',
        customerEmail: 'test1@example.com',
        taxRate: 18,
        discount: 0,
        items: [
          { description: 'Service A', quantity: 1, unitPrice: 50000 }
        ]
      }
    },

    // Test 2: Final invoice with multiple items
    {
      name: 'Final Invoice with Multiple Items',
      payload: {
        type: 'FINAL',
        customerName: 'Test Customer 2',
        customerEmail: 'test2@example.com',
        customerPhone: '+255123456789',
        customerAddress: '123 Test Street, Dar es Salaam',
        customerTIN: 'TIN123456',
        taxRate: 18,
        discount: 5000,
        notes: 'Thank you for your business',
        terms: 'Payment due within 30 days',
        items: [
          { description: 'Product A', quantity: 2, unitPrice: 25000 },
          { description: 'Product B', quantity: 1, unitPrice: 75000 },
          { description: 'Service C', quantity: 3, unitPrice: 10000 }
        ]
      }
    },

    // Test 3: Invoice with dates
    {
      name: 'Invoice with Due Date and Valid Until',
      payload: {
        type: 'PROFORMA',
        customerName: 'Test Customer 3',
        customerEmail: 'test3@example.com',
        dueDate: '2026-03-16',
        validUntil: '2026-03-01',
        taxRate: 18,
        discount: 0,
        items: [
          { description: 'Consulting Services', quantity: 10, unitPrice: 50000 }
        ]
      }
    },

    // Test 4: Invoice with zero tax
    {
      name: 'Invoice with Zero Tax',
      payload: {
        type: 'FINAL',
        customerName: 'Test Customer 4',
        customerEmail: 'test4@example.com',
        taxRate: 0,
        discount: 0,
        items: [
          { description: 'Tax-exempt Item', quantity: 1, unitPrice: 100000 }
        ]
      }
    },

    // Test 5: Invoice with decimal quantities
    {
      name: 'Invoice with Decimal Quantities',
      payload: {
        type: 'PROFORMA',
        customerName: 'Test Customer 5',
        customerEmail: 'test5@example.com',
        taxRate: 18,
        discount: 0,
        items: [
          { description: 'Material (per kg)', quantity: 2.5, unitPrice: 20000 },
          { description: 'Labor (per hour)', quantity: 3.75, unitPrice: 15000 }
        ]
      }
    },

    // Test 6: Missing customer name (should fail)
    {
      name: 'Missing Customer Name (Expected to Fail)',
      payload: {
        type: 'PROFORMA',
        customerEmail: 'test6@example.com',
        taxRate: 18,
        discount: 0,
        items: [
          { description: 'Test Item', quantity: 1, unitPrice: 10000 }
        ]
      }
    },

    // Test 7: Empty items array (should fail)
    {
      name: 'Empty Items Array (Expected to Fail)',
      payload: {
        type: 'PROFORMA',
        customerName: 'Test Customer 7',
        customerEmail: 'test7@example.com',
        taxRate: 18,
        discount: 0,
        items: []
      }
    },

    // Test 8: Large invoice
    {
      name: 'Large Invoice with Many Items',
      payload: {
        type: 'FINAL',
        customerName: 'Test Customer 8',
        customerEmail: 'test8@example.com',
        taxRate: 18,
        discount: 10000,
        items: Array.from({ length: 20 }, (_, i) => ({
          description: `Item ${i + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unitPrice: Math.floor(Math.random() * 50000) + 10000
        }))
      }
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testInvoice(test.name, test.payload);
    results.push({ name: test.name, ...result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('⚠️  Some tests failed. Review the details above.');
  }
  
  console.log('='.repeat(60) + '\n');
}

runTests().catch(console.error);
