// Debug login issues
const http = require('http');

// Check if there are any users
const checkUsers = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Users check response:');
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
    });
  });

  req.on('error', (error) => console.error('Error:', error));
  req.end();
};

// Test login with different credentials
const testLogin = (email, password) => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`\nLogin test for ${email}:`);
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => console.error('Error:', error));
  req.write(JSON.stringify({ email, password }));
  req.end();
};

console.log('=== Debug Login Issues ===');
checkUsers();

// Test common login credentials
setTimeout(() => {
  console.log('\n=== Testing Login Credentials ===');
  testLogin('admin@kapilla.com', 'admin123');
  testLogin('admin@kapilla.com', 'password');
  testLogin('staff@kapilla.com', 'staff123');
  testLogin('test@example.com', 'test123');
}, 2000);
