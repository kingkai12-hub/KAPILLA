// Simple test to debug the tracking API
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/vehicle-tracking?waybill=KPL-26020003',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
