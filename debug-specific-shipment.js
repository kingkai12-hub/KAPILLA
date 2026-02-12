// Debug specific shipment tracking
const http = require('http');

// Check if shipment exists
const checkShipment = (waybill) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/shipments/${waybill}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`\n=== Shipment ${waybill} ===`);
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => console.error('Error:', error));
  req.end();
};

// Check tracking for shipment
const checkTracking = (waybill) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/vehicle-tracking?waybill=${waybill}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`\n=== Tracking for ${waybill} ===`);
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => console.error('Error:', error));
  req.end();
};

console.log('=== Debugging Shipment KPL-26020005 ===');
checkShipment('KPL-26020005');
checkTracking('KPL-26020005');

// Also check our test shipments
console.log('\n=== Checking Test Shipments ===');
checkShipment('KPL-26020002');
checkShipment('KPL-26020003');
checkShipment('KPL-26020004');
