// Test the shipment tracking API directly
const http = require('http');

const testWaybill = 'KPL-8829';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/shipments/${testWaybill}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response data:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (jsonData && jsonData.waybillNumber) {
        console.log('\n✅ SUCCESS: Shipment tracking is working!');
        console.log(`Waybill: ${jsonData.waybillNumber}`);
        console.log(`Status: ${jsonData.currentStatus}`);
        console.log(`Origin: ${jsonData.origin}`);
        console.log(`Destination: ${jsonData.destination}`);
        console.log(`Events: ${jsonData.events ? jsonData.events.length : 0}`);
        console.log(`Trips: ${jsonData.trips ? jsonData.trips.length : 0}`);
      } else {
        console.log('\n❌ ERROR: Invalid response format');
      }
    } catch (error) {
      console.log('Error parsing JSON:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('\n❌ Server is not running. Please start the development server first.');
  }
});

req.end();
