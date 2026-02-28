// Test the actual invoice API endpoint
const http = require('http');

const payload = JSON.stringify({
  type: 'PROFORMA',
  customerName: 'Test Customer API',
  customerEmail: 'test@example.com',
  customerPhone: '+255123456789',
  taxRate: 18,
  discount: 0,
  currency: 'TZS',
  notes: 'Test invoice from API',
  items: [
    {
      description: 'Test Service',
      quantity: 1,
      unitPrice: 100000
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/invoices-new',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('Testing invoice creation API...\n');
console.log('Endpoint: POST http://localhost:3000/api/invoices-new');
console.log('Payload:', JSON.parse(payload));
console.log('\nSending request...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 200) {
        console.log('\n✅ SUCCESS! Invoice created successfully!');
        console.log('Invoice ID:', json.id);
        console.log('Invoice Number:', json.invoiceNumber);
      } else {
        console.log('\n❌ ERROR! Failed to create invoice');
        console.log('Error:', json.error);
        if (json.details) console.log('Details:', json.details);
        if (json.stack) console.log('Stack:', json.stack);
      }
    } catch (e) {
      console.log(data);
      console.log('\n❌ ERROR! Invalid JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(payload);
req.end();
