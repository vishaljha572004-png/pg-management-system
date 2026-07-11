const http = require('https');

const data = JSON.stringify({
  email: 'superadmin@pg.com',
  password: 'superadmin123'
});

const options = {
  hostname: 'pg-management-system-pwkv.onrender.com',
  port: 443,
  path: '/api/auth/super-admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
