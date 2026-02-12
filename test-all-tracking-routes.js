// Comprehensive test of all tracking routes
const http = require('http');

const testRoute = (path, description) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`\n=== ${description} ===`);
      console.log('Status:', res.statusCode);
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('Success: Response received');
          if (response.waybillNumber) {
            console.log('Waybill:', response.waybillNumber);
          }
          if (response.route) {
            console.log('Route points:', response.route.length);
          }
          if (response.currentPosition) {
            console.log('Current position:', response.currentPosition);
          }
        } catch (e) {
          console.log('Response (not JSON):', data.substring(0, 200));
        }
      } else {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => console.error('Error:', error));
  req.end();
};

console.log('=== Testing All Tracking Routes ===\n');

// Test main tracking page
testRoute('/tracking', 'Main Tracking Page (/tracking)');

// Test tracking map page
testRoute('/tracking/map', 'Tracking Map Page (/tracking/map)');

// Test individual tracking pages
testRoute('/tracking/map/KPL-26020002', 'Individual Tracking KPL-26020002');
testRoute('/tracking/map/KPL-26020003', 'Individual Tracking KPL-26020003');
testRoute('/tracking/map/KPL-26020004', 'Individual Tracking KPL-26020004');
testRoute('/tracking/map/KPL-26020005', 'Individual Tracking KPL-26020005');

// Test waybill page
testRoute('/waybill/KPL-26020005', 'Waybill Page KPL-26020005');

console.log('\n=== Test Complete ===');
console.log('Check browser console for any JavaScript errors');
console.log('Visit: http://localhost:3000/tracking/map/KPL-26020005');
